'use client';

import dynamic from 'next/dynamic';

const DesignTasks = dynamic(
  () => import('@/components/features/ai-design/DesignTasks'),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    )
  }
);

export default function DesignTasksPage() {
  return (
    <div className="p-6">
      <DesignTasks />
    </div>
  );
}
