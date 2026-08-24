"use client";

import * as React from 'react';
import { AlertTriangle, Database, Files, Loader2 } from 'lucide-react';

type Usage = {
  plan: string;
  databaseBytes: number;
  databaseLimitBytes: number;
  storageBytes: number;
  storageLimitBytes: number;
  storageFiles: number;
  totalUsers: number;
  updatedAt: string;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 100 * 1024 * 1024 ? 1 : 0)} MB`;
};

function colour(percentage: number) {
  if (percentage >= 95) return '#f87171';
  if (percentage >= 80) return '#fb923c';
  if (percentage >= 60) return '#fbbf24';
  return '#34d399';
}

const SUPABASE_SOURCE = 'Supabase — قاعدة البيانات';
const SUPABASE_METRIC_DESC: Record<string, string> = {
  'DB · قاعدة البيانات': 'حجم قاعدة البيانات PostgreSQL — من أصل 500 MB في الخطة المجانية (Free)',
  'FS · الملفات': 'حجم تخزين الملفات (Storage) — من أصل 1 GB، وعدد الملفات المخزنة',
};

function Circle({ mark, label, value, limit, icon: Icon, detail }: { mark: string; label: string; value: number; limit: number; icon: React.ElementType; detail: string }) {
  const percentage = limit ? (value / limit) * 100 : 0;
  const bounded = Math.min(Math.max(percentage, 0), 100);
  const color = colour(percentage);
  const key = `${mark} · ${label}`;
  const desc = SUPABASE_METRIC_DESC[key] || `${label}: ${detail} (${percentage.toFixed(1)}%)`;
  return <div className="group flex w-[4.5rem] flex-col items-center gap-0.5" title={`${SUPABASE_SOURCE}\n${desc}`}>
    <div className="relative h-12 w-12 rounded-full p-[3px] transition-transform group-hover:scale-105" style={{ background: `conic-gradient(${color} ${bounded * 3.6}deg, rgba(255,255,255,0.09) 0deg)` }}>
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card leading-none">
        <Icon className="mb-0.5 h-3 w-3" style={{ color }} />
        <span className="text-[9px] font-bold">{percentage.toFixed(0)}%</span>
      </div>
    </div>
    <span className="max-w-[4.5rem] truncate text-[9px] text-muted-foreground">{mark} · {label}</span>
  </div>;
}

export function SupabaseUsagePanel() {
  const [data, setData] = React.useState<Usage | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const response = await fetch('/api/supabase/usage', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل بيانات Supabase');
    }
  }, []);

  React.useEffect(() => {
    load();
    const timer = window.setInterval(load, 300000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!data && !error) return <div className="flex justify-center py-1 text-[10px] text-muted-foreground"><Loader2 className="ml-1 h-3 w-3 animate-spin" /> جاري فحص Supabase...</div>;
  if (!data) return <div className="flex justify-center gap-1 py-1 text-[10px] text-amber-400" title={error ?? undefined}><AlertTriangle className="h-3 w-3" /> تعذر فحص Supabase</div>;

  return <div className="flex items-center justify-center gap-2 py-1" dir="rtl" aria-label="مؤشرات قاعدة بيانات Supabase">
    <Circle mark="DB" label="قاعدة البيانات" value={data.databaseBytes} limit={data.databaseLimitBytes} icon={Database} detail={`${formatBytes(data.databaseBytes)} / 500 MB`} />
    <Circle mark="FS" label="الملفات" value={data.storageBytes} limit={data.storageLimitBytes} icon={Files} detail={`${formatBytes(data.storageBytes)} / 1 GB · ${data.storageFiles.toLocaleString('en-US')} ملف`} />
  </div>;
}
