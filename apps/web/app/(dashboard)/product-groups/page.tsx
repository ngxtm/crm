'use client';

import { useState } from 'react';
import { ProductGroup } from '@/lib/types';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';
import { ProductGroupFormModal } from '@/components/features/product-groups/ProductGroupFormModal';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ProductGroupsPage() {
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);

  // Fetch product groups
  const fetchProductGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/product-groups`);
      if (!res.ok) throw new Error('Failed to fetch product groups');
      const data = await res.json();
      setProductGroups(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useState(() => {
    fetchProductGroups();
  });

  // Add Product Group
  const handleAddGroup = async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/product-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to create product group');

      await fetchProductGroups();
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  // Edit Product Group
  const handleEditClick = (group: ProductGroup) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handleEditGroup = async (data: any) => {
    if (!selectedGroup) return false;

    try {
      const res = await fetch(`${API_BASE}/product-groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update product group');

      await fetchProductGroups();
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  // Delete Product Group
  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhóm "${groupName}"? Nhóm sẽ bị vô hiệu hóa.`)) {
      try {
        const res = await fetch(`${API_BASE}/product-groups/${groupId}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete product group');

        await fetchProductGroups();
        toast.success('Đã xóa nhóm sản phẩm thành công!');
      } catch (err: any) {
        toast.error(`Lỗi: ${err.message}`);
      }
    }
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
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Quản lý Nhóm Sản phẩm</h1>
          <p className="text-slate-500 text-sm">Quản lý các nhóm sản phẩm và phân công chuyên môn cho nhân viên sale</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all font-medium"
        >
          <PlusCircle size={20} />
          Thêm nhóm SP
        </button>
      </div>

      {/* Product Groups Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tên nhóm</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mã</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mô tả</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productGroups.map((group) => (
              <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-700 font-medium">#{group.id}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{group.name}</td>
                <td className="px-6 py-4 text-sm text-slate-700 font-mono">{group.code}</td>
                <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                  {group.description || '-'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      group.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {group.is_active ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEditClick(group)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productGroups.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chưa có nhóm sản phẩm nào. Nhấn "Thêm nhóm SP" để bắt đầu.
          </div>
        )}
      </div>

      {/* Add/Edit Product Group Modal */}
      <ProductGroupFormModal
        mode={isEditModalOpen ? 'edit' : 'add'}
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedGroup(null);
        }}
        onSubmit={isEditModalOpen ? handleEditGroup : handleAddGroup}
        defaultValues={isEditModalOpen ? selectedGroup : undefined}
      />
    </div>
  );
}
