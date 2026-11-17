"use client";

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { getDomains } from '@/services/domainService';
import type { Domain, Project } from '@/lib/types';
import { DomainFavicon } from '@/components/domain-favicon';

export type ShareOffice = 'rhm' | 'pova' | 'firefly' | 'android' | 'other';
type Currency = 'USD' | 'EGP';

const officeConfig: Record<ShareOffice, { project: Project; title: string }> = {
  rhm: { project: 'RHM', title: 'مشاريع RHM' },
  pova: { project: 'pova', title: 'مكتب Pova' },
  firefly: { project: 'firefly', title: 'مكتب Firefly' },
  android: { project: 'android', title: 'تطبيقات اندرويد' },
  other: { project: 'other', title: 'المشاريع الأخرى' },
};

function formatCost(amount: number | '' | undefined, currency: Currency = 'USD') {
  const value = Number(amount) || 0;
  return currency === 'EGP' ? `${value.toFixed(2)} ج.م` : `$${value.toFixed(2)}`;
}

export function OfficeSharePage({ office }: { office: ShareOffice }) {
  const [domains, setDomains] = React.useState<Domain[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const config = officeConfig[office];

  React.useEffect(() => {
    let active = true;

    getDomains()
      .then((items) => {
        if (active) setDomains(items.filter(domain => domain.projects?.includes(config.project) && !domain.isArchived));
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [config.project]);

  const sortedDomains = [...domains].sort((a, b) => a.domainName.localeCompare(b.domainName));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center gap-3 border-b border-border/60 pb-5">
          <img src="/icon-square.png" alt="RHM Digital" className="h-10 w-10 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold">{config.title}</h1>
            <p className="text-sm text-muted-foreground">صفحة مشاركة للعرض فقط</p>
          </div>
        </header>

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">جاري تحميل بيانات المكتب...</p>
        ) : hasError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center">تعذر تحميل بيانات المكتب. حاول فتح الرابط مرة أخرى.</p>
        ) : sortedDomains.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">لا توجد نطاقات مسجلة لهذا المكتب.</p>
        ) : (
          <div className="space-y-3">
            <p className="mb-4 text-sm text-muted-foreground">{sortedDomains.length} نطاق</p>
            {sortedDomains.map((domain) => (
              <article key={domain.id || domain.domainName} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold" dir="ltr">
                      <DomainFavicon domainName={domain.domainName} faviconUrl={domain.faviconUrl} />
                      {domain.domainName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      تاريخ التجديد: {domain.renewalDate ? format(parseISO(domain.renewalDate), 'dd/MM/yyyy') : 'غير محدد'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${domain.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    {domain.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="inline-block min-w-40 rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">تكلفة التجديد</p>
                    <p className="font-semibold">
                      {domain.renewalCost === '' || domain.renewalCost == null
                        ? 'غير محددة'
                        : formatCost(domain.renewalCost, domain.renewalCostCurrency)}
                    </p>
                  </div>
                </div>
                <details className="mt-4 rounded-lg border border-border/70 bg-background/40 p-3">
                  <summary className="cursor-pointer select-none font-medium">شيت المواصفات</summary>
                  {domain.dataSheet?.trim() ? (
                    <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-sm leading-6" dir="auto">
                      {domain.dataSheet}
                    </pre>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">لا توجد مواصفات مسجلة لهذا النطاق.</p>
                  )}
                </details>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
