"use client";

import * as React from 'react';
import { DomainDashboard } from '@/components/domain-dashboard';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDomains } from '@/services/domainService';
import { checkDomainStatus } from '@/ai/flows/checkDomainStatus';
import { checkApiKeyStatus } from '@/ai/flows/checkApiKeyStatus';
import type { Domain, Todo, ApiKeyStatus, Project } from '@/lib/types';
import Link from 'next/link';
import { getAllTodosGroupedByDomain, getTodosForDomains, GENERAL_TASKS_KEY } from '@/services/todoService';
import { AllTodosPanel } from '@/components/all-todos-panel';
import { TodosSidePanel } from '@/components/todos-side-panel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign, PiggyBank, ShieldAlert, Receipt, NotebookPen, FileText, Globe, Building2, LayoutGrid, CreditCard, Droplets, Wind, Rss, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FaultsSheet } from '@/components/faults-sheet';
import { GeneralPaperSheet } from '@/components/general-paper-sheet';

import { CatalogUsers } from '@/components/catalog-users';
import { SiteHeader } from '@/components/site-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudflareUsagePanel } from '@/components/cloudflare-usage-panel';
import { SupabaseUsagePanel } from '@/components/supabase-usage-panel';


const StatCard = ({ title, value, icon, className }: { title: string, value: string, icon: React.ElementType, className?: string }) => {
  const Icon = icon;
  return (
    <Card className={cn("card-base card-interactive", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};


export default function WebPage() {
  const [isSecretVisible, setSecretVisible] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const [allDomains, setAllDomains] = React.useState<Domain[]>([]);
  const [domainStatuses, setDomainStatuses] = React.useState<Record<string, 'checking' | 'online' | 'offline'>>({});
  const [apiKeyStatuses, setApiKeyStatuses] = React.useState<ApiKeyStatus[]>([]);
  const [allGroupedTodos, setAllGroupedTodos] = React.useState<Record<string, Todo[]>>({});
  
  const [loading, setLoading] = React.useState(true);
  const [isFaultsSheetOpen, setFaultsSheetOpen] = React.useState(false);
  const [isGeneralPaperSheetOpen, setGeneralPaperSheetOpen] = React.useState(false);
  
  const [buttonsVisible, setButtonsVisible] = React.useState(false);
  const [isTodosPanelOpen, setTodosPanelOpen] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("rhm");

  React.useEffect(() => {
    const handleNavVisibilityChange = () => {
      const navVisible = localStorage.getItem('navVisible') === 'true';
      if (navVisible) {
        setSecretVisible(true);
      }
    };

    window.addEventListener('navVisibilityChanged', handleNavVisibilityChange);
    return () => {
      window.removeEventListener('navVisibilityChanged', handleNavVisibilityChange);
    };
  }, []);


  const apiKeysData = [
    { key: 'AIzaSyAwPSkhtVxkIHvLEph99ipAcjtq3ZIqjy4', name: 'سمارت تيم' },
    { key: 'AIzaSyADRxtILZAQ7EeJA9fKju7tj_YkMErqZH0', name: 'السماح للمفروشات' },
    { key: 'AIzaSyAY7XTQpSR4nws-xRIhABZn3f3kYdGIVDs', name: 'بيرفيوم امبسدور' },
    { key: 'AIzaSyDohlhUWuaygB35M2EY-JB1_F1xztx_lO4', name: 'سمارت تيم ماسنجر' }
  ];

  const handleSecretClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!buttonsVisible) {
      setButtonsVisible(true);
    }

    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (newClickCount >= 2) {
      if (isSecretVisible) {
        setSecretVisible(false);
        setTodosPanelOpen(true);
      } else {
        setSecretVisible(true);
        setTodosPanelOpen(false);
      }
      setClickCount(0);
    }
  };

  const refreshTodos = React.useCallback(async () => {
    try {
      const [allGrouped, todosByDomain] = await Promise.all([
        getAllTodosGroupedByDomain(['ahmed-abdo']),
        getTodosForDomains(['ahmed-abdo']),
      ]);

      const ahmedAbdoTodos = (todosByDomain['ahmed-abdo'] || []).filter(todo => !todo.completed);
      const mergedTodos = {
        ...allGrouped,
        [GENERAL_TASKS_KEY]: [
          ...(allGrouped[GENERAL_TASKS_KEY] || []),
          ...ahmedAbdoTodos,
        ],
      };

      setAllGroupedTodos(mergedTodos);

    } catch (error) {
      console.error("Error refreshing todos:", error);
    }
  }, []);


  const refreshAllStatuses = React.useCallback(async () => {
    try {
      setLoading(true);

      const domainsFromDb = await getDomains();
      const domainsWithProject = domainsFromDb.map(d => {
        let projects = d.projects || [];
        if (projects.includes('rehlethadaf' as Project)) {
          projects = projects.filter(p => p !== 'rehlethadaf' as Project);
          if (!projects.includes('RHM')) {
            projects.push('RHM');
          }
        }
        return {
          ...d,
          projects: projects.length > 0 ? projects : ['RHM']
        };
      });
      setAllDomains(domainsWithProject);

      const initialDomainStatuses: Record<string, 'checking' | 'online' | 'offline'> = {};
      domainsWithProject.forEach(d => {
        if (d.id) initialDomainStatuses[d.id] = 'checking';
      });
      setDomainStatuses(initialDomainStatuses);

      setApiKeyStatuses(apiKeysData.map(item => ({ key: item.key, name: item.name, status: 'checking' as const })));

      refreshTodos();

      for (const domain of domainsWithProject) {
        if (domain.id) {
          checkDomainStatus({ domainName: domain.domainName })
            .then(({ isOnline }) => {
              setDomainStatuses(prev => ({ ...prev, [domain.id!]: isOnline ? 'online' : 'offline' }));
            })
            .catch(() => {
              setDomainStatuses(prev => ({ ...prev, [domain.id!]: 'offline' }));
            });
        }
      }

      apiKeysData.forEach((item) => {
        checkApiKeyStatus({ apiKey: item.key })
          .then(({ isWorking }) => {
            setApiKeyStatuses(prev => prev.map(s => s.key === item.key ? { ...s, status: isWorking ? 'online' : 'offline' } : s));
          })
          .catch(() => {
            setApiKeyStatuses(prev => prev.map(s => s.key === item.key ? { ...s, status: 'offline' } : s));
          });
      });

    } catch (error) {
      console.error("Error refreshing domains and statuses:", error);
    } finally {
      setLoading(false);
    }
  }, [refreshTodos]);

  React.useEffect(() => {
    refreshAllStatuses();
  }, [refreshAllStatuses]);

  const RHMStats = React.useMemo(() => {
    const RHMDomains = allDomains.filter(d => d.projects?.includes('RHM'));
    const totalIncome = RHMDomains.reduce((acc, domain) => {
      const clientCost = Number(domain.renewalCostClient) || 0;
      if (domain.hasInstallments && domain.installmentCount && domain.installmentsPaid) {
        const totalInstallments = Number(domain.installmentCount);
        const paidInstallments = domain.installmentsPaid;
        return acc + (clientCost * (paidInstallments / totalInstallments));
      }
      return acc + clientCost;
    }, 0);
    const netProfit = RHMDomains.reduce((acc, domain) => {
      const clientCost = Number(domain.renewalCostClient) || 0;
      const officeCost = Number(domain.renewalCostOffice) || 0;
      if (domain.hasInstallments && domain.installmentCount && domain.installmentsPaid) {
        const totalInstallments = Number(domain.installmentCount);
        const paidInstallments = domain.installmentsPaid;
        const paidClientCost = clientCost * (paidInstallments / totalInstallments);
        const paidOfficeCost = officeCost * (paidInstallments / totalInstallments);
        return acc + (paidClientCost - paidOfficeCost);
      }
      return acc + (clientCost - officeCost);
    }, 0);
    return { totalIncome, netProfit, totalSites: RHMDomains.length };
  }, [allDomains]);

  const actionButtons = (
    <div className="flex items-center justify-center gap-2">
      <Link href="/rh/sys.html">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="فواتير المكتب الرئيسي"
        >
          <Building2 className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="/rh/oc.html">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="ماليات الأونلاين"
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="/rh/trns.html">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="المعاملات الدولية"
        >
          <CreditCard className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="/fattura">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="الفواتير"
        >
          <Receipt className="h-5 w-5" />
        </Button>
      </Link>
      
      
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        onClick={() => setGeneralPaperSheetOpen(true)}
        title="الورقة العامة"
      >
        <NotebookPen className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        onClick={() => setFaultsSheetOpen(true)}
        title="الأعطال"
      >
        <ShieldAlert className="h-5 w-5" />
      </Button>
      <Link href="/backup">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="النسخ الاحتياطي والاستعادة"
        >
          <Database className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );

  return (
    <>
      <div
        onClick={handleSecretClick}
        className="fixed left-0 top-0 h-full w-4 cursor-pointer z-20"
        title="Secret"
      />

      <FaultsSheet open={isFaultsSheetOpen} onOpenChange={setFaultsSheetOpen} />
      <GeneralPaperSheet open={isGeneralPaperSheetOpen} onOpenChange={setGeneralPaperSheetOpen} />

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/60 md:hidden">
        <div className="container mx-auto px-2 py-2 sm:px-3 lg:px-4">
          <div className={`transition-opacity duration-300 ${buttonsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {actionButtons}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-background text-foreground pb-4 w-full">
        <div className="w-full px-2 sm:px-3 lg:px-4">

          <header className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo الذي يظهر العناصر المخفية عند الضغط عليه */}
              <div className="relative cursor-pointer" onClick={handleSecretClick}>
                <img
                  src="https://rhm-digital.com/favicon.ico"
                  alt="RHM Digital"
                  className="h-10 w-10 rounded-lg"
                />
              </div>
            </div>
            <div className={`hidden md:block transition-opacity duration-300 ${buttonsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {actionButtons}
            </div>
          </header>

          {/* هيدر الموقع الجديد - تحت العنوان الرئيسي */}
          <SiteHeader rhmSitesCount={RHMStats.totalSites} />

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <CloudflareUsagePanel compact />
            <SupabaseUsagePanel />
          </div>

          <div className="mt-4 flex-1">
            {/* تفاصيل لوحة المواقع - قسم مستقل */}
            <main className="mt-4 md:space-y-6">
              {isSecretVisible && (
                <Card className="card-base shadow-lg">
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="px-2 py-1 border-b border-border/60">
                        <TabsList>
                          <TabsTrigger value="rhm">مشاريع RHM</TabsTrigger>
                          <TabsTrigger value="other">المشاريع الأخرى</TabsTrigger>
                          <TabsTrigger value="catalog">تطبيق الكتالوج</TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="rhm" className="m-0">
                        <div className="px-2 pt-0">
                          <DomainDashboard
                            project="RHM"
                            allDomains={allDomains}
                            domainStatuses={domainStatuses}
                            loading={loading}
                            onDomainChange={refreshAllStatuses}
                          />
                        </div>
                        <div className="p-4 border-t border-border mt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <StatCard
                              title="صافي الربح السنوي"
                              value={`$${RHMStats.netProfit.toFixed(2)}`}
                              icon={DollarSign}
                              className="border-green-500/30"
                            />
                            <StatCard
                              title="إجمالي الدخل السنوي"
                              value={`$${RHMStats.totalIncome.toFixed(2)}`}
                              icon={PiggyBank}
                              className="border-blue-500/30"
                            />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="other" className="m-0">
                        <div className="p-2">
                          <DomainDashboard
                            project="other"
                            allDomains={allDomains}
                            domainStatuses={domainStatuses}
                            loading={loading}
                            onDomainChange={refreshAllStatuses}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="catalog" className="m-0">
                        <div className="p-2">
                          <CatalogUsers />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </main>

            {/* قائمة المهام - قسم مستقل */}
            <aside className="w-full">
              <TodosSidePanel
                onUpdate={refreshTodos}
                initialGroupedTodos={allGroupedTodos}
                loading={loading}
                allDomains={allDomains}
                domainStatuses={domainStatuses}
              />
            </aside>
          </div>
        </div>
      </div>

      {/* زر النسخ الاحتياطي في الأسفل */}
          <div className="w-full flex justify-center py-8 border-t border-border/40 bg-background/50">
        <Link href="/backup">
          <Button
            className="bg-black/30 hover:bg-black/50 text-white/50 hover:text-white/80 backdrop-blur-sm border border-white/5 rounded-full transition-all duration-300"
            size="sm"
          >
            <Database className="mr-1.5 h-3 w-3" />
            <span className="text-xs">النسخ الاحتياطي</span>
          </Button>
        </Link>
      </div>
    </>
  );
}
