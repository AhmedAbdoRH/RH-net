
"use client";

import * as React from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Domain, Project, Todo } from '@/lib/types';
import { getDomainFaviconUrl } from '@/lib/domain-favicon';
import { DomainFavicon } from '@/components/domain-favicon';
import { format, parseISO, formatISO, differenceInDays, subYears, addYears } from 'date-fns';
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, Pencil, Check, FileText, CalendarPlus, ChevronDown, Copy, Archive, ArchiveRestore, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { addDomain, deleteDomain, deleteDomainWithTodos, updateDomain } from '@/services/domainService';
import { cn } from "@/lib/utils"
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const USD_TO_EGP_RATE_OFFICE = 47.5; // سعر الصرف لمصاريف المكتب
const USD_TO_EGP_RATE_CLIENT = 50; // سعر الصرف لتحصيل العميل

type DomainStatus = 'checking' | 'online' | 'offline';


const projectLabels: Record<Project, string> = {
  RHM: 'RHM',
  pova: 'Pova',
  firefly: 'Firefly',
  android: 'تطبيقات اندرويد',
  other: 'مشاريع أخرى',
};
const projectOptions: Project[] = ['RHM', 'pova', 'firefly', 'android', 'other'];

type CostCurrency = 'USD' | 'EGP';

function CostField({
  id,
  label,
  value,
  currency,
  onValueChange,
  onCurrencyChange,
}: {
  id: string;
  label: string;
  value: number | '';
  currency: CostCurrency;
  onValueChange: (value: number | '') => void;
  onCurrencyChange: (currency: CostCurrency) => void;
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4">
      <Label htmlFor={id} className="text-right whitespace-normal leading-5">{label}</Label>
      <div className="col-span-1 flex min-w-0 gap-2">
        <Input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onValueChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
          className="min-w-0 flex-1"
        />
        <Select value={currency} onValueChange={value => onCurrencyChange(value as CostCurrency)}>
          <SelectTrigger className="w-28 shrink-0" aria-label={`عملة ${label}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">دولار ($)</SelectItem>
            <SelectItem value="EGP">جنيه (ج.م)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const formatCost = (amount: number | '' | undefined, currency: CostCurrency = 'USD') =>
  currency === 'EGP'
    ? `${(Number(amount) || 0).toFixed(2)} ج.م`
    : `$${(Number(amount) || 0).toFixed(2)}`;

const formatConvertedCost = (amount: number | '' | undefined, currency: CostCurrency, rate: number) =>
  currency === 'EGP'
    ? `$${((Number(amount) || 0) / rate).toFixed(2)}`
    : `${((Number(amount) || 0) * rate).toFixed(2)} ج.م`;

const costInUsd = (amount: number | '' | undefined, currency: CostCurrency = 'USD', rate = USD_TO_EGP_RATE_CLIENT) =>
  currency === 'EGP' ? (Number(amount) || 0) / rate : Number(amount) || 0;

interface DomainDashboardProps {
  project: Project;
  allDomains: Domain[];
  domainStatuses: Record<string, DomainStatus>;
  loading: boolean;
  onDomainChange: () => void;
}

export function DomainDashboard({
  project,
  allDomains,
  domainStatuses,
  loading,
  onDomainChange
}: DomainDashboardProps) {
  const [isAddDomainOpen, setAddDomainOpen] = React.useState(false);
  const [isEditDomainOpen, setEditDomainOpen] = React.useState(false);
  const [domainToEdit, setDomainToEdit] = React.useState<Domain | null>(null);
  const [newFaviconState, setNewFaviconState] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [editFaviconState, setEditFaviconState] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isDataSheetOpen, setDataSheetOpen] = React.useState(false);
  const [dataSheetContent, setDataSheetContent] = React.useState({ title: '', content: '' });
  const [editingDataSheetDomain, setEditingDataSheetDomain] = React.useState<Domain | null>(null);
  const { toast } = useToast();
  const [initialRenewalDate, setInitialRenewalDate] = React.useState<Date | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);

  React.useEffect(() => {
    // This will only run on the client, after initial hydration
    setInitialRenewalDate(addYears(new Date(), 1));
  }, []);

  const [newDomain, setNewDomain] = React.useState<{
    domainName: string;
    faviconUrl: string;
    dataSheet: string;
    renewalDate: Date | null;
    renewalCost: number | '';
    renewalCostCurrency: 'USD' | 'EGP';
    renewalCostClient: number | '';
    renewalCostClientCurrency: 'USD' | 'EGP';
    renewalCostOffice: number | '';
    renewalCostOfficeCurrency: 'USD' | 'EGP';
    renewalCostPova: number | '';
    renewalCostPovaCurrency: 'USD' | 'EGP';
    renewalCostFirefly: number | '';
    renewalCostFireflyCurrency: 'USD' | 'EGP';
    projects: Project[];
    hasInstallments: boolean;
    installmentCount: number | '';
    isOnlineCatalog: boolean;
  }>({
    domainName: '',
    faviconUrl: '',
    dataSheet: '',
    renewalDate: null,
    renewalCost: '',
    renewalCostCurrency: 'USD',
    renewalCostClient: '',
    renewalCostClientCurrency: 'USD',
    renewalCostOffice: '',
    renewalCostOfficeCurrency: 'USD',
    renewalCostPova: '',
    renewalCostPovaCurrency: 'USD',
    renewalCostFirefly: '',
    renewalCostFireflyCurrency: 'USD',
    projects: [project],
    hasInstallments: false,
    installmentCount: '',
    isOnlineCatalog: false,
  });

  React.useEffect(() => {
    if (initialRenewalDate) {
      setNewDomain(prev => ({ ...prev, renewalDate: initialRenewalDate, projects: [project] }));
    }
  }, [initialRenewalDate, project]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.domainName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء حقل اسم النطاق.",
        variant: "destructive",
      });
      return;
    }

    if (newDomain.projects.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد مشروع واحد على الأقل.",
        variant: "destructive",
      });
      return;
    }

    if (!newDomain.renewalDate) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد تاريخ التجديد.",
        variant: "destructive",
      });
      return;
    }

    const newDomainEntry: Omit<Domain, 'id'> = {
      domainName: newDomain.domainName,
      faviconUrl: newDomain.faviconUrl || getDomainFaviconUrl(newDomain.domainName),
      dataSheet: newDomain.dataSheet,
      renewalDate: formatISO(newDomain.renewalDate),
      renewalCost: Number(newDomain.renewalCost) || 0,
      renewalCostCurrency: newDomain.renewalCostCurrency,
      renewalCostClient: Number(newDomain.renewalCostClient) || 0,
      renewalCostClientCurrency: newDomain.renewalCostClientCurrency,
      renewalCostOffice: Number(newDomain.renewalCostOffice) || 0,
      renewalCostOfficeCurrency: newDomain.renewalCostOfficeCurrency,
      renewalCostPova: Number(newDomain.renewalCostPova) || 0,
      renewalCostPovaCurrency: newDomain.renewalCostPovaCurrency,
      renewalCostFirefly: Number(newDomain.renewalCostFirefly) || 0,
      renewalCostFireflyCurrency: newDomain.renewalCostFireflyCurrency,
      status: 'active',
      isArchived: false,
      archivedAt: '',
      collectionDate: formatISO(new Date()),
      projects: newDomain.projects,
      hasInstallments: newDomain.hasInstallments,
      installmentCount: newDomain.hasInstallments ? Number(newDomain.installmentCount) || 0 : 0,
      installmentsPaid: 0,
      isOnlineCatalog: newDomain.isOnlineCatalog,
    };

    try {
      await addDomain(newDomainEntry);
      toast({
        title: "تمت إضافة النطاق",
        description: `تمت إضافة ${newDomain.domainName} بنجاح.`,
      });
      setAddDomainOpen(false);
      setNewFaviconState('idle');
      setNewDomain({
        domainName: '',
        faviconUrl: '',
        dataSheet: '',
        renewalDate: initialRenewalDate,
        renewalCost: '',
        renewalCostCurrency: 'USD',
        renewalCostClient: '',
        renewalCostClientCurrency: 'USD',
        renewalCostOffice: '',
        renewalCostOfficeCurrency: 'USD',
        renewalCostPova: '',
        renewalCostPovaCurrency: 'USD',
        renewalCostFirefly: '',
        renewalCostFireflyCurrency: 'USD',
        projects: [project],
        hasInstallments: false,
        installmentCount: '',
        isOnlineCatalog: false,
      });
      onDomainChange();
    } catch (error) {
      console.error("Error adding domain:", error);
      toast({
        title: "خطأ",
        description: `فشل في إضافة النطاق.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    const domainToDelete = allDomains.find(d => d.id === domainId);
    if (!domainToDelete) return;

    try {
      await deleteDomainWithTodos(domainId);
      toast({
        title: "تم حذف المتجر",
        description: `تم حذف ${domainToDelete.domainName} وجميع بياناته بنجاح.`,
        variant: "destructive"
      });
      onDomainChange();
    } catch (error) {
      toast({
        title: "خطأ",
        description: `فشل في حذف المتجر.`,
        variant: "destructive",
      });
    }
  };

  const handleArchiveDomain = async (domain: Domain) => {
    if (!domain.id) return;
    try {
      await updateDomain(domain.id, {
        isArchived: true,
        archivedAt: formatISO(new Date()),
        status: 'inactive',
      });
      toast({
        title: "تمت أرشفة الموقع",
        description: `تم نقل ${domain.domainName} إلى الأرشيف. لن يظهر في العداد أو تواريخ التجديد، وستبقى بياناته محفوظة.`,
      });
      onDomainChange();
    } catch (error) {
      console.error("Error archiving domain:", error);
      toast({
        title: "خطأ",
        description: "فشل في أرشفة الموقع.",
        variant: "destructive",
      });
    }
  };

  const handleUnarchiveDomain = async (domain: Domain) => {
    if (!domain.id) return;
    try {
      await updateDomain(domain.id, {
        isArchived: false,
        archivedAt: '',
        status: 'active',
      });
      toast({
        title: "تمت استعادة الموقع",
        description: `تمت إعادة ${domain.domainName} إلى القائمة النشطة.`,
      });
      onDomainChange();
    } catch (error) {
      console.error("Error unarchiving domain:", error);
      toast({
        title: "خطأ",
        description: "فشل في استعادة الموقع من الأرشيف.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainToEdit || !domainToEdit.id) return;

    if (!domainToEdit.projects || domainToEdit.projects.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد مشروع واحد على الأقل.",
        variant: "destructive",
      });
      return;
    }

    const { id, ...updatedData } = domainToEdit;

    if (typeof updatedData.renewalDate !== 'string') {
      updatedData.renewalDate = formatISO(updatedData.renewalDate as Date);
    }

    try {
      const finalData = {
        ...updatedData,
        faviconUrl: updatedData.faviconUrl || getDomainFaviconUrl(updatedData.domainName),
        renewalCost: Number(updatedData.renewalCost) || 0,
        renewalCostCurrency: updatedData.renewalCostCurrency || 'USD',
        renewalCostClient: Number(updatedData.renewalCostClient) || 0,
        renewalCostClientCurrency: updatedData.renewalCostClientCurrency || 'USD',
        renewalCostOffice: Number(updatedData.renewalCostOffice) || 0,
        renewalCostOfficeCurrency: updatedData.renewalCostOfficeCurrency || 'USD',
        renewalCostPova: Number(updatedData.renewalCostPova) || 0,
        renewalCostPovaCurrency: updatedData.renewalCostPovaCurrency || 'USD',
        renewalCostFirefly: Number(updatedData.renewalCostFirefly) || 0,
        renewalCostFireflyCurrency: updatedData.renewalCostFireflyCurrency || 'USD',
        hasInstallments: updatedData.hasInstallments,
        installmentCount: updatedData.hasInstallments ? Number(updatedData.installmentCount) || 0 : 0,
        isOnlineCatalog: updatedData.isOnlineCatalog,
      };

      await updateDomain(id, finalData);
      toast({
        title: "تم تحديث النطاق",
        description: `تم تحديث ${domainToEdit.domainName} بنجاح.`,
      });
      setEditDomainOpen(false);
      setEditFaviconState('idle');
      setDomainToEdit(null);
      onDomainChange();
    } catch (error) {
      console.error("Error updating domain:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث النطاق.",
        variant: "destructive",
      });
    }
  };

  const handleRenewDomain = async (domain: Domain) => {
    if (!domain.id) return;

    const currentRenewalDate = parseISO(domain.renewalDate);
    const nextRenewalDate = addYears(currentRenewalDate, 1);
    const nextRenewalDateISO = formatISO(nextRenewalDate);

    try {
      await updateDomain(domain.id, {
        renewalDate: nextRenewalDateISO,
        installmentsPaid: 0 // Reset installments on renewal
      });
      toast({
        title: "تم تجديد النطاق",
        description: `تم تحديث تاريخ تجديد ${domain.domainName} إلى ${format(nextRenewalDate, 'dd/MM/yyyy')}.`,
      });
      onDomainChange();
    } catch (error) {
      console.error("Error renewing domain:", error);
      toast({
        title: "خطأ",
        description: "فشل في تجديد النطاق.",
        variant: "destructive"
      });
    }
  };

  const handleCollectInstallment = async (domain: Domain, installmentIndex: number) => {
    if (!domain.id || !domain.hasInstallments) return;

    const paidCount = domain.installmentsPaid || 0;
    const totalCount = domain.installmentCount || 0;

    if (installmentIndex !== paidCount) {
      toast({ title: "خطأ", description: "يرجى تحصيل الأقساط بالترتيب.", variant: "destructive" });
      return;
    }

    const newPaidCount = paidCount + 1;
    if (newPaidCount > totalCount) return;

    try {
      await updateDomain(domain.id, { installmentsPaid: newPaidCount });
      toast({
        title: "تم تحصيل القسط",
        description: `تم تحصيل القسط رقم ${newPaidCount} لـ ${domain.domainName}.`,
      });
      onDomainChange();
    } catch (error) {
      console.error("Error collecting installment:", error);
      toast({ title: "خطأ", description: "فشل في تحصيل القسط.", variant: "destructive" });
    }
  };


  const openEditDialog = (domain: Domain) => {
    setDomainToEdit({
      ...domain,
      faviconUrl: getDomainFaviconUrl(domain.domainName),
      renewalDate: parseISO(domain.renewalDate),
      renewalCost: domain.renewalCost ?? '',
      renewalCostCurrency: domain.renewalCostCurrency || 'USD',
      renewalCostClient: domain.renewalCostClient || '',
      renewalCostClientCurrency: domain.renewalCostClientCurrency || 'USD',
      renewalCostOffice: domain.renewalCostOffice || '',
      renewalCostOfficeCurrency: domain.renewalCostOfficeCurrency || 'USD',
      renewalCostPova: domain.renewalCostPova || '',
      renewalCostPovaCurrency: domain.renewalCostPovaCurrency || 'USD',
      renewalCostFirefly: domain.renewalCostFirefly || '',
      renewalCostFireflyCurrency: domain.renewalCostFireflyCurrency || 'USD',
      projects: domain.projects || [],
      hasInstallments: domain.hasInstallments || false,
      installmentCount: domain.installmentCount || '',
      isOnlineCatalog: domain.isOnlineCatalog || false,
    });
    setEditFaviconState('idle');
    setEditDomainOpen(true);
  };

  const openDataSheetDialog = (domain: Domain) => {
    setDataSheetContent({ title: `شيت بيانات: ${domain.domainName}`, content: domain.dataSheet });
    setEditingDataSheetDomain(domain);
    setDataSheetOpen(true);
  };

  const handleDataSheetChange = (content: string) => {
    setDataSheetContent(prev => ({ ...prev, content }));
    if (editingDataSheetDomain) {
      setEditingDataSheetDomain(prev => prev ? { ...prev, dataSheet: content } : null);
    }
  };

  const handleSaveDataSheet = async () => {
    if (!editingDataSheetDomain || !editingDataSheetDomain.id) return;

    try {
      await updateDomain(editingDataSheetDomain.id, { dataSheet: editingDataSheetDomain.dataSheet });
      toast({
        title: "تم حفظ شيت البيانات",
        description: `تم تحديث شيت بيانات ${editingDataSheetDomain.domainName}.`,
      });
      setDataSheetOpen(false);
      setEditingDataSheetDomain(null);
      onDomainChange();
    } catch (error) {
      console.error("Error saving data sheet:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ شيت البيانات.",
        variant: "destructive"
      });
    }
  };

  const getGoogleCalendarLink = (domain: Domain) => {
    const renewalDate = parseISO(domain.renewalDate);
    const dateStr = format(renewalDate, 'yyyyMMdd');
    const title = encodeURIComponent(`تذكير تجديد نطاق: ${domain.domainName}`);
    const details = encodeURIComponent(
      `لا تنسَ تجديد نطاق ${domain.domainName}.\n` +
      `قيمة التجديد: ${formatCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD')} (${formatConvertedCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD', USD_TO_EGP_RATE_CLIENT)})\n` +
      (project === 'RHM' ? `تكلفة المكتب: ${formatCost(domain.renewalCostOffice, domain.renewalCostOfficeCurrency || 'USD')} (${formatConvertedCost(domain.renewalCostOffice, domain.renewalCostOfficeCurrency || 'USD', USD_TO_EGP_RATE_OFFICE)})` : '')
    );
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&sf=true&output=xml`;
  };

  const getRenewalProgress = (renewalDate: string) => {
    const renewal = parseISO(renewalDate);
    const today = new Date();

    if (differenceInDays(renewal, today) <= 0) {
      return 100;
    }

    const lastRenewal = subYears(renewal, 1);
    const totalDaysInYear = differenceInDays(renewal, lastRenewal);

    if (totalDaysInYear <= 0) {
      return 0;
    }

    const daysPassed = differenceInDays(today, lastRenewal);
    const progress = Math.max(0, Math.min(100, (daysPassed / totalDaysInYear) * 100));

    return progress;
  };

  const handleProjectToggle = (
    toggledProject: Project,
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldName: string
  ) => {
    setter((prevState: any) => {
      const currentProjects = prevState[fieldName] || [];
      const newProjects = currentProjects.includes(toggledProject)
        ? currentProjects.filter((p: Project) => p !== toggledProject)
        : [...currentProjects, toggledProject];
      return { ...prevState, [fieldName]: newProjects };
    });
  };

  const renderStatusDot = (domainId: string) => {
    const status = domainStatuses[domainId];

    if (status === 'checking') {
      return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="يتم التحقق..."></div>;
    }
    if (status === 'offline') {
      return <div className="h-2 w-2 rounded-full bg-red-500" title="غير متصل"></div>;
    }
    if (status === 'online') {
      return <div className="h-2 w-2 rounded-full bg-green-500" title="متصل"></div>;
    }
    return null;
  };

  const getUrl = (domainName: string) => {
    return domainName.startsWith('http') ? domainName : `https://${domainName}`;
  }

  const [sortedDomains, setSortedDomains] = React.useState<Domain[]>([]);
  const [archivedDomains, setArchivedDomains] = React.useState<Domain[]>([]);

  React.useEffect(() => {
    const inProject = allDomains.filter(d => d.projects?.includes(project));

    const active = inProject.filter(d => !d.isArchived);
    const archived = inProject.filter(d => d.isArchived);

    const sorted = active.sort((a, b) => {
      return differenceInDays(parseISO(a.renewalDate), new Date()) - differenceInDays(parseISO(b.renewalDate), new Date());
    });

    const sortedArchived = archived.sort((a, b) => {
      const aTime = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      const bTime = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      return bTime - aTime;
    });

    setSortedDomains(sorted);
    setArchivedDomains(sortedArchived);
  }, [allDomains, project]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderInstallments = (domain: Domain) => {
    if (!domain.hasInstallments || !domain.installmentCount) return null;

    const paid = domain.installmentsPaid || 0;
    const total = Number(domain.installmentCount);
    const installmentAmount = (costInUsd(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD') / total).toFixed(2);

    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: total }, (_, i) => {
            const isPaid = i < paid;
            const isNext = i === paid;
            return (
              <div
                key={i}
                onClick={() => !isPaid && handleCollectInstallment(domain, i)}
                className={cn(
                  "p-1 rounded-md text-xs text-center w-16 md:w-24 transition-colors",
                  isPaid
                    ? "bg-green-500/20 text-green-300"
                    : "bg-muted/50 text-muted-foreground",
                  isNext && "cursor-pointer hover:bg-muted/80"
                )}
              >
                <div>قسط {i + 1}</div>
                <div className="font-bold">${installmentAmount}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  return (
    <>
      {/* زر المواقع المؤرشفة - ثابت أعلى الصفحة */}
      <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
        <div className="text-sm font-bold text-foreground">
          المواقع النشطة ({sortedDomains.length})
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived(prev => !prev)}
          className="gap-2 text-slate-200 border-slate-500/40 bg-slate-600/20 hover:bg-slate-600/40 hover:text-white rounded-full font-bold shadow-sm"
        >
          <Archive className="h-4 w-4" />
          {showArchived ? 'إخفاء المواقع المؤرشفة' : `المواقع المؤرشفة (${archivedDomains.length})`}
        </Button>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border mt-4">
        <Table>
          {sortedDomains.map(domain => {
            const progress = getRenewalProgress(domain.renewalDate);
            const colSpan = (project === 'pova' || project === 'firefly') ? 6 : 5;
            return (
              <Collapsible asChild key={domain.id}>
                <TableBody className="border-b-2 border-zinc-600/65 bg-zinc-700/10 last:border-b-0">
                  <TableRow>
                    <TableCell colSpan={colSpan}>
                      <div className='flex flex-col'>
                        <div className='flex items-start'>
                        <div className='flex-grow'>
                          <div className="flex items-center gap-2">
                            {domain.id && renderStatusDot(domain.id)}
                            <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium text-lg flex items-center gap-2" style={{ color: '#90b8f8' }}>
                              <DomainFavicon domainName={domain.domainName} faviconUrl={domain.faviconUrl} />
                              {domain.domainName}
                              {domain.isOnlineCatalog && <Image src="https://i.ibb.co/MDBbpm5r/Online-Catalog-12.png" alt="Online Catalog" width={16} height={16} />}
                            </a>
                          </div>
                        </div>
                        <div className='flex items-center gap-4 px-4'>
                          {(project === 'pova' || project === 'firefly') ? (
                            <div className="text-center">
                              <div className="text-destructive font-semibold">{formatCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD')}</div>
                              <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD', USD_TO_EGP_RATE_CLIENT)}</div>
                              <div className="text-xs text-muted-foreground mt-1">B2B</div>
                            </div>
                          ) : project !== 'other' && (
                            <div className="text-center">
                              <div className="text-accent font-semibold">{formatCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD')}</div>
                              <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD', USD_TO_EGP_RATE_CLIENT)}</div>
                            </div>
                          )}
                          {project === 'pova' && (
                            <div className="text-center">
                              <div className="text-accent font-semibold">{formatCost(domain.renewalCostPova, domain.renewalCostPovaCurrency || 'USD')}</div>
                              <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostPova, domain.renewalCostPovaCurrency || 'USD', USD_TO_EGP_RATE_CLIENT)}</div>
                              <div className="text-xs text-muted-foreground mt-1">Pova</div>
                            </div>
                          )}
                          {project === 'firefly' && (
                            <div className="text-center">
                              <div className="text-accent font-semibold">{formatCost(domain.renewalCostFirefly, domain.renewalCostFireflyCurrency || 'USD')}</div>
                              <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostFirefly, domain.renewalCostFireflyCurrency || 'USD', USD_TO_EGP_RATE_CLIENT)}</div>
                              <div className="text-xs text-muted-foreground mt-1">Firefly</div>
                            </div>
                          )}
                          {(project === 'RHM' || project === 'other') && (
                            <div className="text-center">
                              <div className="text-destructive font-semibold">{formatCost(domain.renewalCostOffice, domain.renewalCostOfficeCurrency || 'USD')}</div>
                              <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostOffice, domain.renewalCostOfficeCurrency || 'USD', USD_TO_EGP_RATE_OFFICE)}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="تجديد"
                                className="rounded-full w-8 h-8 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 border border-green-500/20 hover:border-green-500/40"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد التجديد</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من أنك تريد تجديد النطاق
                                  <span className="font-bold"> {domain.domainName}</span>؟
                                  سيتم تحديث تاريخ التجديد للعام القادم وسيتم إعادة تعيين الأقساط.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRenewDomain(domain)}>
                                  تجديد
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <a href={getGoogleCalendarLink(domain)} target="_blank" rel="noopener noreferrer" title="إضافة للتقويم">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full w-8 h-8 bg-yellow-500/10 hover:bg-yellow-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30 border border-yellow-500/20 hover:border-yellow-500/40"
                            >
                              <CalendarPlus className="h-4 w-4 text-yellow-500" />
                            </Button>
                          </a>
                          {(project !== 'pova' && project !== 'firefly') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(domain)}
                              title="تعديل"
                              className="rounded-full w-8 h-8 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 border border-blue-500/20 hover:border-blue-500/40"
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={!domain.id}
                                title="حذف المتجر"
                                className="rounded-full w-8 h-8 bg-red-500/10 hover:bg-red-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف المتجر
                                  <span className="font-bold"> {domain.domainName}</span> وجميع المهام والبيانات المرتبطة به بشكل دائم.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDomain(domain.id!)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={!domain.id}
                                title="أرشفة الموقع"
                                className="rounded-full w-8 h-8 bg-slate-500/10 hover:bg-slate-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/30 border border-slate-500/20 hover:border-slate-500/40 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                              >
                                <Archive className="h-4 w-4 text-slate-400" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>أرشفة الموقع؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم نقل
                                  <span className="font-bold"> {domain.domainName}</span> إلى الأرشيف.
                                  سيُحذف من العداد وقائمة التجديد، وستبقى بياناته وشيت البيانات محفوظين بدون ميعاد تجديد (صاحب الموقع قرر عدم التجديد).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleArchiveDomain(domain)}>
                                  أرشفة
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDataSheetDialog(domain)}
                            title="عرض شيت البيانات"
                            className="rounded-full w-8 h-8 bg-purple-500/10 hover:bg-purple-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 border border-purple-500/20 hover:border-purple-500/40"
                          >
                            <FileText className="h-4 w-4 text-purple-500" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0 data-[state=open]:rotate-180">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <div className='mt-2 w-full'>
                        <div className="text-right">{`${format(parseISO(domain.renewalDate), 'dd/MM/yyyy')}`}</div>
                        <Progress value={progress} className={cn("h-2 mt-1 bg-[#111111] w-full", progress === 100 && "bg-amber-600")} />
                      </div>
                      {renderInstallments(domain)}
                    </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Collapsible>
            )
          })}
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
        {sortedDomains.map(domain => {
          const progress = getRenewalProgress(domain.renewalDate);
          return (
            <Card key={domain.id} className="card-base rounded-xl overflow-hidden border border-zinc-600/65 shadow-[0_0_0_1px_rgba(82,82,91,0.3)]">
              <Collapsible>
                <div className="w-full overflow-hidden">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className='flex-grow'>
                        <div className="flex items-center gap-2">
                          {domain.id && renderStatusDot(domain.id)}
                          <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium text-lg flex items-center gap-2" style={{ color: '#90b8f8' }}>
                            <DomainFavicon domainName={domain.domainName} faviconUrl={domain.faviconUrl} />
                            {domain.domainName}
                            {domain.isOnlineCatalog && <Image src="https://i.ibb.co/MDBbpm5r/Online-Catalog-12.png" alt="Online Catalog" width={16} height={16} />}
                          </a>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0 data-[state=open]:rotate-180">
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <div className='mt-2 w-full'>
                      <div className="text-right text-sm text-muted-foreground">{`${format(parseISO(domain.renewalDate), 'dd/MM/yyyy')}`}</div>
                      <Progress value={progress} className={cn("h-2 mt-1 bg-[#111111] w-full", progress === 100 && "bg-amber-600")} />
                    </div>
                    {renderInstallments(domain)}

                    <div className='flex items-center justify-between gap-4'>
                      <div className="flex items-center gap-2">
                        {(project === 'pova' || project === 'firefly') ? (
                          <>
                            <div className="text-center">
                              <div className="text-destructive font-semibold">{formatCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD')}</div>
                              <div className="text-xs text-muted-foreground mt-1">B2B</div>
                            </div>
                            {project === 'pova' && (
                              <div className="text-center">
                                <div className="text-accent font-semibold">{formatCost(domain.renewalCostPova, domain.renewalCostPovaCurrency || 'USD')}</div>
                                <div className="text-xs text-muted-foreground mt-1">Pova</div>
                              </div>
                            )}
                            {project === 'firefly' && (
                              <div className="text-center">
                                <div className="text-accent font-semibold">{formatCost(domain.renewalCostFirefly, domain.renewalCostFireflyCurrency || 'USD')}</div>
                                <div className="text-xs text-muted-foreground mt-1">Firefly</div>
                              </div>
                            )}
                          </>
                        ) : project !== 'other' && (
                          <div className="text-center">
                            <div className="text-accent font-semibold">{formatCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD')}</div>
                            <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostClient, domain.renewalCostClientCurrency || 'USD', USD_TO_EGP_RATE_CLIENT)}</div>
                          </div>
                        )}
                        {(project === 'RHM' || project === 'other') && (
                          <div className="text-center">
                            <div className="text-destructive font-semibold">{formatCost(domain.renewalCostOffice, domain.renewalCostOfficeCurrency || 'USD')}</div>
                            <div className="text-xs text-muted-foreground">{formatConvertedCost(domain.renewalCostOffice, domain.renewalCostOfficeCurrency || 'USD', USD_TO_EGP_RATE_OFFICE)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <div className="bg-muted/50 p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="تجديد"
                            className="rounded-full w-8 h-8 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 border border-green-500/20 hover:border-green-500/40"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد التجديد</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من أنك تريد تجديد النطاق
                              <span className="font-bold"> {domain.domainName}</span>؟
                              سيتم تحديث تاريخ التجديد للعام القادم وسيتم إعادة تعيين الأقساط.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRenewDomain(domain)}>
                              تجديد
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <a href={getGoogleCalendarLink(domain)} target="_blank" rel="noopener noreferrer" title="إضافة للتقويم">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full w-8 h-8 bg-yellow-500/10 hover:bg-yellow-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30 border border-yellow-500/20 hover:border-yellow-500/40"
                        >
                          <CalendarPlus className="h-4 w-4 text-yellow-500" />
                        </Button>
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      {(project !== 'pova' && project !== 'firefly') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(domain)}
                          title="تعديل"
                          className="rounded-full w-8 h-8 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 border border-blue-500/20 hover:border-blue-500/40"
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon" disabled={!domain.id}
                            title="حذف المتجر"
                            className="rounded-full w-8 h-8 bg-red-500/10 hover:bg-red-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف المتجر
                              <span className="font-bold"> {domain.domainName}</span> وجميع المهام والبيانات المرتبطة به بشكل دائم.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDomain(domain.id!)}>
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon" disabled={!domain.id}
                            title="أرشفة الموقع"
                            className="rounded-full w-8 h-8 bg-slate-500/10 hover:bg-slate-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/30 border border-slate-500/20 hover:border-slate-500/40 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                          >
                            <Archive className="h-4 w-4 text-slate-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>أرشفة الموقع؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم نقل
                              <span className="font-bold"> {domain.domainName}</span> إلى الأرشيف.
                              سيُحذف من العداد وقائمة التجديد، وستبقى بياناته محفوظة بدون ميعاد تجديد.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleArchiveDomain(domain)}>
                              أرشفة
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDataSheetDialog(domain)}
                        title="عرض شيت البيانات"
                        className="rounded-full w-8 h-8 bg-purple-500/10 hover:bg-purple-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 border border-purple-500/20 hover:border-purple-500/40"
                      >
                        <FileText className="h-4 w-4 text-purple-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Collapsible>
            </Card>
          )
        })}
      </div>

      {/* قسم الأرشيف - معلومات محفوظة بدون ميعاد تجديد */}
      {showArchived && (
        <div className="mt-6 rounded-md border border-slate-500/20 bg-slate-500/5 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Archive className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-sm">الأرشيف ({archivedDomains.length}) — مواقع قرر أصحابها عدم التجديد</h3>
          </div>
          {archivedDomains.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواقع مؤرشفة.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {archivedDomains.map(domain => (
                <div key={domain.id} className="rounded-xl border border-zinc-600/50 bg-zinc-800/30 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium flex items-center gap-2" style={{ color: '#90b8f8' }}>
                      <DomainFavicon domainName={domain.domainName} faviconUrl={domain.faviconUrl} />
                      {domain.domainName}
                      {domain.isOnlineCatalog && <Image src="https://i.ibb.co/MDBbpm5r/Online-Catalog-12.png" alt="Online Catalog" width={16} height={16} />}
                    </a>
                    <span className="text-[11px] text-slate-400">
                      {domain.archivedAt ? `مؤرشف بتاريخ ${format(new Date(domain.archivedAt), 'dd/MM/yyyy')}` : 'مؤرشف'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">بدون ميعاد تجديد — محفوظ للرجوع للبيانات فقط</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDataSheetDialog(domain)}
                      className="gap-1 text-purple-300 border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 rounded-full"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      شيت البيانات
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchiveDomain(domain)}
                      className="gap-1 text-green-300 border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 rounded-full"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                      استعادة للقائمة
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-red-300 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-full"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف نهائي
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف نهائي من الأرشيف؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف <span className="font-bold"> {domain.domainName}</span> وجميع بياناته نهائياً.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDomain(domain.id!)}>
                            حذف نهائي
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setAddDomainOpen(true)}
        className="fab-button"
        aria-label="إضافة نطاق جديد"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* Add Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setAddDomainOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة نطاق جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDomain} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domainName" className="text-right">اسم النطاق</Label>
              <Input
                id="domainName"
                value={newDomain.domainName}
                onChange={e => {
                  const domainName = e.target.value;
                  setNewDomain({ ...newDomain, domainName, faviconUrl: getDomainFaviconUrl(domainName) });
                  setNewFaviconState('idle');
                }}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">أيقونة الموقع</Label>
              <div className="col-span-3 flex items-center gap-3">
                <DomainFavicon
                  domainName={newDomain.domainName}
                  faviconUrl={newDomain.faviconUrl}
                  onLoad={() => setNewFaviconState('loaded')}
                  onUnavailable={() => setNewFaviconState('error')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!newDomain.domainName.trim() || newFaviconState === 'loading'}
                  onClick={() => {
                    const faviconUrl = getDomainFaviconUrl(newDomain.domainName, Date.now());
                    if (!faviconUrl) return;
                    setNewFaviconState('loading');
                    setNewDomain({ ...newDomain, faviconUrl });
                  }}
                >
                  <RefreshCw className={cn("ml-2 h-4 w-4", newFaviconState === 'loading' && "animate-spin")} />
                  جلب الأيقونة
                </Button>
                <span className="text-xs text-muted-foreground">
                  {newFaviconState === 'loading' ? 'جاري الجلب...' : newFaviconState === 'loaded' ? 'تم جلب الأيقونة' : newFaviconState === 'error' ? 'لم يتم العثور على أيقونة' : ''}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">المشاريع</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {projectOptions.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <Checkbox
                      id={`add-${p}`}
                      checked={newDomain.projects.includes(p)}
                      onCheckedChange={() => handleProjectToggle(p, setNewDomain, 'projects')}
                    />
                    <Label htmlFor={`add-${p}`}>{projectLabels[p]}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="renewalDate-add" className="text-right">تاريخ التجديد</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !newDomain.renewalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {newDomain.renewalDate ? format(newDomain.renewalDate, "PPP") : <span>اختر تاريخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDomain.renewalDate}
                    onSelect={(date) => setNewDomain({ ...newDomain, renewalDate: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <CostField id="renewalCostClient-add" label="التكلفة الأولى" value={newDomain.renewalCostClient} currency={newDomain.renewalCostClientCurrency} onValueChange={value => setNewDomain({ ...newDomain, renewalCostClient: value })} onCurrencyChange={currency => setNewDomain({ ...newDomain, renewalCostClientCurrency: currency })} />
            <CostField id="renewalCost-add" label="تكلفة التجديد" value={newDomain.renewalCost} currency={newDomain.renewalCostCurrency} onValueChange={value => setNewDomain({ ...newDomain, renewalCost: value })} onCurrencyChange={currency => setNewDomain({ ...newDomain, renewalCostCurrency: currency })} />
            {newDomain.projects.includes('pova') && (
              <CostField id="renewalCostPova-add" label="تكلفة Pova" value={newDomain.renewalCostPova} currency={newDomain.renewalCostPovaCurrency} onValueChange={value => setNewDomain({ ...newDomain, renewalCostPova: value })} onCurrencyChange={currency => setNewDomain({ ...newDomain, renewalCostPovaCurrency: currency })} />
            )}
            {newDomain.projects.includes('firefly') && (
              <CostField id="renewalCostFirefly-add" label="تكلفة Firefly" value={newDomain.renewalCostFirefly} currency={newDomain.renewalCostFireflyCurrency} onValueChange={value => setNewDomain({ ...newDomain, renewalCostFirefly: value })} onCurrencyChange={currency => setNewDomain({ ...newDomain, renewalCostFireflyCurrency: currency })} />
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hasInstallments-add" className="text-right">تحصيل بالأقساط</Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                  id="hasInstallments-add"
                  checked={newDomain.hasInstallments}
                  onCheckedChange={checked => setNewDomain({ ...newDomain, hasInstallments: !!checked })}
                />
              </div>
            </div>

            {newDomain.hasInstallments && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installmentCount-add" className="text-right">عدد الأقساط</Label>
                <Input
                  id="installmentCount-add"
                  type="number"
                  value={newDomain.installmentCount}
                  onChange={e => setNewDomain({ ...newDomain, installmentCount: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                  className="col-span-3"
                  min="1"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isOnlineCatalog-add" className="text-right">اونلاين كتلوج</Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                  id="isOnlineCatalog-add"
                  checked={newDomain.isOnlineCatalog}
                  onCheckedChange={checked => setNewDomain({ ...newDomain, isOnlineCatalog: !!checked })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataSheet-add" className="text-right">شيت البيانات</Label>
              <Textarea
                id="dataSheet-add"
                value={newDomain.dataSheet}
                onChange={e => setNewDomain({ ...newDomain, dataSheet: e.target.value })}
                className="col-span-3"
                rows={6}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Dialog */}
      {
        domainToEdit && (
          <Dialog open={isEditDomainOpen} onOpenChange={setEditDomainOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعديل النطاق: {domainToEdit.domainName}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateDomain} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="domainName-edit" className="text-right">اسم النطاق</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="domainName-edit"
                      value={domainToEdit.domainName}
                      onChange={e => {
                        const domainName = e.target.value;
                        setDomainToEdit({ ...domainToEdit, domainName, faviconUrl: getDomainFaviconUrl(domainName) });
                        setEditFaviconState('idle');
                      }}
                      className="min-w-0 flex-1"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">أيقونة الموقع</Label>
                  <div className="col-span-3 flex flex-wrap items-center gap-3">
                    <DomainFavicon
                      domainName={domainToEdit.domainName}
                      faviconUrl={domainToEdit.faviconUrl}
                      onLoad={() => setEditFaviconState('loaded')}
                      onUnavailable={() => setEditFaviconState('error')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!domainToEdit.domainName.trim() || editFaviconState === 'loading'}
                      onClick={() => {
                        const faviconUrl = getDomainFaviconUrl(domainToEdit.domainName, Date.now());
                        if (!faviconUrl) return;
                        setEditFaviconState('loading');
                        setDomainToEdit({ ...domainToEdit, faviconUrl });
                      }}
                    >
                      <RefreshCw className={cn("ml-2 h-4 w-4", editFaviconState === 'loading' && "animate-spin")} />
                      جلب الأيقونة
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {editFaviconState === 'loading' ? 'جاري الجلب...' : editFaviconState === 'loaded' ? 'تم جلب الأيقونة' : editFaviconState === 'error' ? 'لم يتم العثور على أيقونة' : ''}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">المشاريع</Label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {projectOptions.map(p => (
                      <div key={p} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-${p}`}
                          checked={domainToEdit.projects?.includes(p)}
                          onCheckedChange={() => handleProjectToggle(p, setDomainToEdit, 'projects')}
                        />
                        <Label htmlFor={`edit-${p}`}>{projectLabels[p]}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="renewalDate-edit" className="text-right">تاريخ التجديد</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !domainToEdit.renewalDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {domainToEdit.renewalDate ? format(domainToEdit.renewalDate as Date, "PPP") : <span>اختر تاريخ</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={domainToEdit.renewalDate as Date}
                        onSelect={(date) => setDomainToEdit({ ...domainToEdit, renewalDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CostField id="renewalCostClient-edit" label="التكلفة الأولى" value={domainToEdit.renewalCostClient} currency={domainToEdit.renewalCostClientCurrency || 'USD'} onValueChange={value => setDomainToEdit({ ...domainToEdit, renewalCostClient: value })} onCurrencyChange={currency => setDomainToEdit({ ...domainToEdit, renewalCostClientCurrency: currency })} />
                <CostField id="renewalCost-edit" label="تكلفة التجديد" value={domainToEdit.renewalCost ?? ''} currency={domainToEdit.renewalCostCurrency || 'USD'} onValueChange={value => setDomainToEdit({ ...domainToEdit, renewalCost: value })} onCurrencyChange={currency => setDomainToEdit({ ...domainToEdit, renewalCostCurrency: currency })} />
                {(domainToEdit.projects || []).includes('pova') && (
                  <CostField id="renewalCostPova-edit" label="تكلفة Pova" value={domainToEdit.renewalCostPova || ''} currency={domainToEdit.renewalCostPovaCurrency || 'USD'} onValueChange={value => setDomainToEdit({ ...domainToEdit, renewalCostPova: value })} onCurrencyChange={currency => setDomainToEdit({ ...domainToEdit, renewalCostPovaCurrency: currency })} />
                )}
                {(domainToEdit.projects || []).includes('firefly') && (
                  <CostField id="renewalCostFirefly-edit" label="تكلفة Firefly" value={domainToEdit.renewalCostFirefly || ''} currency={domainToEdit.renewalCostFireflyCurrency || 'USD'} onValueChange={value => setDomainToEdit({ ...domainToEdit, renewalCostFirefly: value })} onCurrencyChange={currency => setDomainToEdit({ ...domainToEdit, renewalCostFireflyCurrency: currency })} />
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hasInstallments-edit" className="text-right">تحصيل بالأقساط</Label>
                  <div className="col-span-3 flex items-center">
                    <Checkbox
                      id="hasInstallments-edit"
                      checked={domainToEdit.hasInstallments}
                      onCheckedChange={checked => setDomainToEdit({ ...domainToEdit, hasInstallments: !!checked })}
                    />
                  </div>
                </div>

                {domainToEdit.hasInstallments && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="installmentCount-edit" className="text-right">عدد الأقساط</Label>
                    <Input
                      id="installmentCount-edit"
                      type="number"
                      value={domainToEdit.installmentCount || ''}
                      onChange={e => setDomainToEdit({ ...domainToEdit, installmentCount: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                      className="col-span-3"
                      min="1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isOnlineCatalog-edit" className="text-right">اونلاين كتلوج</Label>
                  <div className="col-span-3 flex items-center">
                    <Checkbox
                      id="isOnlineCatalog-edit"
                      checked={domainToEdit.isOnlineCatalog}
                      onCheckedChange={checked => setDomainToEdit({ ...domainToEdit, isOnlineCatalog: !!checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">إلغاء</Button></DialogClose>
                  <Button type="submit">حفظ التغييرات</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Data Sheet Dialog */}
      <Dialog open={isDataSheetOpen} onOpenChange={setDataSheetOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-2xl lg:max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-row justify-between items-center">
            <DialogTitle>{dataSheetContent.title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveDataSheet}>حفظ</Button>
              <DialogClose asChild><Button variant="ghost">إغلاق</Button></DialogClose>
            </div>
          </DialogHeader>
          <div className="flex-grow flex flex-col py-4">
            <Textarea
              value={dataSheetContent.content}
              onChange={e => handleDataSheetChange(e.target.value)}
              className="w-full flex-grow font-mono text-sm"
              rows={25}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
