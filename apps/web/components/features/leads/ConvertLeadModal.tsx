'use client';

import { useState, useCallback } from 'react';
import { X, Upload, Loader2, FileIcon, Trash2, Image } from 'lucide-react';
import { Lead } from '@/lib/types';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UploadedFile {
  google_drive_id: string;
  file_name: string;
  file_type?: string;
  file_size_bytes?: number;
  thumbnail_url?: string;
}

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: () => void;
}

export function ConvertLeadModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: ConvertLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Customer form data (prefilled from lead)
  const [customerData, setCustomerData] = useState({
    full_name: lead.full_name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    address: '',
    company_name: '',
    tax_code: '',
  });

  // Order form data
  const [orderData, setOrderData] = useState({
    description: lead.demand || '',
    total_amount: 0,
    quantity: 1,
    unit: 'cái',
  });

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });

        const response = await fetch(`${API_BASE}/google-drive/upload-multiple`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const results = await response.json();
        const newFiles: UploadedFile[] = results.map((r: any) => ({
          google_drive_id: r.fileId,
          file_name: r.fileName,
          file_type: r.mimeType,
          thumbnail_url: r.thumbnailUrl,
        }));

        setUploadedFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Đã upload ${newFiles.length} file`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Lỗi khi upload file');
      } finally {
        setIsUploading(false);
        // Reset input
        event.target.value = '';
      }
    },
    []
  );

  const handleRemoveFile = useCallback(async (fileId: string) => {
    try {
      await fetch(`${API_BASE}/google-drive/files/${fileId}`, {
        method: 'DELETE',
      });
      setUploadedFiles((prev) =>
        prev.filter((f) => f.google_drive_id !== fileId)
      );
      toast.success('Đã xóa file');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Lỗi khi xóa file');
    }
  }, []);

  const handleSubmit = async () => {
    if (!orderData.description) {
      toast.error('Vui lòng nhập mô tả đơn hàng');
      return;
    }
    if (orderData.total_amount <= 0) {
      toast.error('Vui lòng nhập tổng tiền hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/leads/${lead.id}/convert-with-order`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: customerData,
            order: orderData,
            files: uploadedFiles,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Có lỗi xảy ra');
      }

      const result = await response.json();
      toast.success(
        <div>
          <p>Đã tạo khách hàng và đơn hàng thành công!</p>
          <p className="text-sm text-gray-500">
            Mã đơn: {result.order?.order_code}
          </p>
        </div>
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Convert error:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Tạo Khách hàng + Đơn hàng
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-6">
          {/* Customer Section */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Họ tên *
                </label>
                <input
                  type="text"
                  value={customerData.full_name}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="text"
                  value={customerData.phone}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Công ty
                </label>
                <input
                  type="text"
                  value={customerData.company_name}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      company_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Order Section */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Thông tin đơn hàng
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Mô tả đơn hàng *
                </label>
                <textarea
                  value={orderData.description}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mô tả chi tiết yêu cầu thiết kế..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    value={orderData.quantity}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    min={1}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Đơn vị
                  </label>
                  <input
                    type="text"
                    value={orderData.unit}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tổng tiền (VNĐ) *
                  </label>
                  <input
                    type="number"
                    value={orderData.total_amount}
                    onChange={(e) =>
                      setOrderData((prev) => ({
                        ...prev,
                        total_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min={0}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">
              Tài liệu đính kèm
            </h3>

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-blue-500">Đang upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">
                    Click để chọn file hoặc kéo thả vào đây
                  </span>
                </>
              )}
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ai,.psd"
              />
            </label>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.google_drive_id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    {file.thumbnail_url ? (
                      <img
                        src={file.thumbnail_url}
                        alt={file.file_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <FileIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.file_type}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.google_drive_id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Tạo đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
