import { Resend } from 'resend'

// إنشاء عميل Resend باستخدام المفتاح من متغيرات البيئة
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const resendFromName = process.env.RESEND_FROM_NAME || 'تاجر أونلاين'

// تهيئة عميل Resend
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    if (!resendApiKey) {
      throw new Error('Missing env var: RESEND_API_KEY')
    }
    resendClient = new Resend(resendApiKey)
  }
  return resendClient
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * إرسال بريد إلكتروني عبر Resend
 * @param options خيارات الإيميل (المستلم، الموضوع، المحتوى)
 * @returns نتيجة الإرسال
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY غير موجود - لن يتم إرسال الإيميل')
      return {
        success: false,
        error: 'RESEND_API_KEY غير مُعرّف في متغيرات البيئة',
      }
    }

    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: `${resendFromName} <${resendFromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })

    if (error) {
      console.error('❌ خطأ في إرسال الإيميل عبر Resend:', error)
      return {
        success: false,
        error: error.message || 'فشل إرسال الإيميل',
      }
    }

    console.log('✅ تم إرسال الإيميل بنجاح:', data?.id)
    return {
      success: true,
      id: data?.id,
    }
  } catch (err: any) {
    console.error('❌ استثناء أثناء إرسال الإيميل:', err)
    return {
      success: false,
      error: err?.message || 'حدث خطأ غير متوقع',
    }
  }
}

/**
 * التحقق من تهيئة خدمة الإيميل
 */
export function isEmailServiceConfigured(): boolean {
  return Boolean(resendApiKey)
}
