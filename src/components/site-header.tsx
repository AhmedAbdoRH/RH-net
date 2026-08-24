"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Crown, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"

interface HeaderStats {
  totalUsers: number
  proUsers: number
  lastUserDate: string
}

interface SiteHeaderProps {
  onDashboardClick?: (e?: React.MouseEvent) => void
  rhmSitesCount?: number
}

export function SiteHeader({ onDashboardClick, rhmSitesCount }: SiteHeaderProps) {
  const router = useRouter()
  const [stats, setStats] = useState<HeaderStats>({
    totalUsers: 0,
    proUsers: 0,
    lastUserDate: '-'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const handleCatalogClick = () => {
    router.push('/fattura')
  }

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onDashboardClick) {
      onDashboardClick()
    } else {
      router.push('/rh')
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'للتو'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعة`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} يوم`
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} أسبوع`
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} شهر`
    return `${Math.floor(seconds / 31536000)} سنة`
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch stats:', errorData.error || response.statusText)
        throw new Error(errorData.error || 'Failed to fetch stats')
      }

      const data = await response.json()
      if (data.users) {
        const users = data.users
        const proUsers = users.filter((u: any) => u.plan === 'pro').length
        const lastUser = users.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]

        setStats({
          totalUsers: users.length,
          proUsers,
          lastUserDate: lastUser ? getTimeAgo(lastUser.created_at) : '-'
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      // تعيين قيم افتراضية في حالة الفشل
      setStats({
        totalUsers: 0,
        proUsers: 0,
        lastUserDate: 'غير متوفر'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col md:flex-row">
      {/* شريط تاجر أونلاين */}
      <div 
        className="flex-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b md:border-b-0 md:border-l border-primary/10 py-1 px-4 backdrop-blur-sm cursor-pointer hover:bg-primary/10 transition-colors duration-200"
        onClick={handleCatalogClick}
        title="انقر لعرض تفاصيل المستخدمين الكاملة"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* عنوان التطبيق */}
            <div className="flex items-center gap-2">
              <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); handleCatalogClick() }}>
                <img
                  src="https://res.cloudinary.com/dvikey3wc/image/upload/v1787553622/logo_wbfxgv.png"
                  alt="تاجر أونلاين"
                  className="h-5 w-5 rounded-lg"
                />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">تطبيق تاجر أونلاين</h2>
              </div>
            </div>

            {/* إحصائيات المستخدمين */}
            <div className="grid grid-cols-2 md:flex md:flex-row md:items-center gap-2 md:gap-3">
              {/* إجمالي المستخدمين */}
              <div className="flex items-center gap-1.5 bg-green-500/5 px-2 py-0.5 rounded-lg border border-green-500/20">
                <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-green-600" />
                </div>
                <div className="text-[10px]">
                  <div className="font-bold text-sm text-green-600">{stats.totalUsers} <span className="text-[10px] text-muted-foreground">مستخدم</span></div>
                  <div className="text-[9px] text-muted-foreground">
                    آخر تسجيل منذ: {stats.lastUserDate}
                  </div>
                </div>
              </div>

              {/* مستخدمين البرو */}
              <div className="flex items-center gap-1.5 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <div className="w-5 h-5 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-amber-600" />
                </div>
                <div className="text-[10px]">
                  <div className="font-bold text-sm text-amber-700">{stats.proUsers}</div>
                  <div className="text-[9px] text-muted-foreground">برو</div>
                </div>
              </div>

              {/* حالة التحميل */}
              {loading && (
                <div className="col-span-2 md:col-span-auto flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                  <div className="w-2.5 h-2.5 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span>جاري التحميل...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* شريط لوحة التحكم */}
      <div
        className="flex-1 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 border-b border-blue-500/10 py-1 px-4 backdrop-blur-sm cursor-pointer hover:bg-blue-500/10 transition-colors duration-200"
        onClick={handleDashboardClick}
        title="انقر للذهاب إلى لوحة التحكم"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* عنوان لوحة التحكم */}
            <div className="flex items-center gap-2">
              <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDashboardClick() }}>
                <img
                  src="https://www.google.com/s2/favicons?domain=rhm-digital.com&sz=64"
                  alt="أيقونة موقع RHM Digital"
                  className="h-5 w-5 rounded-lg"
                />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">المواقع وتطبيقات الويب</h2>
              </div>
            </div>

            {/* إحصائيات المواقع المنفذة */}
            <div className="flex items-center gap-1.5 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-400/30 shadow-[0_0_8px_rgba(56,189,248,0.06)]">
              <div className="w-5 h-5 bg-sky-500/12 rounded-full flex items-center justify-center">
                <Globe className="w-2.5 h-2.5 text-sky-400" />
              </div>
              <div className="text-[10px]">
                <div className="font-bold text-sm text-sky-400">{rhmSitesCount || 0} <span className="text-[10px] text-sky-200/75">موقع منفذ</span></div>
                <div className="text-[9px] text-sky-200/55">مشاريع RHM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
