'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  FileIcon,
  Image as ImageIcon,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface GalleryOrder {
  id: number;
  order_code: string;
  customer_name: string;
  thumbnail_url: string | null;
  file_count: number;
  status: string;
  created_at: string;
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

interface OrderDetail {
  id: number;
  order_code: string;
  description?: string;
  customers: {
    full_name: string;
    phone: string;
  };
  request_files: DesignFile[];
  result_files: DesignFile[];
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  designing: 'Đang thiết kế',
  approved: 'Đã duyệt',
  printing: 'Đang in',
  completed: 'Hoàn thành',
  delivered: 'Đã giao',
};

export default function DesignGalleryPage() {
  const [orders, setOrders] = useState<GalleryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchGallery = useCallback(async () => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await fetch(`${API_BASE}/orders/design/gallery?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleViewOrder = async (orderId: number) => {
    try {
      setIsLoadingDetail(true);
      const response = await fetch(`${API_BASE}/orders/${orderId}/files`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kho Thiết Kế</h1>
        <p className="text-gray-500">
          Thư viện thiết kế theo đơn hàng. Tìm kiếm theo mã đơn hoặc tên khách hàng.
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

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Không tìm thấy đơn hàng nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleViewOrder(order.id)}
                className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                  {order.thumbnail_url ? (
                    <img
                      src={order.thumbnail_url}
                      alt={order.order_code}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="p-2 bg-white rounded-full">
                      <Eye className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>

                  {/* File count badge */}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {order.file_count} file
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-blue-600 text-sm truncate">
                    {order.order_code}
                  </h3>
                  <p className="text-gray-700 text-sm truncate mt-1">
                    {order.customer_name || 'Khách hàng'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        order.status === 'completed' || order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
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
                  {selectedOrder.customers?.full_name} - {selectedOrder.customers?.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
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
                      {selectedOrder.request_files.map((file) => (
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
                          <span className="text-xs text-gray-600 truncate max-w-full text-center">
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
                      {selectedOrder.result_files.map((file) => (
                        <a
                          key={file.id}
                          href={`https://drive.google.com/file/d/${file.google_drive_id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100"
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
                          <span className="text-xs text-gray-600 truncate max-w-full text-center">
                            {file.file_name}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Chưa có kết quả</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
