'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Download,
  Upload,
  RotateCcw,
  PhoneCall,
  Edit,
  Trash2,
  Eye,
  PlusCircle,
  CheckCircle,
  Filter,
  ChevronDown,
  Check,
  StickyNote,
  Clock,
  PenLine,
  FileDown,
  X,
  MessageSquare,
  Mail,
  Users,
} from 'lucide-react';
import { useLeads, useLeadSources, useProductGroups, useInteractionLogs, useCampaigns } from '@/lib/api-hooks';
import { lead_status, Lead, interaction_type } from '@/lib/types';
import { exportLeadsToExcel, parseExcelToLeads, downloadLeadTemplate } from '@/lib/excel-utils';

// Status labels in Vietnamese
const statusLabels: Record<lead_status, string> = {
  new: 'Mới',
  calling: 'Đang gọi',
  no_answer: 'Không nghe máy',
  closed: 'Đã chốt',
  rejected: 'Từ chối',
};

const statusColors: Record<lead_status, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  calling: 'bg-amber-50 text-amber-700 border-amber-200',
  no_answer: 'bg-slate-50 text-slate-700 border-slate-200',
  closed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const interactionTypeLabels: Record<interaction_type, string> = {
  message: 'Tin nhắn',
  call: 'Cuộc gọi',
  email: 'Email',
  meeting: 'Họp',
  note: 'Ghi chú',
};

const interactionTypeIcons: Record<interaction_type, any> = {
  message: MessageSquare,
  call: PhoneCall,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<lead_status | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignedToday, setShowAssignedToday] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { leads, loading, error, count, updateLeadStatus, convertLead, addLead, updateLead, deleteLead, refetch } = useLeads({ status: statusFilter });
  const { sources } = useLeadSources();
  const { productGroups } = useProductGroups();
  const { campaigns } = useCampaigns();

  // Check for filter from URL params
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'assigned_today') {
      setShowAssignedToday(true);
    }
  }, [searchParams]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form states
  const [newLead, setNewLead] = useState({
    full_name: '',
    phone: '',
    email: '',
    demand: '',
    source_id: 0,
    campaign_id: undefined as number | undefined,
    interested_product_group_id: undefined as number | undefined,
  });

  const [editLead, setEditLead] = useState<Partial<Lead>>({});

  const [newInteraction, setNewInteraction] = useState({
    type: 'call' as interaction_type,
    content: '',
    summary: '',
    duration_seconds: undefined as number | undefined,
  });

  const { interactions, addInteraction, refetch: refetchInteractions } = useInteractionLogs(selectedLead?.id);

  const statusOptions: lead_status[] = ['new', 'calling', 'no_answer', 'closed', 'rejected'];

  const handleStatusChange = async (leadId: number, newStatus: lead_status) => {
    await updateLeadStatus(leadId, newStatus);
  };

  const handleConvert = async (leadId: number) => {
    if (confirm('Bạn có chắc muốn chuyển lead này thành khách hàng?')) {
      const result = await convertLead(leadId);
      if (result) {
        alert(`Đã chuyển thành khách hàng! Customer ID: ${result.customer_id}`);
      }
    }
  };

  const handleAddLead = async () => {
    if (!newLead.full_name || !newLead.phone || !newLead.source_id) {
      alert('Vui lòng điền đầy đủ thông tin (Họ tên, SĐT, Nguồn)!');
      return;
    }

    // Clean up empty strings to undefined for validation
    const leadData = {
      ...newLead,
      email: newLead.email?.trim() || undefined,
      demand: newLead.demand?.trim() || undefined,
    };

    const success = await addLead(leadData);
    if (success) {
      setIsAddModalOpen(false);
      setNewLead({
        full_name: '',
        phone: '',
        email: '',
        demand: '',
        source_id: sources[0]?.id || 0,
        campaign_id: undefined,
        interested_product_group_id: undefined,
      });
    }
  };

  const handleEditLead = async () => {
    if (!selectedLead) return;

    const success = await updateLead(selectedLead.id, editLead);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedLead(null);
      setEditLead({});
    }
  };

  const handleDeleteLead = async (leadId: number, leadName: string) => {
    if (confirm(`Bạn có chắc muốn xóa lead "${leadName}"?`)) {
      const success = await deleteLead(leadId);
      if (success) {
        alert('Đã xóa lead thành công!');
      }
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditLead({
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      demand: lead.demand,
      source_id: lead.source_id,
      campaign_id: lead.campaign_id,
      interested_product_group_id: lead.interested_product_group_id,
      status: lead.status,
    });
    setIsEditModalOpen(true);
  };

  const handleAddInteractionClick = (lead: Lead) => {
    setSelectedLead(lead);
    setNewInteraction({
      type: 'call',
      content: '',
      summary: '',
      duration_seconds: undefined,
    });
    setIsInteractionModalOpen(true);
  };

  const handleAddInteraction = async () => {
    if (!selectedLead || !newInteraction.content) {
      alert('Vui lòng điền nội dung tương tác!');
      return;
    }

    const success = await addInteraction({
      lead_id: selectedLead.id,
      type: newInteraction.type,
      content: newInteraction.content,
      summary: newInteraction.summary,
      duration_seconds: newInteraction.duration_seconds,
      occurred_at: new Date().toISOString(),
    });

    if (success) {
      setIsInteractionModalOpen(false);
      setNewInteraction({
        type: 'call',
        content: '',
        summary: '',
        duration_seconds: undefined,
      });
      alert('Đã thêm tương tác thành công!');
      refetchInteractions();
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const filename = `leads_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportLeadsToExcel(filteredLeads, filename);
  };

  // Excel Import
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedLeads = await parseExcelToLeads(file);

      if (parsedLeads.length === 0) {
        alert('File Excel không có dữ liệu hợp lệ!');
        return;
      }

      if (!confirm(`Tìm thấy ${parsedLeads.length} lead. Bạn có muốn import tất cả?`)) {
        return;
      }

      const defaultSourceId = sources[0]?.id || 0;
      if (!defaultSourceId) {
        alert('Vui lòng tạo ít nhất 1 nguồn lead trước khi import!');
        return;
      }

      let successCount = 0;
      for (const lead of parsedLeads) {
        const success = await addLead({
          ...lead,
          source_id: defaultSourceId,
        });
        if (success) successCount++;
      }

      alert(`Đã import thành công ${successCount}/${parsedLeads.length} lead!`);
      refetch();
    } catch (error) {
      console.error('Import error:', error);
      alert('Có lỗi xảy ra khi import file Excel!');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filtered leads by search and assigned today
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Filter by search query
    if (searchQuery) {
      result = result.filter(lead =>
        lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by assigned today
    if (showAssignedToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter(lead => {
        if (!lead.assigned_at) return false;
        const assignedDate = new Date(lead.assigned_at);
        assignedDate.setHours(0, 0, 0, 0);
        return assignedDate.getTime() === today.getTime();
      });
    }

    return result;
  }, [leads, searchQuery, showAssignedToday]);

  const metrics = useMemo(() => ({
    guests: count,
    orders: leads.filter(l => l.is_converted).length,
    revenue: leads.filter(l => l.is_converted).length * 500000,
  }), [leads, count]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isAssignedToday = (assignedAt?: string) => {
    if (!assignedAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignedDate = new Date(assignedAt);
    assignedDate.setHours(0, 0, 0, 0);
    return assignedDate.getTime() === today.getTime();
  };

  if (loading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Lỗi: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen overflow-y-auto flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Hộp chờ tư vấn</h2>
          <p className="text-slate-500 text-sm">Quản lý và chuyển đổi khách hàng tiềm năng</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all font-medium"
        >
          <PlusCircle size={20} /> Thêm khách hàng mới
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 space-y-4">
        {/* Row 1: Search & Actions */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tất cả (Tên, SĐT, Email...)"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-blue-600 shadow-sm transition-colors"
            >
              <PlusCircle size={16} /> Thêm mới
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download size={16} /> Xuất Excel
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Upload size={16} /> Nhập Excel
            </button>

            <button
              onClick={downloadLeadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
              title="Tải file mẫu Excel"
            >
              <FileDown size={16} /> Mẫu Excel
            </button>

            <button
              onClick={() => { setStatusFilter(undefined); setSearchQuery(''); setShowAssignedToday(false); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Chips */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !statusFilter
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === status
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}

          {/* Assigned Today Filter Badge */}
          {showAssignedToday && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-full text-sm font-medium">
              <span>Vừa phân bổ hôm nay</span>
              <button
                onClick={() => setShowAssignedToday(false)}
                className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                title="Xóa bộ lọc"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Row 3: Counters */}
        <div className="flex gap-6 border-t border-slate-100 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-semibold">Khách hàng</span>
            <span className="text-xl font-bold text-slate-800">{metrics.guests}</span>
          </div>
          <div className="flex flex-col border-l pl-6 border-slate-100">
            <span className="text-xs text-slate-500 uppercase font-semibold">Đơn hàng</span>
            <span className="text-xl font-bold text-accent">{metrics.orders}</span>
          </div>
          <div className="flex flex-col border-l pl-6 border-slate-100">
            <span className="text-xs text-slate-500 uppercase font-semibold">Doanh số (tạm tính)</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(metrics.revenue)}</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold whitespace-nowrap">
                <th className="p-4 w-24">Mã KH</th>
                <th className="p-4">Họ và tên</th>
                <th className="p-4">SĐT</th>
                <th className="p-4">Email</th>
                <th className="p-4">Nguồn</th>
                <th className="p-4">Chiến dịch</th>
                <th className="p-4">Nhãn nguồn</th>
                <th className="p-4">Nhóm SP</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">NV Sale</th>
                <th className="p-4">Liên hệ cuối</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`transition-colors text-sm ${
                      isAssignedToday(lead.assigned_at)
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-4 font-medium text-slate-700">#{lead.id}</td>
                    <td className="p-4 font-medium text-slate-900">{lead.full_name}</td>
                    <td className="p-4 text-slate-600">{lead.phone}</td>
                    <td className="p-4 text-slate-500">{lead.email || '-'}</td>
                    <td className="p-4">
                      <div className="text-slate-900 font-medium text-xs">{lead.lead_sources?.name || '-'}</div>
                      {lead.lead_sources?.type && (
                        <div className="text-slate-500 text-xs mt-0.5">{lead.lead_sources.type}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-xs">{lead.campaigns?.name || '-'}</td>
                    <td className="p-4 text-slate-500 text-xs">{lead.source_label || '-'}</td>
                    <td className="p-4 text-slate-600 text-xs">{lead.product_groups?.name || '-'}</td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as lead_status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[lead.status]}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-slate-600 text-xs">{lead.sales_employees?.full_name || '-'}</td>
                    <td className="p-4 text-slate-500 text-xs">{formatDateShort(lead.last_contacted_at)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(lead)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditClick(lead)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleAddInteractionClick(lead)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="Thêm tương tác"
                        >
                          <PhoneCall size={16} />
                        </button>
                        {lead.status === 'closed' && !lead.is_converted && (
                          <button
                            onClick={() => handleConvert(lead.id)}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Chuyển thành khách hàng"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {lead.is_converted && (
                          <span className="p-1.5 text-green-600" title="Đã chuyển thành khách hàng">
                            <CheckCircle size={16} />
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.full_name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-accent" />
              Thêm khách hàng tiềm năng mới
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newLead.full_name}
                  onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newLead.source_id}
                  onChange={(e) => setNewLead({ ...newLead, source_id: parseInt(e.target.value) })}
                >
                  <option value={0}>-- Chọn nguồn --</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chiến dịch</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newLead.campaign_id || ''}
                  onChange={(e) => setNewLead({ ...newLead, campaign_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">-- Chọn chiến dịch --</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm sản phẩm quan tâm</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newLead.interested_product_group_id || ''}
                  onChange={(e) => setNewLead({ ...newLead, interested_product_group_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">-- Chọn nhóm SP --</option>
                  {productGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhu cầu</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={newLead.demand}
                  onChange={(e) => setNewLead({ ...newLead, demand: e.target.value })}
                  placeholder="Nhập nhu cầu của khách hàng"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewLead({
                    full_name: '',
                    phone: '',
                    email: '',
                    demand: '',
                    source_id: sources[0]?.id || 0,
                    campaign_id: undefined,
                    interested_product_group_id: undefined,
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddLead}
                disabled={!newLead.full_name || !newLead.phone || !newLead.source_id}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Thêm mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {isEditModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="text-accent" />
              Chỉnh sửa thông tin Lead #{selectedLead.id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.full_name || ''}
                  onChange={(e) => setEditLead({ ...editLead, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.phone || ''}
                  onChange={(e) => setEditLead({ ...editLead, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.email || ''}
                  onChange={(e) => setEditLead({ ...editLead, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.source_id || 0}
                  onChange={(e) => setEditLead({ ...editLead, source_id: parseInt(e.target.value) })}
                >
                  <option value={0}>-- Chọn nguồn --</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chiến dịch</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.campaign_id || ''}
                  onChange={(e) => setEditLead({ ...editLead, campaign_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">-- Chọn chiến dịch --</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm sản phẩm quan tâm</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.interested_product_group_id || ''}
                  onChange={(e) => setEditLead({ ...editLead, interested_product_group_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">-- Chọn nhóm SP --</option>
                  {productGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editLead.status || 'new'}
                  onChange={(e) => setEditLead({ ...editLead, status: e.target.value as lead_status })}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhu cầu</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={editLead.demand || ''}
                  onChange={(e) => setEditLead({ ...editLead, demand: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedLead(null);
                  setEditLead({});
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditLead}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {isDetailModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[800px] max-w-[90vw] p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Eye className="text-accent" />
                Chi tiết Lead #{selectedLead.id}
              </h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedLead(null);
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-3">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500">Họ và tên</span>
                    <p className="font-medium">{selectedLead.full_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Số điện thoại</span>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Email</span>
                    <p className="font-medium">{selectedLead.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Trạng thái</span>
                    <p className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedLead.status]}`}>
                      {statusLabels[selectedLead.status]}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Nguồn</span>
                    <p className="font-medium">{selectedLead.lead_sources?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Chiến dịch</span>
                    <p className="font-medium">{selectedLead.campaigns?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Nhóm sản phẩm</span>
                    <p className="font-medium">{selectedLead.product_groups?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">NV phụ trách</span>
                    <p className="font-medium">{selectedLead.sales_employees?.full_name || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500">Nhu cầu</span>
                    <p className="font-medium">{selectedLead.demand || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-3">Timeline</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500">Ngày tạo</span>
                    <p className="font-medium">{formatDate(selectedLead.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Ngày phân công</span>
                    <p className="font-medium">{formatDate(selectedLead.assigned_at)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Liên hệ cuối</span>
                    <p className="font-medium">{formatDate(selectedLead.last_contacted_at)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Đã chuyển KH</span>
                    <p className="font-medium">{selectedLead.is_converted ? `Có (${formatDate(selectedLead.converted_at)})` : 'Chưa'}</p>
                  </div>
                </div>
              </div>

              {/* Interactions */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-3">Lịch sử tương tác ({interactions.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {interactions.length > 0 ? (
                    interactions.map((interaction) => {
                      const Icon = interactionTypeIcons[interaction.type];
                      return (
                        <div key={interaction.id} className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Icon size={16} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm">{interactionTypeLabels[interaction.type]}</span>
                                <span className="text-xs text-slate-500">{formatDate(interaction.occurred_at)}</span>
                              </div>
                              {interaction.summary && (
                                <p className="text-sm text-slate-600 mb-1">{interaction.summary}</p>
                              )}
                              {interaction.content && (
                                <p className="text-xs text-slate-500">{interaction.content}</p>
                              )}
                              {interaction.duration_seconds && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Thời lượng: {Math.floor(interaction.duration_seconds / 60)} phút
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Chưa có tương tác nào</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleAddInteractionClick(selectedLead);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Thêm tương tác
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedLead(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Interaction Modal */}
      {isInteractionModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PhoneCall className="text-purple-600" />
              Thêm tương tác cho Lead: {selectedLead.full_name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại tương tác *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  value={newInteraction.type}
                  onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value as interaction_type })}
                >
                  {Object.entries(interactionTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tóm tắt</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  value={newInteraction.summary}
                  onChange={(e) => setNewInteraction({ ...newInteraction, summary: e.target.value })}
                  placeholder="Tóm tắt ngắn gọn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung chi tiết *</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  rows={4}
                  value={newInteraction.content}
                  onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
                  placeholder="Ghi chú chi tiết về cuộc tương tác..."
                />
              </div>

              {newInteraction.type === 'call' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời lượng (giây)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newInteraction.duration_seconds || ''}
                    onChange={(e) => setNewInteraction({ ...newInteraction, duration_seconds: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Nhập thời lượng cuộc gọi"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsInteractionModalOpen(false);
                  setNewInteraction({
                    type: 'call',
                    content: '',
                    summary: '',
                    duration_seconds: undefined,
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddInteraction}
                disabled={!newInteraction.content}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Thêm tương tác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
