'use client';

import { useState } from 'react';
import { ProductGroup } from '@/lib/types';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ProductGroupsPage() {
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);

  // Form states
  const [newGroup, setNewGroup] = useState({
    name: '',
    code: '',
    description: '',
  });

  const [editGroupData, setEditGroupData] = useState<Partial<ProductGroup>>({});

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
  const handleAddGroup = async () => {
    if (!newGroup.name || !newGroup.code) {
      alert('Vui lòng điền tên và mã nhóm sản phẩm!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/product-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });

      if (!res.ok) throw new Error('Failed to create product group');

      await fetchProductGroups();
      setIsAddModalOpen(false);
      setNewGroup({
        name: '',
        code: '',
        description: '',
      });
      alert('Đã thêm nhóm sản phẩm thành công!');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Edit Product Group
  const handleEditClick = (group: ProductGroup) => {
    setSelectedGroup(group);
    setEditGroupData({
      name: group.name,
      code: group.code,
      description: group.description,
      is_active: group.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleEditGroup = async () => {
    if (!selectedGroup) return;

    try {
      const res = await fetch(`${API_BASE}/product-groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGroupData),
      });

      if (!res.ok) throw new Error('Failed to update product group');

      await fetchProductGroups();
      setIsEditModalOpen(false);
      setSelectedGroup(null);
      setEditGroupData({});
      alert('Đã cập nhật nhóm sản phẩm thành công!');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
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
        alert('Đã xóa nhóm sản phẩm thành công!');
      } catch (err: any) {
        alert(`Lỗi: ${err.message}`);
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

      {/* Add Product Group Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-accent" />
              Thêm nhóm sản phẩm mới
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="VD: Hộp giấy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhóm *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono"
                  value={newGroup.code}
                  onChange={(e) => setNewGroup({ ...newGroup, code: e.target.value })}
                  placeholder="BOX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Mô tả về nhóm sản phẩm này"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewGroup({
                    name: '',
                    code: '',
                    description: '',
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddGroup}
                disabled={!newGroup.name || !newGroup.code}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Thêm nhóm SP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Group Modal */}
      {isEditModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="text-accent" />
              Chỉnh sửa nhóm sản phẩm #{selectedGroup.id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editGroupData.name || ''}
                  onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhóm *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono"
                  value={editGroupData.code || ''}
                  onChange={(e) => setEditGroupData({ ...editGroupData, code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={editGroupData.description || ''}
                  onChange={(e) => setEditGroupData({ ...editGroupData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-group-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  checked={editGroupData.is_active ?? true}
                  onChange={(e) => setEditGroupData({ ...editGroupData, is_active: e.target.checked })}
                />
                <label htmlFor="edit-group-active" className="text-sm text-slate-700">
                  Nhóm đang hoạt động
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedGroup(null);
                  setEditGroupData({});
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditGroup}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
