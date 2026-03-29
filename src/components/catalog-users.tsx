"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Users, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  display_name: string
  store_name: string
  store_display_name: string | null
  plan: string
  created_at: string
  user_metadata?: any
}

interface UserProduct {
  userId: string
  productCount: number
  type: 'خامل' | 'مبتدئ' | 'نشط' | 'قوي' | 'سوبر'
}

export function CatalogUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [traderData, setTraderData] = useState<UserProduct[]>([])
  const [traderStats, setTraderStats] = useState<any>(null)

  useEffect(() => {
    fetchUsers()
    fetchTraderData()
  }, [])

  const fetchTraderData = async () => {
    try {
      const response = await fetch('/api/traders')
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات التجار')
      }
      
      const data = await response.json()
      
      if (data.error) {
        console.error('API Error:', data.error)
        setError(data.error)
        return
      }

      setTraderData(data.traders || [])
      setTraderStats({
        stats: data.stats,
        percentages: data.percentages
      })
      
      console.log('Trader data loaded:', {
        traders: data.traders?.length,
        stats: data.stats,
        percentages: data.percentages
      })
    } catch (err) {
      console.error('Error fetching trader data:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // استخدام API endpoint لجلب بيانات المستخدمين
      const response = await fetch('/api/users')

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المستخدمين')
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setUsers(data.users || [])
    } catch (err) {
      console.error('Error:', err)
      setError('حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const getStoreUrl = (storeName: string) => {
    // بناء الرابط من: رابط الموقع + name (store_name)
    const slug = storeName.toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // إزالة الأحرف الخاصة مع الحفاظ على العربية
      .replace(/\s+/g, '-') // استبدال المسافات بشرطات
      .replace(/-+/g, '-') // إزالة الشرطات المكررة
      .trim()
    return `https://online-catalog.net/${slug}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'منذ للتو'
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`
    if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`
    if (seconds < 2592000) return `منذ ${Math.floor(seconds / 604800)} أسبوع`
    if (seconds < 31536000) return `منذ ${Math.floor(seconds / 2592000)} شهر`
    return `منذ ${Math.floor(seconds / 31536000)} سنة`
  }

  const getTraderType = (userId: string) => {
    return traderData.find(t => t.userId === userId)
  }

  const getTraderTypeColor = (type: string) => {
    switch (type) {
      case 'خامل':
        return { bg: 'bg-gray-500/20', text: 'text-gray-700', border: 'border-gray-500/30', icon: '😴' }
      case 'مبتدئ':
        return { bg: 'bg-blue-500/20', text: 'text-blue-700', border: 'border-blue-500/30', icon: '🌱' }
      case 'نشط':
        return { bg: 'bg-green-500/20', text: 'text-green-700', border: 'border-green-500/30', icon: '⚡' }
      case 'قوي':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-700', border: 'border-yellow-500/30', icon: '💪' }
      case 'سوبر':
        return { bg: 'bg-red-500/20', text: 'text-red-700', border: 'border-red-500/30', icon: '🚀' }
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-700', border: 'border-gray-500/30', icon: '❓' }
    }
  }

  const ChartBar = () => {
    if (!traderStats) return null

    const { percentages, stats } = traderStats
    const colors = [
      { name: 'خامل', percent: percentages.خامل, color: 'bg-gray-500', count: stats.خامل },
      { name: 'مبتدئ', percent: percentages.مبتدئ, color: 'bg-blue-500', count: stats.مبتدئ },
      { name: 'نشط', percent: percentages.نشط, color: 'bg-green-500', count: stats.نشط },
      { name: 'قوي', percent: percentages.قوي, color: 'bg-yellow-500', count: stats.قوي },
      { name: 'سوبر', percent: percentages.سوبر, color: 'bg-red-500', count: stats.سوبر }
    ]

    return (
      <div className="space-y-4">
        {/* الخط الموزع بألوان موحد */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">توزيع التجار</span>
            <span className="text-xs text-muted-foreground">29 تاجر</span>
          </div>
          <div className="w-full h-8 bg-muted rounded-full overflow-hidden flex">
            {colors.map((item) => (
              item.percent > 0 && (
                <div
                  key={item.name}
                  className={`${item.color} h-full transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.name}: ${item.percent}% (${item.count} تاجر)`}
                >
                  {item.percent >= 10 && (
                    <span className="text-xs font-bold text-white drop-shadow">{item.percent}%</span>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        {/* وسيط توضيحي تحت الخط */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {colors.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-xs font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* عنوان القسم */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">مستخدمين تطبيق أونلاين كتالوج</h2>
          <p className="text-muted-foreground">عرض معلومات المستخدمين المسجلين في تطبيق الأونلاين كتالوج</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المستخدمين...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* شارت توزيع أنواع التجار */}
          {traderStats && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-bold">توزيع أنواع التجار</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">النسبة المئوية لكل فئة</p>
              </CardHeader>
              <CardContent>
                <ChartBar />
              </CardContent>
            </Card>
          )}

          {/* قائمة المستخدمين المضغوطة مع المعلومات */}
          {users.length > 0 && (
            <div className="space-y-3 rtl" dir="rtl">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="group relative bg-gradient-to-r from-card to-card/50 border border-border/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 backdrop-blur-sm"
                >
                  {/* محتوى البطاقة */}
                  <div className="relative z-10">
                    {/* الصف الأول: اسم المتجر والمعلومات الأساسية */}
                    <div className="flex items-center justify-between mb-3">
                      {/* اسم المتجر الرئيسي */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg">🏪</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {user.store_name !== 'لا يوجد متجر' ? (
                            <a
                              href={getStoreUrl(user.store_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group/link"
                            >
                              <h3 className="text-lg font-bold text-foreground group-hover/link:text-primary transition-colors duration-200 truncate">
                                {user.store_display_name || user.store_name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                <span>زيارة المتجر</span>
                                <span className="text-sm group-hover/link:translate-x-1 transition-transform duration-200">→</span>
                              </div>
                            </a>
                          ) : (
                            <div>
                              <h3 className="text-lg font-bold text-muted-foreground truncate">
                                {user.store_display_name || user.store_name}
                              </h3>
                              <div className="text-xs text-muted-foreground">
                                متجر غير متوفر
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* معلومات إضافية */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {/* نوع التاجر */}
                        {getTraderType(user.id) && (() => {
                          const trader = getTraderType(user.id)!
                          const typeColor = getTraderTypeColor(trader.type)
                          return (
                            <div className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 whitespace-nowrap",
                              typeColor.bg,
                              typeColor.text,
                              typeColor.border
                            )}>
                              <span>{typeColor.icon}</span>
                              <span>{trader.type}</span>
                              <span className="text-xs">({trader.productCount})</span>
                            </div>
                          )
                        })()}
                        
                        {/* نوع الخطة */}
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold border",
                          user.plan === 'pro' 
                            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 border-amber-500/30" 
                            : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 border-blue-500/30"
                        )}>
                          {user.plan === 'pro' ? '👑' : '💎'}
                        </div>
                      </div>
                    </div>

                    {/* الصف الثاني: معلومات المالك المضغوطة */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 pt-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">👤</span>
                          <span>{user.display_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">📧</span>
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">📅</span>
                        <span>{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {users.length === 0 && !loading && !error && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا يوجد مستخدمون</h3>
                <p className="text-muted-foreground">لا يوجد مستخدمون مسجلون حالياً في تطبيق الكتالوج</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
