"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Users, UserCheck, Calendar, Mail } from "lucide-react"
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

export function CatalogUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

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

  const getStoreUrl = (storeName: string, displayName: string) => {
    // استخدم اسم المتجر من جدول catalogs
    const finalName = storeName

    // تحويل اسم المتجر إلى slug للرابط
    const slug = finalName.toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // إزالة الأحرف الخاصة مع الحفاظ على العربية
      .replace(/\s+/g, '-') // استبدال المسافات بشرطات
      .replace(/-+/g, '-') // إزالة الشرطات المكررة
      .trim()
    return `https://online-catalog.net/${slug}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المستخدمون برو</CardTitle>
                <span className="text-lg">👑</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{users.filter(u => u.plan === 'pro').length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">آخر مستخدم</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {users.length > 0 ? formatDate(users[0].created_at) : 'لا يوجد مستخدمون'}
                </p>
              </CardContent>
            </Card>
          </div>

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
                              href={getStoreUrl(user.store_name, user.display_name)}
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
