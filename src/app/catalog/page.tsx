"use client"

import { CatalogUsers } from '@/components/catalog-users'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* الهيدر مع معلومات المستخدمين */}
      <SiteHeader />

      {/* زر العودة */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للوحة التحكم
          </Button>
        </Link>

        {/* محتوى صفحة الأونلاين كتالوج */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
               تطبيق أونلاين كتالوج
            </h1>
            <p className="text-muted-foreground text-lg">
            </p>
          </div>

          {/* مكون قائمة المستخدمين */}
          <div className="max-w-6xl mx-auto">
            <CatalogUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
