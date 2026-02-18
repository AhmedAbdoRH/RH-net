"use client";

import * as React from 'react';
import { DomainDashboard } from '@/components/domain-dashboard';
import { StatusPanel } from '@/components/status-panel';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDomains } from '@/services/domainService';
import { checkDomainStatus } from '@/ai/flows/checkDomainStatus';
import { checkApiKeyStatus } from '@/ai/flows/checkApiKeyStatus';
import type { Domain, Todo, ApiKeyStatus, Project } from '@/lib/types';
import Link from 'next/link';
import { getTodosForDomains, getAllTodosGroupedByDomain } from '@/services/todoService';
import { AllTodosPanel } from '@/components/all-todos-panel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign, PiggyBank, ShieldAlert, Code2, User, Receipt, NotebookPen, FileText, Globe, Building2, LayoutGrid, CreditCard, Droplets, Wind, Rss, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FaultsSheet } from '@/components/faults-sheet';
import { GeneralPaperSheet } from '@/components/general-paper-sheet';
import { LeaderboardSheet } from '@/components/leaderboard-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const StatCard = ({ title, value, icon, className }: { title: string, value: string, icon: React.ElementType, className?: string }) => {
    const Icon = icon;
    return (
        <Card className={cn("bg-card/50", className)}>
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
  const [domainTodos, setDomainTodos] = React.useState<Record<string, Todo[]>>({});
  const [allGroupedTodos, setAllGroupedTodos] = React.useState<Record<string, Todo[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [isFaultsSheetOpen, setFaultsSheetOpen] = React.useState(false);
  const [isGeneralPaperSheetOpen, setGeneralPaperSheetOpen] = React.useState(false);
  const [isLeaderboardSheetOpen, setLeaderboardSheetOpen] = React.useState(false);
  const [buttonsVisible, setButtonsVisible] = React.useState(false);
  const [isTodosPanelOpen, setTodosPanelOpen] = React.useState(true);
  
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
  
  const handleSecretClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
        const domainsFromDb = await getDomains();
        const domainIds = domainsFromDb.map(d => d.id).filter((id): id is string => !!id);
        
        const [todosByDomain, allGrouped] = await Promise.all([
            domainIds.length > 0 ? getTodosForDomains(domainIds) : Promise.resolve({}),
            getAllTodosGroupedByDomain()
        ]);

        setDomainTodos(todosByDomain);
        setAllGroupedTodos(allGrouped);

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
  
  const hasTodosMap = React.useMemo(() => {
    const hasTodos: Record<string, boolean> = {};
    Object.keys(domainTodos).forEach(domainId => {
      hasTodos[domainId] = domainTodos[domainId].some(todo => !todo.completed);
    });
    return hasTodos;
  }, [domainTodos]);

  const RHMStats = React.useMemo(() => {
        const RHMDomains = allDomains.filter(d => d.projects?.includes('RHM'));
        const totalIncome = RHMDomains.reduce((acc, domain) => acc + (Number(domain.renewalCostClient) || 0), 0);
        const netProfit = RHMDomains.reduce((acc, domain) => {
            const clientCost = Number(domain.renewalCostClient) || 0;
            const officeCost = Number(domain.renewalCostOffice) || 0;
            return acc + (clientCost - officeCost);
        }, 0);
        return { totalIncome, netProfit };
    }, [allDomains]);

  const filteredDomainsForStatusPanel = React.useMemo(() => {
    return allDomains.filter(d => d.projects?.includes('RHM') || d.projects?.includes('other'));
  }, [allDomains]);

  const actionButtons = (
    <>
      <span className="h-6 w-px bg-border/60"></span>
      <Link href="https://rh-marketing.netlify.app/sys" target="_blank" rel="noopener noreferrer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="فواتير المكتب الرئيسي"
        >
          <Building2 className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="https://rh-marketing.netlify.app/oc" target="_blank" rel="noopener noreferrer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="ماليات الأونلاين"
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="https://rh-marketing.netlify.app/trns" target="_blank" rel="noopener noreferrer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="المعاملات الدولية"
        >
          <CreditCard className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="https://rhfattura.netlify.app/" target="_blank" rel="noopener noreferrer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="الفواتير"
          >
          <Receipt className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="https://rhsales.netlify.app" target="_blank" rel="noopener noreferrer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="لوحة إدارة المبيعات"
          >
          <User className="h-5 w-5" />
        </Button>
      </Link>
      <Link href="https://studio.firebase.google.com/u/1/studio-256607151" target="_blank" rel="noopener noreferrer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="بيئة التطوير"
          >
          <Code2 className="h-5 w-5" />
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
        onClick={() => setLeaderboardSheetOpen(true)}
        title="لوحة المتصدرين"
        >
        <Trophy className="h-5 w-5" />
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
    </>
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
      <LeaderboardSheet open={isLeaderboardSheetOpen} onOpenChange={setLeaderboardSheetOpen} />

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/60 md:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
           <div className={`flex items-center justify-center gap-2 transition-opacity duration-300 h-14 ${buttonsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {actionButtons}
            </div>
        </div>
      </div>

      <div className="min-h-screen bg-background text-foreground pb-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative cursor-pointer" onClick={handleSecretClick}>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Icons.logo className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  لوحة تحكم تطبيقات الويب
                </h1>
              </div>
            </div>
             <div className={`hidden md:flex items-center justify-center gap-2 transition-opacity duration-300 ${buttonsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {actionButtons}
            </div>
          </header>

          <Collapsible
            className="w-full mb-2"
            open={isTodosPanelOpen}
            onOpenChange={setTodosPanelOpen}
          >
            <StatusPanel 
              domains={filteredDomainsForStatusPanel} 
              domainStatuses={domainStatuses} 
              domainTodos={hasTodosMap} 
              apiKeyStatuses={apiKeyStatuses}
              showGeneralStatus={true}
            />
            <CollapsibleTrigger asChild>
              <div className="w-full h-4 bg-card hover:bg-muted/80 border-x border-b border-border/60 rounded-b-lg flex items-center justify-center cursor-pointer">
                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2">
                <AllTodosPanel 
                  onUpdate={refreshTodos} 
                  initialGroupedTodos={allGroupedTodos}
                  loading={loading}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>


          <main className="mt-4 space-y-6">
            <Card className="shadow-lg bg-card">
              <CardContent className="p-0">
                {isSecretVisible ? (
                  <Tabs defaultValue="rhm" className="w-full">
                    <div className="p-4 border-b border-border/60">
                      <TabsList>
                        <TabsTrigger value="rhm">مشاريع RHM</TabsTrigger>
                        <TabsTrigger value="other">المشاريع الأخرى</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="rhm" className="m-0">
                      <div className="px-6 pt-6">
                        <DomainDashboard 
                          project="RHM"
                          allDomains={allDomains}
                          allTodos={domainTodos}
                          domainStatuses={domainStatuses}
                          loading={loading}
                          onDomainChange={refreshAllStatuses} 
                          onTodoChange={refreshTodos} 
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
                      <div className="p-6">
                        <DomainDashboard 
                          project="other"
                          allDomains={allDomains}
                          allTodos={domainTodos}
                          domainStatuses={domainStatuses}
                          loading={loading}
                          onDomainChange={refreshAllStatuses} 
                          onTodoChange={refreshTodos} 
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex h-64 items-center justify-center text-muted-foreground">
                    
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
