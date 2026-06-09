/**
 * إرسال إيميل باستخدام Resend API
 */

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
  const resendFromName = Deno.env.get('RESEND_FROM_NAME') || 'تاجر أونلاين'

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is not set')
    return { success: false, error: 'Email service not configured' }
  }

  try {
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
      console.error('❌ Resend API error:', error)
      return { success: false, error }
    }

    const data = await response.json()
    console.log('✅ Email sent successfully:', data.id)
    return { success: true, id: data.id }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function isEmailServiceConfigured(): boolean {
  return !!Deno.env.get('RESEND_API_KEY')
}
