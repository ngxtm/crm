'use client';

import { useState, useEffect } from 'react';
import { SalesEmployee, ProductGroup } from '@/lib/types';
import { PlusCircle, Edit, Trash2, X, UserCircle, TrendingUp, Calendar, Award, Tag } from 'lucide-react';
import { useProductGroups } from '@/lib/api-hooks';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Specialization {
  id: number;
  sales_employee_id: number;
  product_group_id: number;
  is_primary: boolean;
  product_groups: ProductGroup;
}

export default function SalesEmployeesPage() {
  const [employees, setEmployees] = useState<SalesEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { productGroups } = useProductGroups();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSpecializationModalOpen, setIsSpecializationModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SalesEmployee | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    phone: '',
  });

  const [editEmployeeData, setEditEmployeeData] = useState<Partial<SalesEmployee>>({});

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/sales-employees`);
      if (!res.ok) throw new Error('Failed to fetch sales employees');
      const data = await res.json();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch specializations for an employee
  const fetchSpecializations = async (employeeId: number) => {
    try {
      const res = await fetch(`${API_BASE}/sales-employees/${employeeId}/specializations`);
      if (!res.ok) throw new Error('Failed to fetch specializations');
      const data = await res.json();
      setSpecializations(data);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Add specialization
  const handleAddSpecialization = async (productGroupId: number) => {
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`${API_BASE}/sales-employees/${selectedEmployee.id}/specializations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_group_id: productGroupId }),
      });

      if (!res.ok) throw new Error('Failed to add specialization');

      await fetchSpecializations(selectedEmployee.id);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Remove specialization
  const handleRemoveSpecialization = async (productGroupId: number) => {
    if (!selectedEmployee) return;

    try {
      const res = await fetch(
        `${API_BASE}/sales-employees/${selectedEmployee.id}/specializations/${productGroupId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to remove specialization');

      await fetchSpecializations(selectedEmployee.id);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add Employee
  const handleAddEmployee = async () => {
    if (!newEmployee.employee_code || !newEmployee.full_name || !newEmployee.email) {
      alert('Vui lòng điền mã NV, tên và email!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sales-employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });

      if (!res.ok) throw new Error('Failed to create sales employee');

      await fetchEmployees();
      setIsAddModalOpen(false);
      setNewEmployee({
        employee_code: '',
        full_name: '',
        email: '',
        phone: '',
      });
      alert('Đã thêm nhân viên sale thành công!');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Edit Employee
  const handleEditClick = (employee: SalesEmployee) => {
    setSelectedEmployee(employee);
    setEditEmployeeData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      is_active: employee.is_active,
      round_robin_order: employee.round_robin_order,
    });
    setIsEditModalOpen(true);
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`${API_BASE}/sales-employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEmployeeData),
      });

      if (!res.ok) throw new Error('Failed to update sales employee');

      await fetchEmployees();
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      setEditEmployeeData({});
      alert('Đã cập nhật nhân viên sale thành công!');
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Manage Specializations
  const handleManageSpecializations = async (employee: SalesEmployee) => {
    setSelectedEmployee(employee);
    await fetchSpecializations(employee.id);
    setIsSpecializationModalOpen(true);
  };

  // Delete Employee (Soft delete)
  const handleDeleteEmployee = async (employeeId: number, employeeName: string) => {
    if (confirm(`Bạn có chắc muốn vô hiệu hóa nhân viên "${employeeName}"?`)) {
      try {
        const res = await fetch(`${API_BASE}/sales-employees/${employeeId}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('Failed to delete sales employee');

        await fetchEmployees();
        alert('Đã vô hiệu hóa nhân viên sale thành công!');
      } catch (err: any) {
        alert(`Lỗi: ${err.message}`);
      }
    }
  };

  // Reset Daily Counts
  const handleResetDailyCounts = async () => {
    if (confirm('Bạn có chắc muốn reset số lead hôm nay của tất cả nhân viên?')) {
      try {
        const res = await fetch(`${API_BASE}/sales-employees/reset-daily`, {
          method: 'POST',
        });

        if (!res.ok) throw new Error('Failed to reset daily counts');

        await fetchEmployees();
        alert('Đã reset số lead hôm nay thành công!');
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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Quản lý Nhân viên Sale</h1>
          <p className="text-slate-500 text-sm">Quản lý danh sách nhân viên sale và chuyên môn sản phẩm</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleResetDailyCounts}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-md hover:shadow-lg transition-all font-medium"
          >
            <TrendingUp size={18} />
            Reset số lead hôm nay
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all font-medium"
          >
            <PlusCircle size={20} />
            Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCircle className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng NV</p>
              <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đang hoạt động</p>
              <p className="text-2xl font-bold text-slate-800">
                {employees.filter((e) => e.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng lead hôm nay</p>
              <p className="text-2xl font-bold text-slate-800">
                {employees.reduce((sum, e) => sum + (e.daily_lead_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng lead all-time</p>
              <p className="text-2xl font-bold text-slate-800">
                {employees.reduce((sum, e) => sum + (e.total_lead_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mã NV</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tên</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Email</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Điện thoại</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Chuyên môn</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Lead hôm nay</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tổng lead</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-700 font-medium">#{employee.id}</td>
                <td className="px-6 py-4 text-sm font-mono text-slate-900 font-semibold">
                  {employee.employee_code}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{employee.full_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{employee.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{employee.phone || '-'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleManageSpecializations(employee)}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <Tag size={14} />
                    Quản lý
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                    {employee.daily_lead_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {employee.total_lead_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      employee.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {employee.is_active ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEditClick(employee)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id, employee.full_name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Vô hiệu hóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Chưa có nhân viên sale nào. Nhấn "Thêm nhân viên" để bắt đầu.
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-accent" />
              Thêm nhân viên sale mới
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhân viên *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono"
                  value={newEmployee.employee_code}
                  onChange={(e) => setNewEmployee({ ...newEmployee, employee_code: e.target.value })}
                  placeholder="NV001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newEmployee.full_name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="nva@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewEmployee({
                    employee_code: '',
                    full_name: '',
                    email: '',
                    phone: '',
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!newEmployee.employee_code || !newEmployee.full_name || !newEmployee.email}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Thêm nhân viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="text-accent" />
              Chỉnh sửa nhân viên sale #{selectedEmployee.id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mã nhân viên (không thể sửa)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 font-mono cursor-not-allowed"
                  value={selectedEmployee.employee_code}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editEmployeeData.full_name || ''}
                  onChange={(e) => setEditEmployeeData({ ...editEmployeeData, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editEmployeeData.email || ''}
                  onChange={(e) => setEditEmployeeData({ ...editEmployeeData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editEmployeeData.phone || ''}
                  onChange={(e) => setEditEmployeeData({ ...editEmployeeData, phone: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-employee-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  checked={editEmployeeData.is_active ?? true}
                  onChange={(e) => setEditEmployeeData({ ...editEmployeeData, is_active: e.target.checked })}
                />
                <label htmlFor="edit-employee-active" className="text-sm text-slate-700">
                  Nhân viên đang hoạt động
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEmployee(null);
                  setEditEmployeeData({});
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditEmployee}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specialization Management Modal */}
      {isSpecializationModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[700px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Tag className="text-indigo-600" />
                Quản lý chuyên môn: {selectedEmployee.full_name}
              </h3>
              <button
                onClick={() => {
                  setIsSpecializationModalOpen(false);
                  setSelectedEmployee(null);
                  setSpecializations([]);
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Specializations */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm">Chuyên môn hiện tại</h4>
                <div className="flex flex-wrap gap-2">
                  {specializations.length > 0 ? (
                    specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm"
                      >
                        <span className="font-medium text-slate-700">{spec.product_groups.name}</span>
                        <button
                          onClick={() => handleRemoveSpecialization(spec.product_group_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Chưa có chuyên môn nào</p>
                  )}
                </div>
              </div>

              {/* Add New Specialization */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-700 mb-3 text-sm">Thêm chuyên môn mới</h4>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {productGroups
                    .filter(
                      (pg) => !specializations.some((spec) => spec.product_group_id === pg.id)
                    )
                    .map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleAddSpecialization(group.id)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
                      >
                        {group.name}
                      </button>
                    ))}
                  {productGroups.filter(
                    (pg) => !specializations.some((spec) => spec.product_group_id === pg.id)
                  ).length === 0 && (
                    <p className="col-span-2 text-sm text-slate-500">
                      Đã thêm tất cả nhóm sản phẩm
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsSpecializationModalOpen(false);
                  setSelectedEmployee(null);
                  setSpecializations([]);
                }}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
