import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildWelcomeEmail } from '@/lib/email-templates/welcome-email'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  return apiKey ? new Resend(apiKey) : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { traderName, storeName, storeUrl, toEmail } = body

    if (!toEmail) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      )
    }

    const resend = getResendClient()
    if (!resend) {
      return NextResponse.json(
        { error: 'خدمة البريد غير مهيأة على الخادم' },
        { status: 503 }
      )
    }

    const emailContent = buildWelcomeEmail({
      traderName,
      storeName,
      storeUrl
    })

    const { data, error } = await resend.emails.send({
      from: 'تاجر أونلاين <onboarding@tagr-online.com>',
      to: toEmail,
      ...emailContent
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return NextResponse.json(
        { error: 'فشل في إرسال الإيميل الترحيبي' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
