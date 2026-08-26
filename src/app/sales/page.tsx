'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RhSalesProvider } from '@/features/rh-sales/firebase';
import { CustomerCarousel } from '@/components/rh-sales/customer-carousel';
import { KnowledgeBaseCarousel } from '@/components/rh-sales/knowledge-base-carousel';
import { ScrollingSkills } from '@/components/rh-sales/scrolling-skills';
import {
  AddCustomerDialog,
  AddKnowledgeBaseDialog,
  AddSkillDialog,
} from '@/components/rh-sales/add-record-dialogs';

type AddDialog = 'customer' | 'skill' | 'article' | null;

export default function SalesWorkspacePage() {
  const [openDialog, setOpenDialog] = useState<AddDialog>(null);

  return (
    <RhSalesProvider>
      <div className="min-h-screen space-y-6 bg-background pb-8 text-foreground">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">من ضمن أعمالنا</p>
              <h1 className="text-xl font-bold tracking-tight">مركز محترفي المبيعات</h1>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowRight className="h-4 w-4" />
              العودة للوحة التحكم
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">أهم العملاء</h2>
            <Button size="sm" onClick={() => setOpenDialog('customer')} className="gap-1.5">
              <Plus className="h-4 w-4" />
              إضافة عميل
            </Button>
          </div>
          <CustomerCarousel />
        </section>

        <section className="rounded-xl border border-border/60 bg-card/30 px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">مهارات البيع</h2>
            <Button size="sm" variant="outline" onClick={() => setOpenDialog('skill')} className="gap-1.5">
              <Plus className="h-4 w-4" />
              إضافة مهارة
            </Button>
          </div>
          <ScrollingSkills />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">أهم الردود</h2>
            <Button size="sm" variant="outline" onClick={() => setOpenDialog('article')} className="gap-1.5">
              <Plus className="h-4 w-4" />
              إضافة رد
            </Button>
          </div>
          <KnowledgeBaseCarousel />
        </section>
      </div>

      <AddCustomerDialog open={openDialog === 'customer'} onOpenChange={(open) => setOpenDialog(open ? 'customer' : null)} />
      <AddSkillDialog open={openDialog === 'skill'} onOpenChange={(open) => setOpenDialog(open ? 'skill' : null)} />
      <AddKnowledgeBaseDialog open={openDialog === 'article'} onOpenChange={(open) => setOpenDialog(open ? 'article' : null)} />
    </RhSalesProvider>
  );
}
