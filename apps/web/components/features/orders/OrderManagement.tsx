'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  ShoppingCart,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  X,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Order, OrderStatus, ORDER_STATUS_LABELS, STATUS_TRANSITIONS } from '@/types/order';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  phone: string;
  email?: string;
}

interface SalesEmployee {
  id: number;
  employee_code: string;
  full_name: string;
}

interface ProductGroup {
  id: number;
  name: string;
  code: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesEmployees, setSalesEmployees] = useState<SalesEmployee[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [paymentForm, setPaymentForm] = useState({ content: '', amount: 0, method: 'transfer' });
  const [createForm, setCreateForm] = useState({
    customerId: '',
    productGroupId: '',
    salesEmployeeId: '',
    description: '',
    quantity: 1,
    unit: 'cái',
    unitPrice: 0,
    totalAmount: 0,
    finalAmount: 0,
  });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Fetch data
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/orders`);
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

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSalesEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/sales-employees?is_active=true`);
      if (response.ok) {
        const data = await response.json();
        setSalesEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching sales employees:', error);
    }
  };

  const fetchProductGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/product-groups`);
      if (response.ok) {
        const data = await response.json();
        setProductGroups(data);
      }
    } catch (error) {
      console.error('Error fetching product groups:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchSalesEmployees();
    fetchProductGroups();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.action-menu')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.order_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customers?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customers?.phone?.includes(searchQuery);

      const matchesStatus = filterStatuses.length > 0
        ? filterStatuses.includes(order.status)
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, filterStatuses]);

  // Metrics
  const metrics = useMemo(() => ({
    customers: new Set(filteredOrders.map(o => o.customer_id)).size,
    orders: filteredOrders.length,
    revenue: filteredOrders.reduce((acc, o) => acc + Number(o.final_amount || 0), 0)
  }), [filteredOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200';
      case OrderStatus.DESIGNING: return 'bg-purple-50 text-purple-700 border-purple-200';
      case OrderStatus.APPROVED: return 'bg-blue-50 text-blue-700 border-blue-200';
      case OrderStatus.PRINTING: return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case OrderStatus.COMPLETED: return 'bg-green-50 text-green-700 border-green-200';
      case OrderStatus.DELIVERED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case OrderStatus.CANCELLED: return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Get allowed status options for current order
  const getAllowedStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    return [currentStatus, ...allowed];
  };

  // Handlers
  const handleOpenCreate = () => {
    setCreateForm({
      customerId: '',
      productGroupId: '',
      salesEmployeeId: '',
      description: '',
      quantity: 1,
      unit: 'cái',
      unitPrice: 0,
      totalAmount: 0,
      finalAmount: 0,
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateFormChange = (field: string, value: string | number) => {
    const updated = { ...createForm, [field]: value };

    // Auto-calculate totals
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : createForm.quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : createForm.unitPrice;
      updated.totalAmount = quantity * unitPrice;
      updated.finalAmount = quantity * unitPrice;
    }

    setCreateForm(updated);
  };

  const handleSubmitCreate = async () => {
    if (!createForm.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (createForm.finalAmount <= 0) {
      toast.error('Vui lòng nhập thành tiền');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: Number(createForm.customerId),
          productGroupId: createForm.productGroupId ? Number(createForm.productGroupId) : undefined,
          salesEmployeeId: createForm.salesEmployeeId ? Number(createForm.salesEmployeeId) : undefined,
          description: createForm.description,
          quantity: createForm.quantity,
          unit: createForm.unit,
          unitPrice: createForm.unitPrice,
          totalAmount: createForm.totalAmount,
          finalAmount: createForm.finalAmount,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setIsCreateModalOpen(false);
        toast.success('Tạo đơn hàng thành công!');
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Lỗi khi tạo đơn hàng');
    }
  };

  const handleOpenEdit = (order: Order, isViewOnly: boolean = false) => {
    setSelectedOrder(order);
    setEditForm({ ...order });
    setViewOnly(isViewOnly);
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleSubmitEdit = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`${API_BASE}/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editForm.description,
          status: editForm.status,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setIsEditModalOpen(false);
        toast.success('Cập nhật đơn hàng thành công!');
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || 'Không thể cập nhật đơn hàng');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Lỗi khi cập nhật!');
    }
  };

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentForm({ content: '', amount: Number(order.final_amount) || 0, method: 'transfer' });
    setIsPaymentModalOpen(true);
    setActiveDropdown(null);
  };

  const handleSubmitPayment = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`${API_BASE}/orders/${selectedOrder.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      if (response.ok) {
        await fetchOrders();
        setIsPaymentModalOpen(false);
        toast.success('Xác nhận thanh toán thành công!');
      } else {
        toast.error('Lỗi khi thêm thanh toán');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Lỗi khi thêm thanh toán!');
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa đơn hàng',
      message: 'Bạn chắc chắn muốn xóa đơn hàng này?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            await fetchOrders();
            toast.success('Xóa đơn hàng thành công!');
          } else {
            toast.error('Lỗi khi xóa đơn hàng');
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          toast.error('Lỗi khi xóa!');
        }
        setActiveDropdown(null);
      },
    });
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
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Quản lý Đơn hàng</h2>
            <p className="text-slate-500 text-sm">Theo dõi tiến độ, thanh toán và yêu cầu thiết kế</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={18} />
          Tạo đơn mới
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm (Mã đơn, Tên khách, SĐT...)"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Download size={16} /> Xuất Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <MultiSelect
            label="Trạng thái"
            options={Object.values(OrderStatus)}
            selectedValues={filterStatuses}
            onChange={setFilterStatuses}
          />
        </div>

        {/* Metrics */}
        <div className="flex gap-6 border-t border-slate-100 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-semibold">Số khách</span>
            <span className="text-xl font-bold text-slate-800">{metrics.customers}</span>
          </div>
          <div className="flex flex-col border-l pl-6 border-slate-100">
            <span className="text-xs text-slate-500 uppercase font-semibold">Số đơn</span>
            <span className="text-xl font-bold text-blue-600">{metrics.orders}</span>
          </div>
          <div className="flex flex-col border-l pl-6 border-slate-100">
            <span className="text-xs text-slate-500 uppercase font-semibold">Doanh số</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(metrics.revenue)}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col pb-20">
        <div className="overflow-x-auto overflow-y-visible min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold whitespace-nowrap">
                <th className="p-4">Mã đơn hàng</th>
                <th className="p-4 text-center">QR</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Sale</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4 text-right">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 font-bold text-slate-700">{order.order_code}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center justify-center p-1 bg-white border border-slate-200 rounded">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.order_code}`}
                        alt="QR"
                        className="w-8 h-8 opacity-80"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{order.customers?.full_name || '-'}</div>
                    <div className="text-xs text-slate-500">{order.customers?.phone || '-'}</div>
                  </td>
                  <td className="p-4 text-slate-600">{order.sales_employees?.full_name || '-'}</td>
                  <td className="p-4 text-slate-500">{formatDate(order.created_at)}</td>
                  <td className="p-4 text-slate-600 truncate max-w-[200px]" title={order.description}>
                    {order.description || '-'}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600">
                    {formatCurrency(Number(order.final_amount || 0))}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right relative action-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === String(order.id) ? null : String(order.id));
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        activeDropdown === String(order.id)
                          ? 'bg-slate-200 text-slate-800'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeDropdown === String(order.id) && (
                      <div className="absolute right-8 top-8 z-50 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1">
                        <button
                          onClick={() => handleOpenEdit(order, true)}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 font-medium"
                        >
                          <Eye size={14} /> Xem chi tiết
                        </button>
                        <button
                          onClick={() => handleOpenEdit(order, false)}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 font-medium"
                        >
                          <Edit size={14} /> Sửa đơn hàng
                        </button>
                        <button
                          onClick={() => handleOpenPayment(order)}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-green-600 flex items-center gap-2 font-medium"
                        >
                          <CreditCard size={14} /> Thanh toán
                        </button>
                        <div className="h-px bg-slate-100 my-1 mx-2"></div>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 font-medium"
                        >
                          <Trash2 size={14} /> Xóa đơn
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

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[700px] max-w-[95vw] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="text-red-600" />
                Tạo đơn hàng mới
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.customerId}
                  onChange={(e) => handleCreateFormChange('customerId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} - {customer.phone} ({customer.customer_code})
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Chưa có khách hàng. Vui lòng tạo khách hàng trước hoặc chuyển đổi từ Lead.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm sản phẩm</label>
                  <select
                    value={createForm.productGroupId}
                    onChange={(e) => handleCreateFormChange('productGroupId', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">-- Chọn nhóm SP --</option>
                    {productGroups.map((pg) => (
                      <option key={pg.id} value={pg.id}>
                        {pg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhân viên Sale</label>
                  <select
                    value={createForm.salesEmployeeId}
                    onChange={(e) => handleCreateFormChange('salesEmployeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">-- Chọn NV Sale --</option>
                    {salesEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả đơn hàng</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 h-20 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Mô tả chi tiết sản phẩm, yêu cầu..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.quantity}
                    onChange={(e) => handleCreateFormChange('quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                  <input
                    type="text"
                    value={createForm.unit}
                    onChange={(e) => handleCreateFormChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.unitPrice}
                    onChange={(e) => handleCreateFormChange('unitPrice', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tổng tiền</label>
                  <div className="text-lg font-bold text-slate-800">{formatCurrency(createForm.totalAmount)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Thành tiền <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.finalAmount}
                    onChange={(e) => handleCreateFormChange('finalAmount', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitCreate}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm"
              >
                Tạo đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[700px] max-w-[95vw] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {viewOnly ? <Eye className="text-blue-600" /> : <Edit className="text-blue-600" />}
                {viewOnly ? 'Xem chi tiết đơn hàng' : 'Cập nhật đơn hàng'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã đơn</label>
                  <input
                    disabled
                    value={selectedOrder.order_code}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                  <input
                    disabled
                    value={selectedOrder.customers?.full_name || '-'}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  disabled={viewOnly}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 h-24 border border-slate-300 rounded resize-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tổng tiền</label>
                  <input
                    disabled
                    value={formatCurrency(Number(selectedOrder.final_amount || 0))}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    disabled={viewOnly}
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as OrderStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {getAllowedStatusOptions(selectedOrder.status).map(st => (
                      <option key={st} value={st}>{ORDER_STATUS_LABELS[st] || st}</option>
                    ))}
                  </select>
                  {!viewOnly && (
                    <p className="text-xs text-slate-500 mt-1">
                      Chỉ có thể chuyển sang các trạng thái được phép
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Đóng
              </button>
              {!viewOnly && (
                <button
                  onClick={handleSubmitEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
                >
                  Lưu thay đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[500px] max-w-[90vw] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="text-green-600" />
                Xác nhận Thanh toán
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung thanh toán</label>
                <input
                  value={paymentForm.content}
                  onChange={(e) => setPaymentForm({ ...paymentForm, content: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                  placeholder="Ví dụ: Đặt cọc lần 1, Thanh toán đủ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phương thức</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                >
                  <option value="transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="card">Thẻ</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Xác nhận thanh toán
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
    </div>
  );
};

export default OrderManagement;
