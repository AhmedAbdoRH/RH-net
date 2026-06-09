import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildSubscriptionCancelledEmail } from './email-templates'
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

    console.log(`📧 Sending cancellation email to user ${userId}`)

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

    // بناء وإرسال الإيميل
    const emailContent = buildSubscriptionCancelledEmail({
      traderName,
      storeName: storeName || 'متجرك',
    })

    const sendResult = await sendEmail({
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: Deno.env.get('RESEND_REPLY_TO') || undefined,
    })

    console.log(`✅ Cancellation email sent to ${userEmail}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Cancellation email sent successfully',
      emailResult: sendResult
    }), { status: 200 })

  } catch (error) {
    console.error('❌ Error sending cancellation email:', error)
    return new Response(JSON.stringify({ error: 'Failed to send cancellation email' }), { status: 500 })
  }
})
