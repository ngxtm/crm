'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  PenTool,
  DollarSign,
  Calendar,
  FileText,
  Filter,
  MoreVertical,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  X,
  Upload,
  Image,
  Download,
  Eye,
  Loader2,
  Paperclip
} from 'lucide-react';
import { DesignOrder, DesignOrderStatus, UploadedFile } from '@/types/design';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

const DesignTasks: React.FC = () => {
  const [orders, setOrders] = useState<DesignOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DesignOrder | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    productType: '',
    requirements: '',
    revenue: 0,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File preview modal
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  // Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/design-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    return orders.reduce((acc, curr) => ({
      count: acc.count + 1,
      revenue: acc.revenue + Number(curr.revenue),
      pending: curr.status === DesignOrderStatus.PENDING ? acc.pending + 1 : acc.pending
    }), { count: 0, revenue: 0, pending: 0 });
  }, [orders]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: DesignOrderStatus) => {
    switch (status) {
      case DesignOrderStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200';
      case DesignOrderStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-200';
      case DesignOrderStatus.REVIEW: return 'bg-purple-50 text-purple-700 border-purple-200';
      case DesignOrderStatus.COMPLETED: return 'bg-green-50 text-green-700 border-green-200';
      case DesignOrderStatus.CANCELLED: return 'bg-slate-50 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // Handlers
  const handleOpenAdd = () => {
    setEditingOrder(null);
    setFormData({
      customerName: '',
      phone: '',
      productType: '',
      requirements: '',
      revenue: 0,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setSelectedFiles([]);
    setUploadedFiles([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: DesignOrder) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      phone: order.phone,
      productType: order.productType,
      requirements: order.requirements,
      revenue: Number(order.revenue),
      deadline: order.deadline.split('T')[0]
    });
    setSelectedFiles([]);
    setUploadedFiles(order.fileUrls || []);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa yêu cầu thiết kế',
      message: 'Bạn chắc chắn muốn xóa yêu cầu này?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`http://localhost:3001/api/design-orders/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            await fetchOrders();
            toast.success('Đã xóa thành công!');
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          toast.error('Lỗi khi xóa!');
        }
        setActiveDropdown(null);
      },
    });
  };

  const handleUpdateStatus = async (order: DesignOrder, status: DesignOrderStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/design-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setActiveDropdown(null);
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast.warning('Chỉ chấp nhận file ảnh!');
    }
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToOrder = async (orderId: string) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`http://localhost:3001/api/design-orders/${orderId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Đã upload ${result.files.length} file!`);
        setSelectedFiles([]);
        await fetchOrders();
      } else {
        toast.error('Upload thất bại!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lỗi khi upload file!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (orderId: string, file: UploadedFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa file',
      message: `Bạn chắc chắn muốn xóa file "${file.originalName}"?`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(
            `http://localhost:3001/api/design-orders/${orderId}/files/${encodeURIComponent(file.fileName)}`,
            { method: 'DELETE' }
          );

          if (response.ok) {
            toast.success('Đã xóa file!');
            await fetchOrders();
          }
        } catch (error) {
          console.error('Delete file error:', error);
          toast.error('Lỗi khi xóa file!');
        }
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSave = async () => {
    if (!formData.customerName || !formData.phone || !formData.productType || !formData.requirements) {
      toast.error("Vui lòng nhập đủ thông tin!");
      return;
    }

    try {
      const payload = {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        revenue: Number(formData.revenue)
      };

      let orderId = editingOrder?.id;

      if (editingOrder) {
        const response = await fetch(`http://localhost:3001/api/design-orders/${editingOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success("Đã cập nhật!");
        }
      } else {
        const response = await fetch('http://localhost:3001/api/design-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const newOrder = await response.json();
          orderId = newOrder.id;
          toast.success("Đã tạo mới!");
        }
      }

      // Upload files if any selected
      if (orderId && selectedFiles.length > 0) {
        await uploadFilesToOrder(orderId);
      }

      await fetchOrders();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Có lỗi xảy ra!');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <PenTool size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Yêu cầu thiết kế</h2>
            <p className="text-slate-500 text-sm">Quản lý đơn hàng & Yêu cầu của khách</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-sm transition-colors"
        >
          <PlusCircle size={18} /> Tạo yêu cầu mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Tổng đơn thiết kế</p>
            <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Doanh thu thiết kế</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Chờ xử lý</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm đơn hàng, tên khách, loại thiết kế..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">Tất cả trạng thái</option>
            {Object.values(DesignOrderStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col pb-20">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <th className="p-4 w-24">Mã Đơn</th>
                <th className="p-4 min-w-[180px]">Khách hàng</th>
                <th className="p-4">Loại thiết kế</th>
                <th className="p-4 min-w-[250px]">Yêu cầu / Ghi chú</th>
                <th className="p-4 text-center">File</th>
                <th className="p-4 text-center">Hạn chót</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Doanh thu</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 font-mono text-slate-500 font-medium text-xs">{order.id.slice(0, 8)}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{order.customerName}</div>
                    <div className="text-xs text-slate-500">{order.phone}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                      {order.productType}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-slate-700 line-clamp-2" title={order.requirements}>
                        {order.requirements}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {order.fileUrls && order.fileUrls.length > 0 ? (
                      <button
                        onClick={() => handleOpenEdit(order)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100"
                      >
                        <Image size={12} />
                        {order.fileUrls.length} file
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-slate-600">
                    {formatDate(order.deadline)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-green-600">
                    {formatCurrency(Number(order.revenue))}
                  </td>

                  {/* Action Menu */}
                  <td className="p-4 text-right dropdown-container relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === order.id ? null : order.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeDropdown === order.id && (
                      <div className="absolute right-8 top-0 z-50 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 origin-top-right">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase border-b border-slate-50">Cập nhật trạng thái</div>
                        {Object.values(DesignOrderStatus).map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStatus(order, st)}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 ${order.status === st ? 'text-blue-500 font-bold' : 'text-slate-600'}`}
                          >
                            {order.status === st && <CheckCircle size={12} />}
                            {st}
                          </button>
                        ))}
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button onClick={() => handleOpenEdit(order)} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-amber-600 flex gap-2 items-center">
                          <Edit size={14} /> Sửa thông tin
                        </button>
                        <button onClick={() => handleDelete(order.id)} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 flex gap-2 items-center">
                          <Trash2 size={14} /> Xóa yêu cầu
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[900px] max-w-[95vw] p-6 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-blue-500" />
              {editingOrder ? 'Cập nhật yêu cầu thiết kế' : 'Tạo yêu cầu thiết kế mới'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại sản phẩm *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  placeholder="Ví dụ: Logo, Banner, Menu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yêu cầu / Ghi chú *</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Mô tả yêu cầu thiết kế..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Doanh thu (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Paperclip size={16} />
                  File thiết kế (Ảnh)
                </label>

                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-sm text-slate-600">Click để chọn hoặc kéo thả file ảnh vào đây</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF (tối đa 10MB/file)</p>
                </div>

                {/* Selected Files (not yet uploaded) */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">File sẽ upload ({selectedFiles.length}):</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeSelectedFile(index); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          <p className="text-xs text-slate-500 truncate mt-1">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Already Uploaded Files (when editing) */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">File đã upload ({uploadedFiles.length}):</p>
                    <div className="grid grid-cols-3 gap-3">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group border border-slate-200 rounded-lg p-2">
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-full h-24 object-cover rounded cursor-pointer"
                            onClick={() => setPreviewFile(file)}
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-slate-600 truncate flex-1" title={file.originalName}>
                              {file.originalName}
                            </p>
                            <div className="flex gap-1">
                              <a
                                href={file.url}
                                download={file.originalName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download size={14} />
                              </a>
                              <button
                                onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                className="p-1 text-green-500 hover:bg-green-50 rounded"
                              >
                                <Eye size={14} />
                              </button>
                              {editingOrder && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFile(editingOrder.id, file); }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.customerName || !formData.phone || !formData.productType || !formData.requirements}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingOrder ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-2 right-2 bg-white/90 text-slate-600 rounded-full p-2 hover:bg-white"
            >
              <X size={20} />
            </button>
            <img
              src={previewFile.url}
              alt={previewFile.originalName}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-center text-white">
              <p className="font-medium">{previewFile.originalName}</p>
              <p className="text-sm text-white/70">{formatFileSize(previewFile.size)}</p>
              <a
                href={previewFile.url}
                download={previewFile.originalName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} /> Tải xuống
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignTasks;
