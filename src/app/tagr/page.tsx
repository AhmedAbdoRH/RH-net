"use client"

import * as React from 'react'
import { CatalogUsers } from '@/components/catalog-users'
import { SiteHeader } from '@/components/site-header'
import { TodoList } from '@/components/todo-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTodosForDomains } from '@/services/todoService'

export default function CatalogPage() {
  const [todosAhmedAbdo, setTodosAhmedAbdo] = React.useState<any[]>([])
  const [todosAhmedAbuEzz, setTodosAhmedAbuEzz] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const refreshTodos = React.useCallback(async () => {
    try {
      const todos = await getTodosForDomains(['ahmed-abdo', 'ahmed-abu-ezz'])
      setTodosAhmedAbdo(todos['ahmed-abdo'] || [])
      setTodosAhmedAbuEzz(todos['ahmed-abu-ezz'] || [])
    } catch (error) {
      console.error("Error fetching todos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refreshTodos()
  }, [refreshTodos])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* الهيدر مع معلومات المستخدمين */}
      <SiteHeader />

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4">
        {/* قائمتا المهام - في الأعلى */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* قائمة مهام أحمد أبو العزم */}
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-transparent bg-clip-text">مهام أحمد أبو العزم</CardTitle>
            </CardHeader>
            <CardContent>
              <TodoList 
                domainId="ahmed-abu-ezz"
                initialTodos={todosAhmedAbuEzz}
                onUpdate={refreshTodos}
              />
            </CardContent>
          </Card>

          {/* قائمة مهام أحمد عبده */}
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 text-transparent bg-clip-text">مهام أحمد عبده</CardTitle>
            </CardHeader>
            <CardContent>
              <TodoList 
                domainId="ahmed-abdo"
                initialTodos={todosAhmedAbdo}
                onUpdate={refreshTodos}
              />
            </CardContent>
          </Card>
        </div>

        {/* محتوى صفحة تاجر أونلاين */}
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
