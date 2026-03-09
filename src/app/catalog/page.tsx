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

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4">
        {/* زر العودة - محسّن للموبايل */}
        <div className="mb-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 ml-2" />
              <span className="text-sm">العودة للوحة التحكم</span>
            </Button>
          </Link>
        </div>

        {/* محتوى صفحة الأونلاين كتالوج */}
        <div className="space-y-4 sm:space-y-6">
          {/* عنوان الصفحة - محسّن للموبايل */}
          <div className="text-center mb-6 sm:mb-8">
          </div>

          {/* مكون قائمة المستخدمين - محسّن للموبايل */}
          <div className="w-full max-w-full overflow-hidden">
            <CatalogUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
