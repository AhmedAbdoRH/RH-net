"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Users, UserCheck, Calendar, Mail, X } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  created_at: string
  user_metadata?: any
}

export function UsersSheet({ inTab = false }: { inTab?: boolean }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false) // Start closed

  useEffect(() => {
    if (open || inTab) {
      fetchUsers()
    }
  }, [open, inTab])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      {!inTab && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              title="تطبيق أونلاين كتالوج - المستخدمون"
            >
              <Users className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[600px] sm:w-[700px] sm:max-w-none overflow-y-auto" dir="rtl">
            {renderContent()}
          </SheetContent>
        </Sheet>
      )}
      {inTab && (
        <div className="w-full">
          {renderContent()}
        </div>
      )}
    </>
  )

  function renderContent() {
    return (
      <>
        {!inTab && (
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              تطبيق أونلاين كتالوج - المستخدمون المسجلون
            </SheetTitle>
            <SheetDescription>
              عرض معلومات المستخدمين المسجلين في التطبيق
            </SheetDescription>
          </SheetHeader>
        )}
        
        <div className={inTab ? "mt-0" : "mt-6"}>
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل بيانات المستخدمين...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <CardTitle className="text-sm font-medium">آخر مستخدم</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {users.length > 0 ? formatDate(users[0].created_at) : 'لا يوجد مستخدمون'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{users.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* جدول المستخدمين */}
              {users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{inTab ? "مستخدمو تطبيق الكتالوج" : "قائمة المستخدمين"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right py-3 px-2 font-medium">البريد الإلكتروني</th>
                            <th className="text-right py-3 px-2 font-medium">تاريخ التسجيل</th>
                            <th className="text-right py-3 px-2 font-medium">معرف المستخدم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user, index) => (
                            <tr key={user.id} className={cn("border-b hover:bg-muted/50 transition-colors", index % 2 === 0 ? "bg-muted/20" : "")}>
                              <td className="py-3 px-2 font-medium">{user.email}</td>
                              <td className="py-3 px-2 text-muted-foreground">{formatDate(user.created_at)}</td>
                              <td className="py-3 px-2 text-muted-foreground text-xs font-mono">
                                {user.id.substring(0, 8)}...
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {users.length > 10 && (
                      <div className="mt-4 text-center text-sm text-muted-foreground">
                        عرض أول 10 مستخدمين من إجمالي {users.length} مستخدم
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {users.length === 0 && !loading && !error && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا يوجد مستخدمون مسجلون حالياً</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </>
    )
  }
}
