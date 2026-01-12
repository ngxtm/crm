'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
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
  FileDown,
  X,
  MessageSquare,
  Mail,
  Users,
  StickyNote,
  ShoppingCart,
} from 'lucide-react';
import { useLeads, useLeadSources, useProductGroups, useInteractionLogs, useCampaigns } from '@/lib/api-hooks';
import { lead_status, Lead, interaction_type } from '@/lib/types';
import { exportLeadsToExcel, parseExcelToLeads, downloadLeadTemplate } from '@/lib/excel-utils';
import { LeadFormModal } from '@/components/features/leads/LeadFormModal';
import { InteractionFormModal } from '@/components/features/leads/InteractionFormModal';
import { toast } from 'sonner';

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

function LeadsPageContent() {
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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Partial<Lead>>({});
  const [orderFormData, setOrderFormData] = useState({
    description: '',
    quantity: 1,
    unit: 'cái',
    unitPrice: 0,
    totalAmount: 0,
    finalAmount: 0,
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const { interactions, addInteraction, refetch: refetchInteractions } = useInteractionLogs(selectedLead?.id);

  const statusOptions: lead_status[] = ['new', 'calling', 'no_answer', 'closed', 'rejected'];

  const handleStatusChange = async (leadId: number, newStatus: lead_status) => {
    await updateLeadStatus(leadId, newStatus);
  };

  const handleConvert = async (leadId: number) => {
    if (confirm('Bạn có chắc muốn chuyển lead này thành khách hàng?')) {
      const result = await convertLead(leadId);
      if (result) {
        toast.success(
          <div>
            <p>Đã chuyển thành khách hàng thành công!</p>
            <a href="/customers" className="text-emerald-600 underline font-medium">
              → Xem danh sách khách hàng
            </a>
          </div>,
          { duration: 5000 }
        );
      }
    }
  };

  const handleAddLead = async (data: any) => {
    const success = await addLead(data);
    return success;
  };

  const handleEditLead = async (data: any) => {
    if (!selectedLead) return false;
    const success = await updateLead(selectedLead.id, data);
    if (success) {
      setSelectedLead(null);
      setEditLead({});
    }
    return success;
  };

  const handleDeleteLead = async (leadId: number, leadName: string) => {
    if (confirm(`Bạn có chắc muốn xóa lead "${leadName}"?`)) {
      const success = await deleteLead(leadId);
      if (success) {
        toast.success('Đã xóa lead thành công!');
      }
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditLead(lead);
    setIsEditModalOpen(true);
  };

  const handleAddInteractionClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsInteractionModalOpen(true);
  };

  const handleAddInteraction = async (data: any) => {
    if (!selectedLead) return false;
    const success = await addInteraction({
      lead_id: selectedLead.id,
      ...data,
      occurred_at: new Date().toISOString(),
    });
    if (success) {
      refetchInteractions();
    }
    return success;
  };

  // Order creation handlers
  const handleOpenOrderModal = (lead: Lead) => {
    setSelectedLead(lead);
    setOrderFormData({
      description: lead.demand || '',
      quantity: 1,
      unit: 'cái',
      unitPrice: 0,
      totalAmount: 0,
      finalAmount: 0,
    });
    setIsOrderModalOpen(true);
  };

  const handleOrderFormChange = (field: string, value: any) => {
    setOrderFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Auto-calculate total
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? value : prev.quantity;
        const unitPrice = field === 'unitPrice' ? value : prev.unitPrice;
        newData.totalAmount = quantity * unitPrice;
        newData.finalAmount = quantity * unitPrice;
      }
      return newData;
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedLead) return;
    if (!orderFormData.description) {
      toast.error('Vui lòng nhập mô tả đơn hàng!');
      return;
    }
    if (orderFormData.quantity <= 0 || orderFormData.unitPrice <= 0) {
      toast.error('Vui lòng nhập số lượng và đơn giá hợp lệ!');
      return;
    }

    setIsCreatingOrder(true);
    try {
      const response = await fetch(`http://localhost:3001/api/leads/${selectedLead.id}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderFormData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Đã tạo đơn hàng ${result.order_code} thành công!`);
        setIsOrderModalOpen(false);
        setSelectedLead(null);
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi tạo đơn hàng!');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Có lỗi xảy ra khi tạo đơn hàng!');
    } finally {
      setIsCreatingOrder(false);
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
        toast.error('File Excel không có dữ liệu hợp lệ!');
        return;
      }

      if (!confirm(`Tìm thấy ${parsedLeads.length} lead. Bạn có muốn import tất cả?`)) {
        return;
      }

      const defaultSourceId = sources[0]?.id || 0;
      if (!defaultSourceId) {
        toast.error('Vui lòng tạo ít nhất 1 nguồn lead trước khi import!');
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

      toast.success(`Đã import thành công ${successCount}/${parsedLeads.length} lead!`);
      refetch();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Có lỗi xảy ra khi import file Excel!');
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
                        {lead.status !== 'new' && !lead.is_converted && (
                          <button
                            onClick={() => handleOpenOrderModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Lên đơn hàng"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        )}
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

      {/* Lead Form Modal (Add/Edit) */}
      <LeadFormModal
        mode={isEditModalOpen ? 'edit' : 'add'}
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedLead(null);
          setEditLead({});
        }}
        onSubmit={isEditModalOpen ? handleEditLead : handleAddLead}
        defaultValues={isEditModalOpen ? editLead : undefined}
        sources={sources}
        campaigns={campaigns}
        productGroups={productGroups}
      />

      {/* Interaction Form Modal */}
      <InteractionFormModal
        isOpen={isInteractionModalOpen}
        onClose={() => {
          setIsInteractionModalOpen(false);
          setSelectedLead(null);
        }}
        onSubmit={handleAddInteraction}
        leadName={selectedLead?.full_name}
      />

      {/* View Detail Modal */}
      {isDetailModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[800px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
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

      {/* Order Creation Modal */}
      {isOrderModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="text-emerald-600" />
                  Lên đơn hàng
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Tạo đơn hàng từ lead: <span className="font-medium text-slate-700">{selectedLead.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setSelectedLead(null);
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lead Info Summary */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Thông tin khách hàng</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Họ và tên</span>
                  <p className="font-medium">{selectedLead.full_name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Số điện thoại</span>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Nhóm sản phẩm quan tâm</span>
                  <p className="font-medium">{selectedLead.product_groups?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">NV Sale phụ trách</span>
                  <p className="font-medium">{selectedLead.sales_employees?.full_name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả đơn hàng *</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  rows={3}
                  value={orderFormData.description}
                  onChange={(e) => handleOrderFormChange('description', e.target.value)}
                  placeholder="Mô tả sản phẩm / yêu cầu của khách..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng *</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={orderFormData.quantity}
                    onChange={(e) => handleOrderFormChange('quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={orderFormData.unit}
                    onChange={(e) => handleOrderFormChange('unit', e.target.value)}
                    placeholder="cái, bộ, hộp..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn giá (VNĐ) *</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={orderFormData.unitPrice}
                    onChange={(e) => handleOrderFormChange('unitPrice', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Tổng tiền:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderFormData.finalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setSelectedLead(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={isCreatingOrder || !orderFormData.description || orderFormData.unitPrice <= 0}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isCreatingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Tạo đơn hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  );
}
