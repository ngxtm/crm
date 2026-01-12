'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Search,
  Download,
  RotateCcw,
  Trophy,
  TrendingDown,
  User,
  MoreVertical,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
import { MultiSelect } from '@/components/ui/MultiSelect';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface EmployeeKPI {
  id: number;
  name: string;
  employee_code: string;
  leads: number;
  orders: number;
  avgProcessingTime: number;
  conversionRate: number;
  cskh: number;
  revenue: number;
  target: number;
  progressPercent: number;
}

interface ChartDataPoint {
  name: string;
  date: string;
  leads: number;
  orders: number;
  leadMA: number;
  orderMA: number;
}

interface DashboardMetrics {
  leads: { total: number; today: number; converted: number };
  orders: { total: number; today: number; completed: number };
  revenue: { total: number; today: number; target: number };
  cskh: { total: number; pending: number };
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [employeeKPIs, setEmployeeKPIs] = useState<EmployeeKPI[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [ranking, setRanking] = useState<{ top3: EmployeeKPI[]; bottom3: EmployeeKPI[] }>({ top3: [], bottom3: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSales, setFilterSales] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [metricsRes, kpisRes, chartRes, rankingRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/metrics`),
          fetch(`${API_BASE}/dashboard/employee-kpis`),
          fetch(`${API_BASE}/dashboard/chart-data`),
          fetch(`${API_BASE}/dashboard/employee-ranking`),
        ]);

        if (metricsRes.ok) setMetrics(await metricsRes.json());
        if (kpisRes.ok) setEmployeeKPIs(await kpisRes.json());
        if (chartRes.ok) setChartData(await chartRes.json());
        if (rankingRes.ok) setRanking(await rankingRes.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}p`;
    return `${m}p`;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterSales([]);
  };

  // Filter employee KPIs
  const filteredKPIs = useMemo(() => {
    return employeeKPIs.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSales = filterSales.length > 0 ? filterSales.includes(emp.name) : true;
      return matchesSearch && matchesSales;
    });
  }, [employeeKPIs, searchQuery, filterSales]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen overflow-y-auto flex flex-col pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <BarChart3 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Báo cáo KPIs</h2>
          <p className="text-slate-500 text-sm">Tổng quan hiệu suất Sales & CSKH</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              <Download size={16} /> Excel
            </button>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <MultiSelect
            label="NV Sale"
            options={employeeKPIs.map(e => e.name)}
            selectedValues={filterSales}
            onChange={setFilterSales}
          />
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-100 pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase font-semibold">Số Lead</span>
              <span className="text-xl font-bold text-slate-800">{metrics.leads.total}</span>
            </div>
            <div className="flex flex-col border-l pl-6 border-slate-100">
              <span className="text-xs text-slate-500 uppercase font-semibold">Số đơn (Đã chốt)</span>
              <span className="text-xl font-bold text-blue-600">{metrics.orders.total}</span>
            </div>
            <div className="flex flex-col border-l pl-6 border-slate-100">
              <span className="text-xs text-slate-500 uppercase font-semibold">Doanh số</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(metrics.revenue.total)}</span>
            </div>
            <div className="flex flex-col border-l pl-6 border-slate-100">
              <span className="text-xs text-slate-500 uppercase font-semibold">CSKH</span>
              <span className="text-xl font-bold text-orange-500">{metrics.cskh.total}</span>
            </div>
          </div>
        )}
      </div>

      {/* Charts & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* MACD Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-700">Tương quan Lead & Đơn hàng (MACD)</h3>
            <p className="text-xs text-slate-500 mt-1">2 đường di chuyển và cắt nhau theo thời gian</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: 'white'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />
              <Line type="monotone" dataKey="leads" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" opacity={0.6} name="Số Lead" />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" opacity={0.6} name="Số Đơn" />
              <Line type="monotone" dataKey="leadMA" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} name="Lead MA (3 ngày)" />
              <Line type="monotone" dataKey="orderMA" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} name="Đơn MA (3 ngày)" />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-slate-700">Xếp hạng nhân viên</h3>
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            {/* Top 3 */}
            <div className="bg-yellow-50/50 rounded-lg p-3 border border-yellow-100 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 text-yellow-700 font-bold text-sm uppercase">
                <Trophy size={16} /> Top 3 Xuất Sắc
              </div>
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {ranking.top3.map((sale, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-yellow-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                        ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                        {idx + 1}
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[70px]">{sale.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-600">{formatCurrency(sale.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 3 */}
            <div className="bg-red-50/50 rounded-lg p-3 border border-red-100 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 text-red-700 font-bold text-sm uppercase">
                <TrendingDown size={16} /> Cần Cố Gắng
              </div>
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {ranking.bottom3.map((sale, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-red-100">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                        <User size={12} className="text-slate-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[70px]">{sale.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{formatCurrency(sale.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee KPI Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Target className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Bảng nhân viên các thông số</h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical size={20} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4 border-r border-slate-100 w-[15%]">Sale</th>
                <th className="p-4 text-center border-r border-slate-100 w-[10%]">Số Lead</th>
                <th className="p-4 text-center border-r border-slate-100 w-[10%]">Số đơn</th>
                <th className="p-4 text-center border-r border-slate-100 w-[10%]">Thời gian TB</th>
                <th className="p-4 text-center border-r border-slate-100 w-[10%]">Tỉ lệ chốt</th>
                <th className="p-4 text-center border-r border-slate-100 w-[10%]">CSKH</th>
                <th className="p-4 text-right border-r border-slate-100 w-[15%]">Doanh số</th>
                <th className="p-4 w-[20%]">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredKPIs.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 border-r border-slate-100">
                    {emp.name}
                    <div className="text-[10px] text-slate-400 font-normal">Mã: {emp.employee_code}</div>
                  </td>
                  <td className="p-4 text-center text-slate-600 border-r border-slate-100 bg-slate-50/30">
                    {emp.leads}
                  </td>
                  <td className="p-4 text-center font-bold text-blue-600 border-r border-slate-100 bg-blue-50/20">
                    {emp.orders}
                  </td>
                  <td className="p-4 text-center border-r border-slate-100 text-slate-600">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      <span>{formatTime(emp.avgProcessingTime)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center border-r border-slate-100">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border
                      ${emp.conversionRate >= 30
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : emp.conversionRate >= 20
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {emp.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-600 border-r border-slate-100">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-orange-500">{emp.cskh}</span>
                      <span className="text-[10px] text-slate-400">phản hồi</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium text-green-600 border-r border-slate-100">
                    {formatCurrency(emp.revenue)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                        <span>{emp.progressPercent}%</span>
                        <span>Mục tiêu: {formatCurrency(emp.target).replace('₫', '')}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500
                            ${emp.progressPercent >= 100 ? 'bg-green-500' : emp.progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(100, emp.progressPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
