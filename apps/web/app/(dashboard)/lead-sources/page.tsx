'use client';

import { useState } from 'react';
import { useLeadSources, useCampaigns } from '@/lib/api-hooks';
import { source_type, LeadSource, Campaign } from '@/lib/types';
import { PlusCircle, Edit, Trash2, X, Calendar, DollarSign } from 'lucide-react';

const sourceTypeLabels: Record<source_type, string> = {
  facebook: 'Facebook',
  zalo: 'Zalo',
  tiktok: 'TikTok',
  website: 'Website',
  referral: 'Giới thiệu',
  other: 'Khác',
};

export default function LeadSourcesPage() {
  const [activeTab, setActiveTab] = useState<'sources' | 'campaigns'>('sources');

  const {
    sources,
    loading: sourcesLoading,
    error: sourcesError,
    addSource,
    updateSource,
    deleteSource
  } = useLeadSources();

  const {
    campaigns,
    loading: campaignsLoading,
    error: campaignsError,
    addCampaign,
    updateCampaign,
    deleteCampaign
  } = useCampaigns();

  // Modal states
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isEditSourceModalOpen, setIsEditSourceModalOpen] = useState(false);
  const [isAddCampaignModalOpen, setIsAddCampaignModalOpen] = useState(false);
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<LeadSource | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Form states
  const [newSource, setNewSource] = useState({
    type: 'facebook' as source_type,
    name: '',
    description: '',
    is_active: true,
  });

  const [editSourceData, setEditSourceData] = useState<Partial<LeadSource>>({});

  const [newCampaign, setNewCampaign] = useState({
    source_id: 0,
    name: '',
    code: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    is_active: true,
  });

  const [editCampaignData, setEditCampaignData] = useState<Partial<Campaign>>({});

  const loading = activeTab === 'sources' ? sourcesLoading : campaignsLoading;
  const error = activeTab === 'sources' ? sourcesError : campaignsError;

  // Lead Source Handlers
  const handleAddSource = async () => {
    if (!newSource.name || !newSource.type) {
      alert('Vui lòng điền tên và loại nguồn!');
      return;
    }

    const success = await addSource(newSource);
    if (success) {
      setIsAddSourceModalOpen(false);
      setNewSource({
        type: 'facebook',
        name: '',
        description: '',
        is_active: true,
      });
      alert('Đã thêm nguồn lead thành công!');
    }
  };

  const handleEditSource = async () => {
    if (!selectedSource) return;

    const success = await updateSource(selectedSource.id, editSourceData);
    if (success) {
      setIsEditSourceModalOpen(false);
      setSelectedSource(null);
      setEditSourceData({});
      alert('Đã cập nhật nguồn lead thành công!');
    }
  };

  const handleDeleteSource = async (sourceId: number, sourceName: string) => {
    if (confirm(`Bạn có chắc muốn xóa nguồn "${sourceName}"?`)) {
      const success = await deleteSource(sourceId);
      if (success) {
        alert('Đã xóa nguồn lead thành công!');
      }
    }
  };

  const handleEditSourceClick = (source: LeadSource) => {
    setSelectedSource(source);
    setEditSourceData({
      type: source.type,
      name: source.name,
      description: source.description,
      is_active: source.is_active,
    });
    setIsEditSourceModalOpen(true);
  };

  // Campaign Handlers
  const handleAddCampaign = async () => {
    if (!newCampaign.name || !newCampaign.source_id || newCampaign.source_id === 0) {
      alert('Vui lòng điền tên chiến dịch và chọn nguồn!');
      return;
    }

    const campaignData: any = {
      source_id: newCampaign.source_id,
      name: newCampaign.name,
    };

    // Only add optional fields if they have values
    if (newCampaign.code && newCampaign.code.trim()) {
      campaignData.code = newCampaign.code;
    }
    if (newCampaign.description && newCampaign.description.trim()) {
      campaignData.description = newCampaign.description;
    }
    if (newCampaign.start_date) {
      // Convert YYYY-MM-DD to ISO-8601 DateTime
      campaignData.start_date = new Date(newCampaign.start_date).toISOString();
    }
    if (newCampaign.end_date) {
      // Convert YYYY-MM-DD to ISO-8601 DateTime
      campaignData.end_date = new Date(newCampaign.end_date).toISOString();
    }
    if (newCampaign.budget && newCampaign.budget.trim()) {
      campaignData.budget = parseFloat(newCampaign.budget);
    }
    campaignData.is_active = newCampaign.is_active;

    console.log('Creating campaign with data:', campaignData);

    const success = await addCampaign(campaignData);
    if (success) {
      setIsAddCampaignModalOpen(false);
      setNewCampaign({
        source_id: 0,
        name: '',
        code: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        is_active: true,
      });
      alert('Đã thêm chiến dịch thành công!');
    }
  };

  const handleEditCampaign = async () => {
    if (!selectedCampaign) return;

    const campaignData: any = {
      ...editCampaignData,
    };

    // Convert dates to ISO-8601 if they exist
    if (campaignData.start_date && typeof campaignData.start_date === 'string' && !campaignData.start_date.includes('T')) {
      campaignData.start_date = new Date(campaignData.start_date).toISOString();
    }
    if (campaignData.end_date && typeof campaignData.end_date === 'string' && !campaignData.end_date.includes('T')) {
      campaignData.end_date = new Date(campaignData.end_date).toISOString();
    }
    if (campaignData.budget) {
      campaignData.budget = parseFloat(String(campaignData.budget));
    }

    const success = await updateCampaign(selectedCampaign.id, campaignData);
    if (success) {
      setIsEditCampaignModalOpen(false);
      setSelectedCampaign(null);
      setEditCampaignData({});
      alert('Đã cập nhật chiến dịch thành công!');
    }
  };

  const handleDeleteCampaign = async (campaignId: number, campaignName: string) => {
    if (confirm(`Bạn có chắc muốn xóa chiến dịch "${campaignName}"?`)) {
      const success = await deleteCampaign(campaignId);
      if (success) {
        alert('Đã xóa chiến dịch thành công!');
      }
    }
  };

  const handleEditCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditCampaignData({
      source_id: campaign.source_id,
      name: campaign.name,
      code: campaign.code,
      description: campaign.description,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      budget: campaign.budget,
      is_active: campaign.is_active,
    });
    setIsEditCampaignModalOpen(true);
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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Quản lý Nguồn Lead & Chiến dịch</h1>
          <p className="text-slate-500 text-sm">Cấu hình nguồn thu thập lead và các chiến dịch marketing</p>
        </div>
        <button
          onClick={() => activeTab === 'sources' ? setIsAddSourceModalOpen(true) : setIsAddCampaignModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all font-medium"
        >
          <PlusCircle size={20} />
          {activeTab === 'sources' ? 'Thêm nguồn lead' : 'Thêm chiến dịch'}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'sources'
              ? 'border-b-2 border-accent text-accent'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nguồn Lead ({sources.length})
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'campaigns'
              ? 'border-b-2 border-accent text-accent'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Chiến dịch ({campaigns.length})
        </button>
      </div>

      {/* Lead Sources Table */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tên</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Loại</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mô tả</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">#{source.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{source.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {sourceTypeLabels[source.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {source.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        source.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {source.is_active ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditSourceClick(source)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id, source.name)}
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

          {sources.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Chưa có nguồn lead nào. Nhấn "Thêm nguồn lead" để bắt đầu.
            </div>
          )}
        </div>
      )}

      {/* Campaigns Table */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Tên chiến dịch</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Nguồn</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Mã</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Ngân sách</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">#{campaign.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{campaign.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {campaign.lead_sources?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{campaign.code || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {campaign.budget ? `${Number(campaign.budget).toLocaleString('vi-VN')} đ` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="flex flex-col gap-1">
                      <div>
                        {campaign.start_date
                          ? new Date(campaign.start_date).toLocaleDateString('vi-VN')
                          : '-'}
                      </div>
                      {campaign.end_date && (
                        <div className="text-xs text-slate-400">
                          đến {new Date(campaign.end_date).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        campaign.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.is_active ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditCampaignClick(campaign)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
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

          {campaigns.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Chưa có chiến dịch nào. Nhấn "Thêm chiến dịch" để bắt đầu.
            </div>
          )}
        </div>
      )}

      {/* Add Source Modal */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-accent" />
              Thêm nguồn lead mới
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên nguồn *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="VD: Facebook Ads Tết 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại nguồn *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value as source_type })}
                >
                  {Object.entries(sourceTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  placeholder="Mô tả về nguồn lead này"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-source-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  checked={newSource.is_active}
                  onChange={(e) => setNewSource({ ...newSource, is_active: e.target.checked })}
                />
                <label htmlFor="new-source-active" className="text-sm text-slate-700">
                  Kích hoạt nguồn ngay
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddSourceModalOpen(false);
                  setNewSource({
                    type: 'facebook',
                    name: '',
                    description: '',
                    is_active: true,
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddSource}
                disabled={!newSource.name}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Thêm nguồn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Source Modal */}
      {isEditSourceModalOpen && selectedSource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="text-accent" />
              Chỉnh sửa nguồn lead #{selectedSource.id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên nguồn *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editSourceData.name || ''}
                  onChange={(e) => setEditSourceData({ ...editSourceData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại nguồn *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editSourceData.type || 'facebook'}
                  onChange={(e) => setEditSourceData({ ...editSourceData, type: e.target.value as source_type })}
                >
                  {Object.entries(sourceTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={editSourceData.description || ''}
                  onChange={(e) => setEditSourceData({ ...editSourceData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-source-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  checked={editSourceData.is_active ?? true}
                  onChange={(e) => setEditSourceData({ ...editSourceData, is_active: e.target.checked })}
                />
                <label htmlFor="edit-source-active" className="text-sm text-slate-700">
                  Nguồn đang hoạt động
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditSourceModalOpen(false);
                  setSelectedSource(null);
                  setEditSourceData({});
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditSource}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {isAddCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-accent" />
              Thêm chiến dịch mới
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên chiến dịch *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="VD: Chiến dịch Tết 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn lead *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newCampaign.source_id}
                  onChange={(e) => setNewCampaign({ ...newCampaign, source_id: parseInt(e.target.value) })}
                >
                  <option value={0}>-- Chọn nguồn --</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({sourceTypeLabels[source.type]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã chiến dịch</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono"
                  value={newCampaign.code}
                  onChange={(e) => setNewCampaign({ ...newCampaign, code: e.target.value })}
                  placeholder="TET2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Mô tả về chiến dịch"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngân sách (VNĐ)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                  placeholder="10000000"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-campaign-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  checked={newCampaign.is_active}
                  onChange={(e) => setNewCampaign({ ...newCampaign, is_active: e.target.checked })}
                />
                <label htmlFor="new-campaign-active" className="text-sm text-slate-700">
                  Kích hoạt chiến dịch ngay
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddCampaignModalOpen(false);
                  setNewCampaign({
                    source_id: 0,
                    name: '',
                    code: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    budget: '',
                    is_active: true,
                  });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddCampaign}
                disabled={!newCampaign.name || !newCampaign.source_id}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Thêm chiến dịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {isEditCampaignModalOpen && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit className="text-accent" />
              Chỉnh sửa chiến dịch #{selectedCampaign.id}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên chiến dịch *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editCampaignData.name || ''}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nguồn lead *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editCampaignData.source_id || 0}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, source_id: parseInt(e.target.value) })}
                >
                  <option value={0}>-- Chọn nguồn --</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({sourceTypeLabels[source.type]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã chiến dịch</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none font-mono"
                  value={editCampaignData.code || ''}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none resize-none"
                  rows={3}
                  value={editCampaignData.description || ''}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                    value={editCampaignData.start_date || ''}
                    onChange={(e) => setEditCampaignData({ ...editCampaignData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                    value={editCampaignData.end_date || ''}
                    onChange={(e) => setEditCampaignData({ ...editCampaignData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngân sách (VNĐ)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  value={editCampaignData.budget || ''}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, budget: parseFloat(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-campaign-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  checked={editCampaignData.is_active ?? true}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, is_active: e.target.checked })}
                />
                <label htmlFor="edit-campaign-active" className="text-sm text-slate-700">
                  Chiến dịch đang hoạt động
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditCampaignModalOpen(false);
                  setSelectedCampaign(null);
                  setEditCampaignData({});
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditCampaign}
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
