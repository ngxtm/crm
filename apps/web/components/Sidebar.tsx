'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  // Define the menu structure - only functional pages
  const menuGroups = [
    {
      title: "PHÒNG KINH DOANH",
      items: [
        { href: '/leads', label: 'Hộp chờ tư vấn' },
        { href: '/orders', label: 'Đơn hàng' },
        { href: '/customers', label: 'Khách hàng' },
        { href: '/lead-sources', label: 'Nguồn Lead' },
        { href: '/product-groups', label: 'Nhóm Sản phẩm' },
        { href: '/sales-allocation', label: 'Phân bổ Sale' },
        { href: '/sales-employees', label: 'Nhân viên Sale' },
      ]
    },
    {
      title: "BÌNH FILE",
      items: [
        { href: '/binh-file', label: 'Bình File Giấy' },
        { href: '/binh-file-hop', label: 'Bình File Hộp' },
        { href: '/binh-file-tui', label: 'Bình File Túi' },
      ]
    },
    {
      title: "AI & THIẾT KẾ",
      items: [
        { href: '/ai-bag-customizer', label: 'AI Dán Ảnh Lên Túi' },
        { href: '/ai-bag-generator', label: 'AI Tạo Ảnh Túi' },
        { href: '/design-tasks', label: 'Yêu cầu Thiết kế' },
      ]
    },
    {
      title: "QUẢN LÝ",
      items: [
        { href: '/dashboard', label: 'Dashboard & KPI' },
      ]
    }
  ];

  return (
    <div className="w-64 bg-[#1a365d] text-slate-200 min-h-screen flex flex-col shadow-xl border-r border-slate-700">
      {/* Header */}
      <div className="h-16 flex items-center justify-start px-6 gap-3 border-b border-slate-700/50 bg-[#0f2744]">
        <div className="min-w-[32px] w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shrink-0 bg-white">
          <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-none">CRM Pro</h1>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Lead Master</span>
        </div>
      </div>

      {/* Scrollable Menu Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {menuGroups.map((group, index) => (
          <div key={index} className="space-y-1">
            {/* Group Title */}
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {group.title}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center rounded-lg transition-all duration-200 px-3 py-2.5 w-full text-sm
                    ${isActive
                      ? 'bg-blue-400/90 text-white font-medium shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-700/50 bg-[#0f2744]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg text-sm shrink-0">
            AD
          </div>

          <div className="overflow-hidden min-w-[100px]">
            <p className="text-sm font-medium text-white truncate">Admin User</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs text-slate-400">Đang hoạt động</p>
            </div>
          </div>

          <LogOut size={16} className="text-slate-400 hover:text-red-400 ml-auto" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
