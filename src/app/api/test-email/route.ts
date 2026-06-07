import { NextResponse } from 'next/server'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email'
import { buildUpgradeToProEmail } from '@/lib/email-templates/upgrade-to-pro'

/**
 * API للاختبار - لإرسال إيميل ترقية تجريبي
 * POST /api/test-email
 * Body: { "to": "email@example.com", "traderName": "اسم", "storeName": "متجر" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const to = body.to || process.env.RESEND_TEST_EMAIL
    const traderName = body.traderName || 'تاجر تجريبي'
    const storeName = body.storeName || 'متجر التجربة'

    if (!to) {
      return NextResponse.json(
        { error: 'الإيميل المستقبل مطلوب. أرسل { to: "email@example.com" }' },
        { status: 400 }
      )
    }

    if (!isEmailServiceConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'RESEND_API_KEY غير موجود في .env.local',
        },
        { status: 500 }
      )
    }

    const emailContent = buildUpgradeToProEmail({ traderName, storeName })

    const result = await sendEmail({
      to,
      subject: '[تجربة] ' + emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `✅ تم إرسال الإيميل التجريبي إلى ${to}. افحص صندوق الوارد (أو السبام)!`
        : 'فشل الإرسال',
      id: result.id,
      error: result.error,
      config: {
        from: process.env.RESEND_FROM_EMAIL,
        apiKeyConfigured: isEmailServiceConfigured(),
      },
    })
  } catch (err: any) {
    console.error('Test email error:', err)
    return NextResponse.json(
      { error: err?.message || 'حدث خطأ' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'استخدم POST لإرسال إيميل تجريبي. مثال:',
    example: {
      url: '/api/test-email',
      method: 'POST',
      body: {
        to: 'RehlatHadaf@gmail.com',
        traderName: 'أحمد',
        storeName: 'متجر تاجر أونلاين',
      },
    },
    config: {
      apiKeyConfigured: isEmailServiceConfigured(),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'غير مضبوط',
      fromName: process.env.RESEND_FROM_NAME || 'غير مضبوط',
    },
  })
}
