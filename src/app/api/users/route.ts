import { NextResponse } from 'next/server'
import { createSupabaseAdminClient, handleSupabaseError } from '@/lib/supabase-admin'
import { listAllAuthUsersResponse } from '@/lib/supabase-auth-users'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email'
import { buildUpgradeToProEmail } from '@/lib/email-templates/upgrade-to-pro'
import { buildSubscriptionCancelledEmail } from '@/lib/email-templates/subscription-cancelled'
import { buildSubscriptionWarningEmail } from '@/lib/email-templates/subscription-warning'

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
      .select('user_id, name, display_name, plan, whatsapp_number, pro_activated_at')

    if (catalogsError) {
      console.error('Error fetching catalogs:', catalogsError)
    }

    // إنشاء خرائط للمتاجر والخطط
    const nameMap = new Map()
    const displayNameMap = new Map()
    const plansMap = new Map()
    const whatsappMap = new Map()
    const proActivatedAtMap = new Map()
    if (catalogs) {
      catalogs.forEach(catalog => {
        nameMap.set(catalog.user_id, catalog.name)
        displayNameMap.set(catalog.user_id, catalog.display_name)
        plansMap.set(catalog.user_id, catalog.plan)
        whatsappMap.set(catalog.user_id, catalog.whatsapp_number)
        proActivatedAtMap.set(catalog.user_id, catalog.pro_activated_at)
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
      pro_activated_at: proActivatedAtMap.get(user.id) || null,
      created_at: user.created_at,
      user_metadata: user.user_metadata
    }))

    return NextResponse.json({ users, totalUsers: users.length })
  } catch (error: any) {
    console.error('Server error:', error)
    const { status, body } = handleSupabaseError(error)
    return NextResponse.json(body, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { userId, plan } = await request.json()

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'معرف المستخدم والخطة مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من أن الخطة الجديدة من القيم المسموح بها
    const allowedPlans = ['free', 'basic', 'pro']
    if (!allowedPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'قيمة الخطة غير صحيحة' },
        { status: 400 }
      )
    }

    // تحديث الخطة في جدول catalogs
    const updateData: any = { plan }
    if (plan === 'pro') {
      updateData.pro_activated_at = new Date().toISOString()
    }
    const { error: updateError } = await supabaseAdmin
      .from('catalogs')
      .update(updateData)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating plan:', updateError)
      return NextResponse.json(
        { error: 'فشل في تحديث الخطة' },
        { status: 500 }
      )
    }

    // ✅ إذا تمت الترقية إلى Pro، قم بإرسال إيميل ترحيبي تلقائي
    let emailResult: { sent: boolean; error?: string; id?: string } | null = null
    if (plan === 'pro') {
      try {
        // جلب بيانات المستخدم والمتجر من Supabase
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (userError || !userData?.user) {
          console.error('❌ تعذر جلب بيانات المستخدم لإرسال الإيميل:', userError)
          emailResult = { sent: false, error: 'لم يتم العثور على المستخدم' }
        } else {
          const user = userData.user
          const userEmail = user.email

          if (!userEmail) {
            console.warn('⚠️ المستخدم ليس لديه إيميل مسجل:', userId)
            emailResult = { sent: false, error: 'لا يوجد إيميل للمستخدم' }
          } else {
            // جلب اسم المتجر
            const { data: catalog } = await supabaseAdmin
              .from('catalogs')
              .select('name, display_name')
              .eq('user_id', userId)
              .single()

            const traderName =
              user.user_metadata?.display_name ||
              user.user_metadata?.full_name ||
              userEmail.split('@')[0]

            const storeName = catalog?.display_name || catalog?.name || 'متجرك'

            // بناء قالب الإيميل
            const emailContent = buildUpgradeToProEmail({
              traderName,
              storeName,
            })

            // التحقق من تهيئة خدمة الإيميل
            if (!isEmailServiceConfigured()) {
              console.warn('⚠️ خدمة الإيميل غير مهيأة (RESEND_API_KEY مفقود)')
              emailResult = {
                sent: false,
                error: 'خدمة الإيميل غير مهيأة - تم تنفيذ الترقية بدون إرسال إيميل',
              }
            } else {
              // إرسال الإيميل
              const sendResult = await sendEmail({
                to: userEmail,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
                replyTo: process.env.RESEND_REPLY_TO || undefined,
              })

              emailResult = {
                sent: sendResult.success,
                error: sendResult.error,
                id: sendResult.id,
              }

              if (sendResult.success) {
                console.log(`✅ تم إرسال إيميل ترقية Pro إلى: ${userEmail}`)
              } else {
                console.error(`❌ فشل إرسال إيميل ترقية Pro إلى: ${userEmail}`, sendResult.error)
              }
            }
          }
        }
      } catch (emailErr: any) {
        // لا نُفشل العملية كلها إذا فشل الإيميل — الترقية تمت بنجاح
        console.error('❌ استثناء أثناء محاولة إرسال إيميل الترقية:', emailErr)
        emailResult = {
          sent: false,
          error: emailErr?.message || 'استثناء غير متوقع',
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الخطة بنجاح',
      email: emailResult,
    })
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

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'معرف المستخدم والإجراء مطلوبان' },
        { status: 400 }
      )
    }

    // جلب بيانات المستخدم والمتجر
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      console.error('❌ تعذر جلب بيانات المستخدم:', userError)
      return NextResponse.json(
        { error: 'لم يتم العثور على المستخدم' },
        { status: 404 }
      )
    }

    const user = userData.user
    const userEmail = user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'المستخدم ليس لديه إيميل' },
        { status: 400 }
      )
    }

    // جلب اسم المتجر
    const { data: catalog } = await supabaseAdmin
      .from('catalogs')
      .select('name, display_name, plan, pro_activated_at')
      .eq('user_id', userId)
      .single()

    const traderName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      userEmail.split('@')[0]

    const storeName = catalog?.display_name || catalog?.name || 'متجرك'

    let emailResult: { sent: boolean; error?: string; id?: string } | null = null

    if (action === 'cancel_subscription') {
      // إيقاف الاشتراك
      const { error: updateError } = await supabaseAdmin
        .from('catalogs')
        .update({ plan: 'basic', pro_activated_at: null })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error cancelling subscription:', updateError)
        return NextResponse.json(
          { error: 'فشل في إيقاف الاشتراك' },
          { status: 500 }
        )
      }

      // إرسال إيميل إيقاف الاشتراك
      if (isEmailServiceConfigured()) {
        const emailContent = buildSubscriptionCancelledEmail({
          traderName,
          storeName,
        })

        const sendResult = await sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          replyTo: process.env.RESEND_REPLY_TO || undefined,
        })

        emailResult = {
          sent: sendResult.success,
          error: sendResult.error,
          id: sendResult.id,
        }

        if (sendResult.success) {
          console.log(`✅ تم إرسال إيميل إيقاف الاشتراك إلى: ${userEmail}`)
        } else {
          console.error(`❌ فشل إرسال إيميل إيقاف الاشتراك:`, sendResult.error)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'تم إيقاف الاشتراك بنجاح',
        email: emailResult,
      })
    } else if (action === 'send_warning') {
      // إرسال تنبيه فقط
      // حساب الأيام المتبقية
      const proActivatedAt = catalog?.pro_activated_at
      let remainingDays = 0

      if (proActivatedAt) {
        const activatedDate = new Date(proActivatedAt)
        const now = new Date()
        const daysSinceActivation = Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24))
        remainingDays = Math.max(0, 30 - daysSinceActivation)
      }

      if (isEmailServiceConfigured()) {
        const emailContent = buildSubscriptionWarningEmail({
          traderName,
          storeName,
          remainingDays,
        })

        const sendResult = await sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          replyTo: process.env.RESEND_REPLY_TO || undefined,
        })

        emailResult = {
          sent: sendResult.success,
          error: sendResult.error,
          id: sendResult.id,
        }

        if (sendResult.success) {
          console.log(`✅ تم إرسال إيميل التنبيه إلى: ${userEmail}`)
        } else {
          console.error(`❌ فشل إرسال إيميل التنبيه:`, sendResult.error)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'تم إرسال التنبيه بنجاح',
        email: emailResult,
      })
    } else {
      return NextResponse.json(
        { error: 'إجراء غير صالح' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
