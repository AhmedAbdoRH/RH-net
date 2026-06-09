import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildSubscriptionWarningEmail } from './email-templates'
import { sendEmail } from './email'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  try {
    const { userId, storeName } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 })
    }

    console.log(`📧 Sending warning email to user ${userId}`)

    // جلب بيانات المستخدم
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      console.error('❌ Error fetching user:', userError)
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    const user = userData.user
    const userEmail = user.email

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'User has no email' }), { status: 400 })
    }

    const traderName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      userEmail.split('@')[0]

    // جلب بيانات المتجر لحساب الأيام المتبقية
    const { data: catalog } = await supabase
      .from('catalogs')
      .select('pro_activated_at')
      .eq('user_id', userId)
      .single()

    const proActivatedAt = catalog?.pro_activated_at
    let remainingDays = 0

    if (proActivatedAt) {
      const activatedDate = new Date(proActivatedAt)
      const now = new Date()
      const daysSinceActivation = Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24))

      const subscriptionDays = 30
      const gracePeriodDays = 10

      if (daysSinceActivation > subscriptionDays) {
        remainingDays = Math.max(0, gracePeriodDays - (daysSinceActivation - subscriptionDays))
      } else {
        remainingDays = Math.max(0, (subscriptionDays - daysSinceActivation) + gracePeriodDays)
      }
    }

    // بناء وإرسال الإيميل
    const emailContent = buildSubscriptionWarningEmail({
      traderName,
      storeName: storeName || 'متجرك',
      remainingDays,
    })

    const sendResult = await sendEmail({
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: Deno.env.get('RESEND_REPLY_TO') || undefined,
    })

    console.log(`✅ Warning email sent to ${userEmail}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Warning email sent successfully',
      emailResult: sendResult
    }), { status: 200 })

  } catch (error) {
    console.error('❌ Error sending warning email:', error)
    return new Response(JSON.stringify({ error: 'Failed to send warning email' }), { status: 500 })
  }
})
