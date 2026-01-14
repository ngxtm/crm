'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  FileIcon,
  Eye,
  X,
  CheckCircle,
  Clock,
  Link2,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Order {
  id: number;
  order_code: string;
  description?: string;
  status: string;
  created_at: string;
  customers: {
    full_name: string;
    phone: string;
  };
  design_files: DesignFile[];
}

interface OrderDetail extends Order {
  request_files: DesignFile[];
  result_files: DesignFile[];
}

interface DesignFile {
  id: number;
  file_name: string;
  file_type?: string;
  google_drive_id?: string;
  thumbnail_url?: string;
  file_category?: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  designing: 'Đang thiết kế',
  approved: 'Đã duyệt',
  printing: 'Đang in',
  completed: 'Hoàn thành',
};

export default function DesignTasksPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/orders/design/needs-work`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(
    (order) =>
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDesignResult = async (orderId: number) => {
    if (!linkInput.trim()) return;

    setIsParsing(true);
    try {
      const cleanUrl = linkInput.trim();
      console.log('Sending URL to parse:', cleanUrl, 'Length:', cleanUrl.length);

      // Parse link
      const parseResponse = await fetch(`${API_BASE}/google-drive/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!parseResponse.ok) {
        toast.error('Lỗi kết nối API');
        return;
      }

      const parsed = await parseResponse.json();
      console.log('Parsed result:', parsed);

      if (parsed.error) {
        toast.error(parsed.error || 'Link không hợp lệ');
        return;
      }

      if (!parsed.fileId) {
        console.error('Missing fileId in response:', parsed);
        toast.error('Không thể phân tích link - thiếu fileId');
        return;
      }

      setIsAdding(true);

      // Add design result
      const response = await fetch(`${API_BASE}/orders/${orderId}/design-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_drive_id: parsed.fileId,
          file_name: `result-${parsed.fileId.slice(0, 8)}`,
          thumbnail_url: parsed.thumbnailUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể thêm kết quả');
      }

      toast.success('Đã thêm kết quả thiết kế');
      setLinkInput('');

      // Refresh order detail
      const orderResponse = await fetch(`${API_BASE}/orders/${orderId}/files`);
      if (orderResponse.ok) {
        setSelectedOrder(await orderResponse.json());
      }
      fetchOrders();
    } catch (error) {
      console.error('Error adding result:', error);
      toast.error('Lỗi khi thêm kết quả');
    } finally {
      setIsParsing(false);
      setIsAdding(false);
    }
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/files`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setLinkInput('');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleDeleteFile = async (orderId: number, fileId: number) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/files/${fileId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Đã xóa file');
        // Refresh order detail
        const orderResponse = await fetch(`${API_BASE}/orders/${orderId}/files`);
        if (orderResponse.ok) {
          setSelectedOrder(await orderResponse.json());
        }
        fetchOrders();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Lỗi khi xóa file');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yêu Cầu Thiết Kế</h1>
        <p className="text-gray-500">
          Danh sách đơn hàng cần thiết kế. Thêm kết quả thiết kế cho từng đơn.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có đơn hàng nào cần thiết kế
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const requestFiles = order.design_files?.filter(
              (f) => f.file_category === 'request'
            );
            const resultFiles = order.design_files?.filter(
              (f) => f.file_category === 'result'
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-blue-600">
                        {order.order_code}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {order.customers?.full_name}
                    </p>
                    {order.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {order.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileIcon className="w-4 h-4" />
                        {requestFiles?.length || 0} file yêu cầu
                      </span>
                      <span className="flex items-center gap-1">
                        {resultFiles?.length > 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        {resultFiles?.length || 0} kết quả
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewOrder(order.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedOrder.order_code}
                </h2>
                <p className="text-gray-500">
                  {selectedOrder.customers?.full_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Description */}
              {selectedOrder.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Mô tả</h3>
                  <p className="text-gray-600">{selectedOrder.description}</p>
                </div>
              )}

              {/* Request Files */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Tài liệu yêu cầu ({selectedOrder.request_files?.length || 0})
                </h3>
                {selectedOrder.request_files?.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedOrder.request_files.map((file: DesignFile) => (
                      <a
                        key={file.id}
                        href={`https://drive.google.com/file/d/${file.google_drive_id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        {file.thumbnail_url ? (
                          <img
                            src={file.thumbnail_url}
                            alt={file.file_name}
                            className="w-16 h-16 object-cover rounded mb-2"
                          />
                        ) : (
                          <FileIcon className="w-10 h-10 text-gray-400 mb-2" />
                        )}
                        <span className="text-xs text-gray-600 truncate max-w-full">
                          {file.file_name}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có file yêu cầu</p>
                )}
              </div>

              {/* Result Files */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Kết quả thiết kế ({selectedOrder.result_files?.length || 0})
                </h3>
                {selectedOrder.result_files?.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedOrder.result_files.map((file: DesignFile) => (
                      <div
                        key={file.id}
                        className="relative group flex flex-col items-center p-3 bg-green-50 rounded-lg"
                      >
                        {file.thumbnail_url ? (
                          <img
                            src={file.thumbnail_url}
                            alt={file.file_name}
                            className="w-16 h-16 object-cover rounded mb-2"
                          />
                        ) : (
                          <FileIcon className="w-10 h-10 text-green-400 mb-2" />
                        )}
                        <span className="text-xs text-gray-600 truncate max-w-full">
                          {file.file_name}
                        </span>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <a
                            href={`https://drive.google.com/file/d/${file.google_drive_id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(selectedOrder.id, file.id)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có kết quả</p>
                )}

                {/* Add result link */}
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-2">
                    Thêm kết quả thiết kế (paste link Google Drive)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleAddDesignResult(selectedOrder.id)
                        }
                        placeholder="Paste link Google Drive..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleAddDesignResult(selectedOrder.id)}
                      disabled={isParsing || isAdding || !linkInput.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {(isParsing || isAdding) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Thêm'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
