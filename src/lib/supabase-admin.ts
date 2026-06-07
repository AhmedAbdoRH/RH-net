import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null
let isConfigured = false

/**
 * التحقق من تهيئة متغيرات Supabase (هل هي قيم حقيقية ولا placeholder)
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) return false

  // كاش للـ check
  if (isConfigured) return true

  // كشف القيم الـ placeholder
  const placeholders = [
    'your-project',
    'your_supabase',
    'your-service-role',
    'placeholder',
    'example',
    'change-me',
    'changeme',
  ]

  const url = supabaseUrl.toLowerCase()
  const key = supabaseServiceRoleKey.toLowerCase()

  for (const ph of placeholders) {
    if (url.includes(ph) || key.includes(ph)) return false
  }

  // الـ URL المفروض يبدأ بـ https:// وينتهي بـ .supabase.co
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) return false

  // الـ Key المفروض يكون JWT طويل (يبدأ بـ eyJ)
  if (!supabaseServiceRoleKey.startsWith('eyJ') || supabaseServiceRoleKey.length < 100) return false

  isConfigured = true
  return true
}

/**
 * إنشاء عميل Supabase admin
 * @throws Error مع رسالة واضحة لو الإعدادات ناقصة
 */
export function createSupabaseAdminClient(): SupabaseClient {
  // لو مش متظبط، نرجع client وهمي مع flag، أو نرمي error مفهوم
  if (!isSupabaseConfigured()) {
    const err = new Error(
      'SUPABASE_NOT_CONFIGURED: متغيرات Supabase غير مهيأة. ضع SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY الحقيقيين في .env.local'
    )
    ;(err as any).code = 'SUPABASE_NOT_CONFIGURED'
    throw err
  }

  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return cachedClient
}

/**
 * Wrapper للـ API routes - يمسك errors الـ Supabase ويرجع response واضح
 */
export function handleSupabaseError(error: any): { status: number; body: { error: string; code?: string } } {
  if (error?.code === 'SUPABASE_NOT_CONFIGURED' || error?.message?.includes('SUPABASE_NOT_CONFIGURED')) {
    return {
      status: 503,
      body: {
        error: 'خدمة قاعدة البيانات غير مهيأة. تواصل مع الأدمن.',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
    }
  }

  if (error?.message?.includes('Missing env var')) {
    return {
      status: 503,
      body: {
        error: 'إعدادات الخادم ناقصة. تواصل مع الأدمن.',
        code: 'ENV_MISSING',
      },
    }
  }

  return {
    status: 500,
    body: { error: 'حدث خطأ في الخادم' },
  }
}
