"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Users, Mail, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface User {
  id: string
  email: string
  display_name: string
  store_name: string
  store_display_name: string | null
  plan: string
  whatsapp_number: string | null
  created_at: string
  user_metadata?: any
}

interface UserProduct {
  userId: string
  productCount: number
  productActivityDays?: ProductActivityDay[]
  firstProductAt?: string | null
  latestProductAt?: string | null
  type: 'خامل' | 'مبتدئ' | 'نشط' | 'سوبر'
}

interface ProductActivityDay {
  date: string
  count: number
}

export function CatalogUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [traderData, setTraderData] = useState<UserProduct[]>([])
  const [traderStats, setTraderStats] = useState<any>(null)
  const [filterType, setFilterType] = useState<'الكل' | 'خامل' | 'مبتدئ' | 'نشط' | 'سوبر' | 'برو'>('الكل')
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId)
    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في الحذف')
      }

      await fetchUsers()
      await fetchTraderData()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('فشل في حذف المستخدم')
    } finally {
      setDeletingUserId(null)
    }
  }

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
    
    if (seconds < 60) return 'للتو'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعة`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} يوم`
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} أسبوع`
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} شهر`
    return `${Math.floor(seconds / 31536000)} سنة`
  }

  const getTraderType = (userId: string) => {
    return traderData.find(t => t.userId === userId)
  }

  const ProductActivityTimeline = ({
    accountCreatedAt,
    activityDays = []
  }: {
    accountCreatedAt: string
    activityDays?: ProductActivityDay[]
  }) => {
    const start = new Date(accountCreatedAt).getTime()
    const end = Date.now()
    const duration = Math.max(end - start, 1)
    const totalProducts = activityDays.reduce((sum, day) => sum + day.count, 0)

    const formatShortDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })

    return (
      <div className="mt-3 border-t border-border/20 pt-3" dir="rtl">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
          <span>الآن</span>
          <span>{totalProducts > 0 ? `${totalProducts} منتج على خط الزمن` : 'لا توجد إضافات منتجات'}</span>
          <span>بداية الاستخدام</span>
        </div>
        <div className="relative h-8">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-muted-foreground/50" />
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-muted-foreground/50" />
          {activityDays.map((day) => {
            const dayTime = new Date(`${day.date}T12:00:00`).getTime()
            const progress = Math.min(Math.max((dayTime - start) / duration, 0), 1)
            const dotSize = Math.min(18, 8 + day.count * 2)

            return (
              <div
                key={day.date}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[4px] border border-emerald-300 bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                style={{
                  left: `${progress * 100}%`,
                  width: dotSize,
                  height: dotSize
                }}
                title={`${formatShortDate(day.date)}: ${day.count} منتج`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const getTraderTypeColor = (type: string) => {
    switch (type) {
      case 'خامل':
        return { bg: 'bg-gray-500/20', text: 'text-gray-700', border: 'border-gray-500/30', icon: '😴', label: 'غير نشط' }
      case 'مبتدئ':
        return { bg: 'bg-blue-500/20', text: 'text-blue-700', border: 'border-blue-500/30', icon: '🌱' }
      case 'نشط':
        return { bg: 'bg-green-500/20', text: 'text-green-700', border: 'border-green-500/30', icon: '⚡' }

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
      { name: 'غير نشط', percent: percentages.خامل, color: 'bg-gray-500', count: stats.خامل },
      { name: 'مبتدئ', percent: percentages.مبتدئ, color: 'bg-blue-500', count: stats.مبتدئ },
      { name: 'نشط', percent: percentages.نشط, color: 'bg-green-500', count: stats.نشط },
      { name: 'سوبر', percent: percentages.سوبر, color: 'bg-red-500', count: stats.سوبر }
    ]

    return (
      <div className="space-y-4">
        {/* الخط الموزع بألوان موحد */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
            {colors.map((item) => (
              item.percent > 0 && (
                <div
                  key={item.name}
                  className={`${item.color} h-full transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.name}: ${item.percent}% (${item.count} تاجر)`}
                >
                  {item.percent >= 8 && (
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

  const PlanChart = () => {
    const basicCount = users.filter(u => u.plan !== 'pro').length
    const proCount = users.filter(u => u.plan === 'pro').length
    const totalCount = users.length
    
    const basicPercent = totalCount > 0 ? (basicCount / totalCount) * 100 : 0
    const proPercent = totalCount > 0 ? (proCount / totalCount) * 100 : 0

    return (
      <div className="space-y-2 border-t border-border/20 pt-3 mt-2">
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
          {basicCount > 0 && (
            <div
              className="bg-sky-500 h-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${basicPercent}%` }}
              title={`بيزيك: ${basicPercent.toFixed(1)}% (${basicCount} مشترك)`}
            >
              {basicPercent >= 8 && (
                <span className="text-xs font-bold text-white drop-shadow">{basicPercent.toFixed(0)}%</span>
              )}
            </div>
          )}
          {proCount > 0 && (
            <div
              className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${proPercent}%` }}
              title={`برو: ${proPercent.toFixed(1)}% (${proCount} مشترك)`}
            >
              {proPercent >= 8 && (
                <span className="text-xs font-bold text-white drop-shadow">{proPercent.toFixed(0)}%</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500"></div>
            <span className="text-xs font-medium">بيزيك</span>
            <span className="text-xs text-muted-foreground">({basicCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs font-medium">برو</span>
            <span className="text-xs text-muted-foreground">({proCount})</span>
          </div>
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
          <h2 className="text-2xl font-bold">مستخدمين تطبيق تاجر أونلاين</h2>
          <p className="text-muted-foreground">عرض معلومات المستخدمين المسجلين في تطبيق تاجر أونلاين</p>
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
          {/* شارت توزيع أنواع التجار والخطط */}
          {traderStats && (
            <Card className="border-2 border-primary/20">
              <CardContent className="space-y-4 pt-6">
                <ChartBar />
                <PlanChart />
              </CardContent>
            </Card>
          )}

          {/* أزرار التصفية */}
          {users.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center rtl" dir="rtl">
              <button
                onClick={() => setFilterType('خامل')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  filterType === 'خامل'
                    ? 'bg-gray-500/30 text-gray-700 border-2 border-gray-500'
                    : 'bg-gray-500/10 text-gray-700 border border-gray-500/30 hover:bg-gray-500/20'
                }`}
              >
                😴 غير نشط ({traderData.filter(t => t.type === 'خامل').length})
              </button>
              <button
                onClick={() => setFilterType('مبتدئ')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  filterType === 'مبتدئ'
                    ? 'bg-blue-500/30 text-blue-700 border-2 border-blue-500'
                    : 'bg-blue-500/10 text-blue-700 border border-blue-500/30 hover:bg-blue-500/20'
                }`}
              >
                🌱 مبتدئ ({traderData.filter(t => t.type === 'مبتدئ').length})
              </button>
              <button
                onClick={() => setFilterType('نشط')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  filterType === 'نشط'
                    ? 'bg-green-500/30 text-green-700 border-2 border-green-500'
                    : 'bg-green-500/10 text-green-700 border border-green-500/30 hover:bg-green-500/20'
                }`}
              >
                ⚡ نشط ({traderData.filter(t => t.type === 'نشط').length})
              </button>
              <button
                onClick={() => setFilterType('سوبر')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  filterType === 'سوبر'
                    ? 'bg-red-500/30 text-red-700 border-2 border-red-500'
                    : 'bg-red-500/10 text-red-700 border border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                🚀 سوبر ({traderData.filter(t => t.type === 'سوبر').length})
              </button>
              <button
                onClick={() => setFilterType('برو')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  filterType === 'برو'
                    ? 'bg-amber-500/30 text-amber-700 border-2 border-amber-500'
                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                👑 برو ({users.filter(u => u.plan === 'pro').length})
              </button>
              <button
                onClick={() => setFilterType('الكل')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  filterType === 'الكل'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                الكل ({users.length})
              </button>
            </div>
          )}

          {/* قائمة المستخدمين المضغوطة مع المعلومات */}
          {users.length > 0 && (
            <div className="space-y-3 rtl" dir="rtl">
              {users
                .filter((user) => {
                  if (filterType === 'الكل') return true
                  if (filterType === 'برو') return user.plan === 'pro'
                  const traderType = getTraderType(user.id)?.type
                  return traderType === filterType
                })
                .map((user, index) => {
                  const trader = getTraderType(user.id)
                  return (
                    <div
                      key={user.id}
                      className="group relative bg-gradient-to-r from-card to-card/70 border border-border/60 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 hover:border-primary/40 backdrop-blur-md"
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
                              <span>{trader.type === 'خامل' ? 'غير نشط' : trader.type}</span>
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

                    {/* الصف الثاني: معلومات المالك والأزرار */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 pt-2">
                      {/* اليسار: معلومات المستخدم */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">👤</span>
                          <span>{user.display_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">(مسجل منذ: {getTimeAgo(user.created_at)})</span>
                        </div>
                      </div>
                      
                      {/* اليمين: الأزرار - ايميل ثم واتس ثم اتصال ثم حذف */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${user.email}`}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 transition-colors px-2 py-1 rounded border border-orange-600/30 hover:border-orange-600/50"
                          title="إرسال بريد إلكتروني"
                        >
                          <span className="text-sm">📧</span>
                        </a>
                        {user.whatsapp_number && (
                          <a
                            href={`https://wa.me/${user.whatsapp_number.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors px-2 py-1 rounded border border-green-600/30 hover:border-green-600/50"
                            title="تواصل عبر واتساب"
                          >
                            <span className="text-sm">💬</span>
                          </a>
                        )}
                        {user.whatsapp_number && (
                          <a
                            href={`tel:${user.whatsapp_number.replace(/[^\d+]/g, '')}`}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded border border-blue-600/30 hover:border-blue-600/50"
                            title="اتصال مباشر"
                          >
                            <span className="text-sm">📞</span>
                          </a>
                        )}
                        {getTraderType(user.id)?.type === 'خامل' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                disabled={deletingUserId === user.id}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded border border-red-600/30 hover:border-red-600/50 disabled:opacity-50"
                                title="حذف المتجر"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف المتجر <span className="font-bold">{user.store_display_name || user.store_name}</span> وجميع البيانات المرتبطة به بشكل دائم.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <ProductActivityTimeline
                      accountCreatedAt={user.created_at}
                      activityDays={trader?.productActivityDays}
                    />
                  </div>
                    </div>
                  )
                })}
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
