import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = 'https://ikelmblsikapgbxbpebz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZWxtYmxzaWthcGdieGJwZWJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMzNDg4MiwiZXhwIjoyMDc4OTEwODgyfQ.0zTJzPRsBvYzwNQeP6ZgpwVkzvG11yz1tD6upX35zSQ'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // استخدام service role key للوصول إلى بيانات المستخدمين
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'فشل في جلب بيانات المستخدمين' },
        { status: 500 }
      )
    }

    // جلب بيانات المتاجر المرتبطة بالمستخدمين
    const { data: catalogs, error: catalogsError } = await supabaseAdmin
      .from('catalogs')
      .select('user_id, name, display_name, plan')

    if (catalogsError) {
      console.error('Error fetching catalogs:', catalogsError)
    }

    // إنشاء خرائط للمتاجر والخطط
    const catalogsMap = new Map()
    const plansMap = new Map()
    const nameMap = new Map()
    if (catalogs) {
      catalogs.forEach(catalog => {
        catalogsMap.set(catalog.user_id, catalog.display_name)
        plansMap.set(catalog.user_id, catalog.plan)
        nameMap.set(catalog.user_id, catalog.name)
      })
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'غير محدد',
      store_name: catalogsMap.get(user.id) || 'لا يوجد متجر',
      store_display_name: catalogsMap.get(user.id) || null,
      name: nameMap.get(user.id) || null,
      plan: plansMap.get(user.id) || 'free',
      created_at: user.created_at,
      user_metadata: user.user_metadata
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
