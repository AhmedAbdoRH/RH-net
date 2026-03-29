"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Crown } from "lucide-react"
import { Card } from "@/components/ui/card"

interface HeaderStats {
  totalUsers: number
  proUsers: number
  lastUserDate: string
}

export function SiteHeader() {
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
    router.push('/catalog')
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
      if (!response.ok) throw new Error('Failed to fetch stats')

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="w-full bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10 py-2 px-4 backdrop-blur-sm cursor-pointer hover:bg-primary/10 transition-colors duration-200"
      onClick={handleCatalogClick}
      title="انقر لعرض تفاصيل المستخدمين الكاملة"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-6">
          {/* عنوان التطبيق */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm">🏪</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">تطبيق أونلاين كتالوج</h2>
            </div>
          </div>

          {/* المعلومات الأساسية - على اليمين */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* إجمالي المستخدمين */}
            <div className="flex items-center gap-2 bg-green-500/5 px-3 py-1 rounded-lg border border-green-500/20">
              <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 text-green-600" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-lg text-green-600">{stats.totalUsers} <span className="text-sm text-muted-foreground">مستخدم</span></div>
                <div className="text-[10px] text-muted-foreground">
                  آخر تسجيل منذ: {stats.lastUserDate}
                </div>
              </div>
            </div>

            {/* مستخدمين البرو */}
            <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/20">
              <div className="w-6 h-6 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-amber-600" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-lg text-amber-700">{stats.proUsers}</div>
                <div className="text-[10px] text-muted-foreground">برو</div>
              </div>
            </div>

            {/* حالة التحميل */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span>جاري التحميل...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
