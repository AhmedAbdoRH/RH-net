"use client";

import * as React from 'react';
import { AlertTriangle, Activity, CheckCircle2, Cloud, Cpu, ExternalLink, Gauge, Loader2, RefreshCw, Server, Zap, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Usage = { plan: string; dailyUsage: number; workersRequests: number; pagesFunctionsRequests: number; workersCpuTimeMs: number; cpuAverageMs: number; workersSubrequests: number; subrequestsAverage: number; monthlyUsage: number; monthlyWorkersRequests: number; monthlyPagesFunctionsRequests: number; dailyLimit: number; monthlyLimit: number; percentage: number; resetAt: string; projectedLimitTime: string | null; updatedAt: string; workerBreakdown: { name: string; requests: number; percentage: number }[]; workers: { name: string; routes: { pattern: string; failOpen: boolean }[] }[]; pages: { name: string; buildsThisMonth: number | null; failedBuilds: number | null; domains: string[] }[]; limits: Record<string, number> };

const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
const formatTime = (iso: string | null) => iso ? new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Cairo' }).format(new Date(iso)) : 'غير متوقع';

function level(p: number) { return p >= 100 ? 'critical' : p >= 90 ? 'danger' : p >= 80 ? 'warning' : p >= 60 ? 'watch' : 'healthy'; }

export function CloudflareUsagePanel({ compact = false }: { compact?: boolean }) {
  const [data, setData] = React.useState<Usage | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updated, setUpdated] = React.useState<Date | null>(null);

  const load = React.useCallback(async () => { setLoading(true); try { const response = await fetch('/api/cloudflare/usage', { cache: 'no-store' }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload); setError(null); setUpdated(new Date()); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل بيانات Cloudflare'); } finally { setLoading(false); } }, []);
  React.useEffect(() => { load(); const timer = window.setInterval(load, 300000); return () => window.clearInterval(timer); }, [load]);

  if (loading && !data) return <Card className="border-cyan-400/20 bg-cyan-950/10"><CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> جاري فحص حدود Cloudflare...</CardContent></Card>;
  if (error && !data) return <Card className="border-amber-400/30 bg-amber-950/10"><CardContent className="flex items-center justify-between gap-4 py-5"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><div><p className="font-medium">تعذر قراءة استخدام Cloudflare</p><p className="text-xs text-muted-foreground">{error}. أضف CLOUDFLARE_API_TOKEN وCLOUDFLARE_ACCOUNT_ID كأسرار.</p></div></div><Button variant="outline" size="sm" onClick={load}>إعادة المحاولة</Button></CardContent></Card>;
  if (!data) return null;
  const status = level(data.percentage);
  const statusText = status === 'critical' ? 'تم تجاوز الحد أو على وشك التجاوز' : status === 'danger' ? 'خطر: راقب المصدر الآن' : status === 'warning' ? 'تحذير: الاستخدام مرتفع' : status === 'watch' ? 'متابعة: اقترب من الحد' : 'الاستخدام طبيعي';
  const statusColor = { healthy: 'text-emerald-400', watch: 'text-sky-400', warning: 'text-amber-400', danger: 'text-orange-400', critical: 'text-red-400' }[status];
  if (compact) return <div className="flex items-center justify-center gap-2 py-1" dir="rtl" aria-label="مؤشرات Cloudflare"><CircleMetric mark="D" label="Requests" period="يومي" value={data.dailyUsage} limit={data.dailyLimit} icon={Activity} /><CircleMetric mark="M" label="Requests" period="شهري" value={data.monthlyUsage} limit={data.monthlyLimit} icon={Cloud} /><CircleMetric mark="CPU" label="CPU avg" period="لكل طلب" value={data.cpuAverageMs} limit={10} icon={Cpu} unit="ms" decimals={2} /><CircleMetric mark="S" label="Subreq avg" period="لكل طلب" value={data.subrequestsAverage} limit={50} icon={Zap} decimals={2} /><CircleMetric mark="P" label="Pages Builds" period="شهري" value={data.pages.reduce((sum, page) => sum + (page.buildsThisMonth || 0), 0)} limit={data.limits.pagesBuilds} icon={GitBranch} /></div>;
  return <section className="space-y-3" dir="rtl" aria-label="تفاصيل مراقبة حدود Cloudflare">
    <div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-orange-400" /><h2 className="text-sm font-semibold tracking-wide">مراقبة Cloudflare <span className="text-xs font-normal text-muted-foreground">خطة مجانية</span></h2></div><Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-8 gap-1.5 text-xs"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> تحديث</Button></div>
    <Card className={cn('overflow-hidden border transition-colors', status === 'critical' ? 'border-red-500/50 bg-red-950/20' : status === 'danger' ? 'border-orange-500/40 bg-orange-950/10' : 'border-cyan-400/25 bg-gradient-to-br from-cyan-950/20 via-card to-card')}>
      <CardHeader className="pb-3"><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-5 w-5 text-cyan-300" /> إجمالي Edge Requests <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-normal text-muted-foreground">Workers + Pages Functions · يومي</span></CardTitle><p className={cn('mt-1 text-xs', statusColor)}>{statusText}</p></div><div className="text-left"><div className="text-3xl font-bold tabular-nums">{data.percentage.toFixed(1)}%</div><div className="text-xs text-muted-foreground">من {formatNumber(data.dailyLimit)}</div></div></div></CardHeader>
      <CardContent className="space-y-4"><Progress value={Math.min(data.percentage, 100)} className="h-2" /><div className="grid gap-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">الإجمالي اليوم</p><p className="font-semibold tabular-nums">{formatNumber(data.dailyUsage)}</p></div><div><p className="text-xs text-muted-foreground">Workers</p><p className="font-semibold tabular-nums">{formatNumber(data.workersRequests)}</p></div><div><p className="text-xs text-muted-foreground">Pages Functions</p><p className="font-semibold tabular-nums">{formatNumber(data.pagesFunctionsRequests)}</p></div><div><p className="text-xs text-muted-foreground">إعادة الضبط</p><p className="font-semibold">{formatTime(data.resetAt)}</p></div></div><p className="text-[10px] text-muted-foreground">طلبات Static Pages لا تدخل في هذا العداد لأنها مجانية وغير محدودة.</p></CardContent>
    </Card>
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><Metric icon={Cpu} title="CPU لكل طلب" value="10ms" detail="حد الخطة المجانية" /><Metric icon={Zap} title="Subrequests" value="50 خارجي" detail="+ 1,000 داخلي" /><Metric icon={Gauge} title="اتصالات خارجة" value="6" detail="لكل طلب" /><Metric icon={Server} title="Workers" value={`${data.workers.length} / ${data.limits.workers}`} detail="المستخدم / الحد" /></div>
    <Card className="border-white/10 bg-card/70"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Server className="h-4 w-4 text-muted-foreground" /> الاستهلاك حسب Worker</CardTitle></CardHeader><CardContent className="space-y-2">{data.workerBreakdown.length ? data.workerBreakdown.slice(0, 6).map(worker => <div key={worker.name} className="flex items-center gap-3 text-xs"><span className="w-36 truncate font-medium" title={worker.name}>{worker.name}</span><Progress value={Math.min(worker.percentage, 100)} className="h-1.5 flex-1" /><span className="w-20 text-left tabular-nums text-muted-foreground">{formatNumber(worker.requests)} ({worker.percentage.toFixed(1)}%)</span></div>) : <p className="text-xs text-muted-foreground">لا توجد طلبات مرصودة اليوم.</p>}</CardContent></Card>
    <div className="grid gap-3 md:grid-cols-2"><Card className="border-white/10 bg-card/70"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Cloud className="h-4 w-4 text-muted-foreground" /> Pages Builds</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">{data.pages.map(page => <div key={page.name} className="flex items-center justify-between gap-3"><span className="truncate">{page.name}</span><span className={cn('tabular-nums', page.failedBuilds ? 'text-red-400' : 'text-muted-foreground')}>{page.buildsThisMonth ?? '—'} / {data.limits.pagesBuilds} {page.failedBuilds ? `· ${page.failedBuilds} فاشل` : ''}</span></div>)}</CardContent></Card><Card className="border-white/10 bg-card/70"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Fail mode</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">{data.workers.flatMap(w => w.routes.map(route => <div key={`${w.name}-${route.pattern}`} className="flex items-center justify-between gap-3"><span className="truncate" title={route.pattern}>{w.name} · {route.pattern}</span><span className={route.failOpen ? 'text-amber-400' : 'text-red-400'}>{route.failOpen ? 'Fail open' : 'Fail closed'}</span></div>)).slice(0, 5)}</CardContent></Card></div>
    <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground"><span>{updated ? `آخر تحديث ${updated.toLocaleTimeString('ar-EG')}` : ''}</span><a className="inline-flex items-center gap-1 hover:text-foreground" href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">فتح Cloudflare <ExternalLink className="h-3 w-3" /></a></div>
  </section>;
}

const CLOUDFLARE_SOURCE = 'Cloudflare';
const CLOUDFLARE_METRIC_DESC: Record<string, string> = {
  'D · يومي': 'عدد الطلبات اليومية على الـ Edge (Workers + Pages Functions) — من أصل 10,000 طلب مجاني يوميًا',
  'M · شهري': 'إجمالي الطلبات الشهرية على الـ Edge — من أصل 1,000,000 طلب مجاني شهريًا',
  'CPU · لكل طلب': 'متوسط وقت المعالجة (CPU) لكل طلب بالمللي ثانية — الحد الأقصى 10ms في الخطة المجانية',
  'S · لكل طلب': 'متوسط عدد الطلبات الخارجية (Subrequests) لكل طلب — الحد الأقصى 50 طلب خارجي + 1,000 داخلي',
  'P · شهري': 'عدد عمليات بناء (Builds) صفحات Next.js Pages هذا الشهر — من أصل 500 بناء مجاني',
};

function CircleMetric({ mark, label, period, value, limit, icon: Icon, unit = '', decimals = 0 }: { mark: string; label: string; period: string; value: number; limit: number; icon: React.ElementType; unit?: string; decimals?: number }) {
  const percentage = limit > 0 ? (value / limit) * 100 : 0;
  const bounded = Math.min(Math.max(percentage, 0), 100);
  const status = level(percentage);
  const color = status === 'critical' ? '#f87171' : status === 'danger' ? '#fb923c' : status === 'warning' ? '#fbbf24' : status === 'watch' ? '#38bdf8' : '#34d399';
  const key = `${mark} · ${period}`;
  const desc = CLOUDFLARE_METRIC_DESC[key] || `${label} (${period}): ${value.toFixed(decimals)}${unit} / ${limit}${unit} (${percentage.toFixed(1)}%)`;
  return <div className="group flex w-[3.9rem] flex-col items-center gap-0.5" title={`${CLOUDFLARE_SOURCE}\n${desc}`}><div className="relative h-12 w-12 rounded-full p-[3px] transition-transform group-hover:scale-105" style={{ background: `conic-gradient(${color} ${bounded * 3.6}deg, rgba(255,255,255,0.09) 0deg)` }}><div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card leading-none"><Icon className="mb-0.5 h-3 w-3" style={{ color }} /><span className="text-[9px] font-bold">{percentage.toFixed(0)}%</span></div></div><span className="max-w-[3.9rem] truncate text-[9px] text-muted-foreground">{mark} · {period}</span></div>; }

function Metric({ icon: Icon, title, value, detail }: { icon: React.ElementType; title: string; value: string; detail: string }) { return <Card className="border-white/10 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><Icon className="h-4 w-4 text-cyan-300" /><div><p className="text-xs text-muted-foreground">{title}</p><p className="font-semibold">{value}</p><p className="text-[10px] text-muted-foreground">{detail}</p></div></CardContent></Card>; }
