import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  try {
    console.log('🔍 Starting subscription check...')

    // جلب جميع المستخدمين الذين لديهم اشتراك Pro
    const { data: catalogs, error: catalogsError } = await supabase
      .from('catalogs')
      .select('user_id, name, display_name, pro_activated_at, warning_sent_at, cancelled_sent_at')
      .eq('plan', 'pro')
      .not('pro_activated_at', 'is', null)

    if (catalogsError) {
      console.error('❌ Error fetching catalogs:', catalogsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch catalogs' }), { status: 500 })
    }

    if (!catalogs || catalogs.length === 0) {
      console.log('✅ No Pro subscriptions to check')
      return new Response(JSON.stringify({ message: 'No Pro subscriptions to check' }), { status: 200 })
    }

    console.log(`📊 Found ${catalogs.length} Pro subscriptions to check`)

    const now = new Date()
    const subscriptionDays = 30 // فترة الاشتراك
    const gracePeriodDays = 10 // فترة السماح
    const totalDays = subscriptionDays + gracePeriodDays

    let warningSent = 0
    let subscriptionCancelled = 0
    let errors = 0

    for (const catalog of catalogs) {
      const { user_id, name, display_name, pro_activated_at, warning_sent_at, cancelled_sent_at } = catalog

      if (!pro_activated_at) continue

      const activatedDate = new Date(pro_activated_at)
      const daysSinceActivation = Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24))

      // التحقق من إرسال تنبيه عند انتهاء 30 يوم
      if (daysSinceActivation >= subscriptionDays && daysSinceActivation < totalDays) {
        // في فترة السماح - إرسال تنبيه إذا لم يتم إرساله من قبل
        if (!warning_sent_at) {
          console.log(`⚠️ Sending warning email to user ${user_id} (days since activation: ${daysSinceActivation})`)

          try {
            await sendWarningEmail(user_id, display_name || name)
            
            // تحديث warning_sent_at
            await supabase
              .from('catalogs')
              .update({ warning_sent_at: now.toISOString() })
              .eq('user_id', user_id)

            warningSent++
            console.log(`✅ Warning email sent to user ${user_id}`)
          } catch (error) {
            console.error(`❌ Error sending warning email to user ${user_id}:`, error)
            errors++
          }
        }
      }

      // التحقق من إيقاف الاشتراك عند انتهاء 40 يوم
      if (daysSinceActivation >= totalDays) {
        // انتهت فترة السماح - إيقاف الاشتراك إذا لم يتم إيقافه من قبل
        if (!cancelled_sent_at) {
          console.log(`🛑 Cancelling subscription for user ${user_id} (days since activation: ${daysSinceActivation})`)

          try {
            await sendCancellationEmail(user_id, display_name || name)
            
            // تحديث الخطة وإلغاء الاشتراك
            await supabase
              .from('catalogs')
              .update({ 
                plan: 'basic', 
                pro_activated_at: null,
                cancelled_sent_at: now.toISOString()
              })
              .eq('user_id', user_id)

            subscriptionCancelled++
            console.log(`✅ Subscription cancelled for user ${user_id}`)
          } catch (error) {
            console.error(`❌ Error cancelling subscription for user ${user_id}:`, error)
            errors++
          }
        }
      }
    }

    console.log(`📊 Summary: Warning emails sent: ${warningSent}, Subscriptions cancelled: ${subscriptionCancelled}, Errors: ${errors}`)

    return new Response(JSON.stringify({
      message: 'Subscription check completed',
      warningSent,
      subscriptionCancelled,
      errors,
      totalChecked: catalogs.length
    }), { status: 200 })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Unexpected error occurred' }), { status: 500 })
  }
})

async function sendWarningEmail(userId: string, storeName: string) {
  // جلب بيانات المستخدم
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

  if (userError || !userData?.user) {
    throw new Error('User not found')
  }

  const user = userData.user
  const userEmail = user.email

  if (!userEmail) {
    throw new Error('User has no email')
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

  return sendResult
}

async function sendCancellationEmail(userId: string, storeName: string) {
  // جلب بيانات المستخدم
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

  if (userError || !userData?.user) {
    throw new Error('User not found')
  }

  const user = userData.user
  const userEmail = user.email

  if (!userEmail) {
    throw new Error('User has no email')
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

  return sendResult
}

// Email templates and utilities (embedded for simplicity)
function buildSubscriptionWarningEmail(params: { traderName: string; storeName: string; remainingDays: number }) {
  const { traderName, storeName, remainingDays } = params
  const subject = `جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات ⚠️`
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Noto Sans Arabic', 'Tajawal', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; text-align: right; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 800; line-height: 1.4; }
  .content { padding: 30px; color: #333333; line-height: 1.8; font-size: 16px; }
  .countdown { background: linear-gradient(135deg, #043832 0%, #0E343C 100%); color: #55F9E6; text-align: center; padding: 20px; border-radius: 10px; margin: 25px 0; }
  .countdown-number { font-size: 48px; font-weight: 900; color: #55F9E6; margin: 0; line-height: 1; }
  .countdown-text { color: #ffffff; font-size: 15px; margin-top: 8px; font-weight: 600; }
  .features-summary { background: #f9f9f9; padding: 20px; border-radius: 10px; border-right: 4px solid #043832; margin: 20px 0; }
  .features-summary ul { margin: 10px 0 0 0; padding-right: 20px; color: #4b5563; }
  .features-summary li { margin-bottom: 8px; }
  .btn-group { text-align: center; margin: 30px 0; }
  .btn { display: block; max-width: 320px; margin: 12px auto; padding: 14px 24px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 16px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
  .btn-renew { background: #55F9E6; color: #043832; box-shadow: 0 4px 12px rgba(85,249,230,0.4); }
  .btn-contact { background: #043832; color: #ffffff; }
  .btn-app { background: #f0fdfa; color: #043832; border: 2px solid #55F9E6; box-sizing: border-box; }
  .footer { background: #f5f5f5; padding: 25px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
  .signature { margin-top: 25px; color: #043832; font-weight: 600; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⏰ جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات</h1></div>
    <div class="content">
      <p>أهلاً <strong>${escapeHtml(traderName)}</strong> 👋</p>
      <p>حابين نذكرك إن اشتراكك الحالي في باقة <strong>Pro</strong> لمتجرك <strong>${escapeHtml(storeName)}</strong> قد انتهى.</p>
      <div class="countdown"><p class="countdown-number">${remainingDays}</p><p class="countdown-text">أيام متبقية في فترة السماح للتجديد</p></div>
      <p>متجرك حالياً يعمل بكامل كفاءته خلال فترة السماح.</p>
      <div class="features-summary"><strong style="color: #043832;">📌 أبرز المميزات التي يتوجب الحفاظ عليها:</strong><ul><li>إضافة منتجات وتصنيفات لا نهائية لمتجرك.</li><li>أدوات الذكاء الاصطناعي المتقدمة وتخصيص المظهر بالكامل.</li><li>إخفاء حقوق المنصة ليبقى براندك هو الظاهر فقط للعملاء.</li><li>الوصول الكامل إلى بيانات عملائك.</li></ul></div>
      <div class="btn-group"><a href="https://play.google.com/store/apps/details?id=com.nextcatalog.app" class="btn btn-renew">جدد اشتراكك من خلال التطبيق �</a><a href="https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20تجديد%20اشتراك%20Pro" class="btn btn-contact">جدد اشتراكك من خلال WhatsApp �</a></div>
      <div class="signature">نتطلع لاستمرار رحلة نجاحك معنا 🤝<br><br>— أحمد عبده<br><span style="color:#666; font-weight:400;">تاجر أونلاين</span></div>
    </div>
    <div class="footer"><p>تاجر أونلاين | منظومة تمكين التاجر المحلي</p><p><a href="https://tagr-online.com" style="color:#043832; text-decoration:none;">tagr-online.com</a></p></div>
  </div>
</body>
</html>`.trim()
  const text = `جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات ⚠️\n\nأهلاً ${traderName} 👋\n\nحابين نذكرك إن اشتراكك الحالي في باقة Pro لمتجرك ${storeName} قد انتهى.\n\n⏰ ${remainingDays} أيام متبقية في فترة السماح للتجديد\n\n📌 أبرز المميزات التي يتوجب الحفاظ عليها:\n- إضافة منتجات وتصنيفات لا نهائية لمتجرك\n- أدوات الذكاء الاصطناعي المتقدمة وتخصيص المظهر بالكامل\n- إخفاء حقوق المنصة ليبقى براندك هو الظاهر فقط للعملاء\n- الوصول الكامل إلى بيانات عملائك\n\nجدد اشتراكك من خلال التطبيق:\nhttps://play.google.com/store/apps/details?id=com.nextcatalog.app\n\nجدد اشتراكك من خلال WhatsApp:\nhttps://api.whatsapp.com/send/?phone=201008116452&text=أريد%20تجديد%20اشتراك%20Pro\n\n— أحمد عبده\ntagr-online.com`.trim()
  return { subject, html, text }
}

function buildSubscriptionCancelledEmail(params: { traderName: string; storeName: string }) {
  const { traderName, storeName } = params
  const subject = `انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك 🚨`
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Noto Sans Arabic', 'Tajawal', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; direction: rtl; text-align: right; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 800; line-height: 1.4; }
  .content { padding: 30px; color: #333333; line-height: 1.8; font-size: 16px; }
  .status-stopped { background: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 10px; margin: 20px 0; color: #991b1b; }
  .features-lost { background: #f9fafb; padding: 20px; border-radius: 10px; border-right: 4px solid #6b7280; margin: 20px 0; }
  .features-lost ul { margin: 10px 0 0 0; padding-right: 20px; color: #4b5563; }
  .features-lost li { margin-bottom: 8px; }
  .btn-group { text-align: center; margin: 30px 0; }
  .btn { display: block; max-width: 320px; margin: 12px auto; padding: 14px 24px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 16px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
  .btn-renew { background: #55F9E6; color: #043832; box-shadow: 0 4px 12px rgba(85,249,230,0.4); }
  .btn-contact { background: #043832; color: #ffffff; }
  .btn-app { background: #f0fdfa; color: #043832; border: 2px solid #55F9E6; box-sizing: border-box; }
  .footer { background: #f5f5f5; padding: 25px 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
  .signature { margin-top: 25px; color: #043832; font-weight: 600; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🚨 انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك</h1></div>
    <div class="content">
      <p>أهلاً <strong>${escapeHtml(traderName)}</strong> 👋</p>
      <p>بنعلمك إن فترة السماح الـ 10 أيام انتهت بالفعل، وللأسف تم إيقاف باقة <strong>Pro</strong> على متجرك <strong>${escapeHtml(storeName)}</strong> وعاد المتجر تلقائياً إلى الباقة الأساسية المحدودة.</p>
      <div class="status-stopped"><strong style="font-size: 17px;">💚 حاجة مهمة حابين نطمنك عليها أولاً:</strong><br>بيانات متجرك، منتجاتك الحالية، وقائمة عملائك في أمان تماماً ولم يتم حذف أو تعديل أي شيء منها.</div>
      <div class="features-lost"><strong style="color: #4b5563;">⚠️ الخصائص المتوقفة مؤقتاً:</strong><ul><li><strong>حد المنتجات:</strong> عاد المتجر بحد أقصى 25 منتجاً.</li><li><strong>الهوية التجارية:</strong> عاد شعار وحقوق المنصة للظهور.</li><li><strong>الأدوات الذكية:</strong> توقفت ميزة تفريغ الخلفيات بالذكاء الاصطناعي.</li></ul></div>
      <div class="btn-group"><a href="https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20إعادة%20تفعيل%20اشتراك%20Pro" class="btn btn-renew">إعادة تفعيل باقة Pro (عبر واتساب) 🚀</a><a href="https://api.whatsapp.com/send/?phone=201008116452&text=مرحباً،%20عندي%20استفسار%20بخصوص%20متجري%20بعد%20انتهاء%20باقة%20Pro" class="btn btn-contact">تواصل معنا للدعم 💬</a><a href="https://play.google.com/store/apps/details?id=com.nextcatalog.app" class="btn btn-app">افتح التطبيق مباشرة 📱</a></div>
      <div class="signature">جاهزين ومستعدين لمساعدتك في أي وقت 🤝<br><br>— أحمد عبده<br><span style="color:#666; font-weight:400;">تاجر أونلاين</span></div>
    </div>
    <div class="footer"><p>تاجر أونلاين | منظومة تمكين التاجر المحلي</p><p><a href="https://tagr-online.com" style="color:#043832; text-decoration:none;">tagr-online.com</a></p></div>
  </div>
</body>
</html>`.trim()
  const text = `انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك 🚨\n\nأهلاً ${traderName} 👋\n\nبنعلمك إن فترة السماح الـ 10 أيام انتهت بالفعل، وللأسف تم إيقاف باقة Pro على متجرك ${storeName}.\n\n💚 بيانات متجرك في أمان تماماً.\n\nإعادة تفعيل باقة Pro: https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20إعادة%20تفعيل%20اشتراك%20Pro\n\n— أحمد عبده\ntagr-online.com`.trim()
  return { subject, html, text }
}

async function sendEmail(params: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<{ success: boolean; error?: string; id?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
  const resendFromName = Deno.env.get('RESEND_FROM_NAME') || 'تاجر أونلاين'

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${resendFromName} <${resendFromEmail}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo || undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }

  const data = await response.json()
  return { success: true, id: data.id }
}

function escapeHtml(text: string): string {
  if (typeof text !== 'string') return ''
  const map: Record<string, string> = { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
