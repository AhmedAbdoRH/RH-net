import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { listAllAuthUsersResponse } from '@/lib/supabase-auth-users'

export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    // استخدام service role key للوصول إلى بيانات المستخدمين
    const { data, error } = await listAllAuthUsersResponse(supabaseAdmin)

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
      .select('user_id, name, display_name, plan, whatsapp_number')

    if (catalogsError) {
      console.error('Error fetching catalogs:', catalogsError)
    }

    // إنشاء خرائط للمتاجر والخطط
    const nameMap = new Map()
    const displayNameMap = new Map()
    const plansMap = new Map()
    const whatsappMap = new Map()
    if (catalogs) {
      catalogs.forEach(catalog => {
        nameMap.set(catalog.user_id, catalog.name)
        displayNameMap.set(catalog.user_id, catalog.display_name)
        plansMap.set(catalog.user_id, catalog.plan)
        whatsappMap.set(catalog.user_id, catalog.whatsapp_number)
      })
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'غير محدد',
      store_name: nameMap.get(user.id) || 'لا يوجد متجر',
      store_display_name: displayNameMap.get(user.id) || null,
      name: nameMap.get(user.id) || null,
      plan: plansMap.get(user.id) || 'free',
      whatsapp_number: whatsappMap.get(user.id) || null,
      created_at: user.created_at,
      user_metadata: user.user_metadata
    }))

    return NextResponse.json({ users, totalUsers: users.length })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // حذف المتجر المرتبط بالمستخدم من جدول catalogs
    const { error: catalogDeleteError } = await supabaseAdmin
      .from('catalogs')
      .delete()
      .eq('user_id', userId)

    if (catalogDeleteError) {
      console.error('Error deleting catalog:', catalogDeleteError)
      return NextResponse.json(
        { error: 'فشل في حذف المتجر' },
        { status: 500 }
      )
    }

    // حذف المستخدم من Supabase Auth
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (userDeleteError) {
      console.error('Error deleting user:', userDeleteError)
      return NextResponse.json(
        { error: 'فشل في حذف المستخدم' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم والمتجر بنجاح' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
