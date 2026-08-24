"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function RhIntegratedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="container mx-auto px-3 py-3 sm:px-4 lg:px-6">
        <div className="mb-3 flex items-center justify-between gap-3 no-print">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة للمواقع وتطبيقات الويب
            </Link>
          </Button>
          <h1 className="text-lg font-bold">أنظمة RHM الداخلية</h1>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-black shadow-lg">
          <iframe
            src="/rh/index.html"
            title="أنظمة RHM الداخلية"
            className="block h-[calc(100vh-145px)] min-h-[680px] w-full border-0"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground no-print">
          <span>الصفحات تعمل من داخل المشروع الحالي.</span>
          <a
            href="/rh/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
          >
            فتح النظام في تبويب مستقل
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </main>
    </div>
  );
}
