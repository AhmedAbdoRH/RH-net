/**
 * قالب إيميل تنبيه تجديد الاشتراك
 */

export interface SubscriptionWarningEmailParams {
  traderName: string
  storeName?: string
  remainingDays: number
}

const DEFAULT_TRADER_NAME = 'عزيزي التاجر'
const DEFAULT_STORE_NAME = 'متجرك'

export function buildSubscriptionWarningEmail(params: SubscriptionWarningEmailParams): {
  subject: string
  html: string
  text: string
} {
  const traderName = params.traderName || DEFAULT_TRADER_NAME
  const storeName = params.storeName || DEFAULT_STORE_NAME
  const { remainingDays } = params

  const subject = `تنبيه: اشتراك Pro لمتجرك ${storeName} سينتهي قريباً — تاجر أونلاين`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تنبيه تجديد الاشتراك — تاجر أونلاين</title>
<style>
  body {
    font-family: 'Noto Sans Arabic', 'Tajawal', Arial, sans-serif;
    background: #f5f5f5;
    margin: 0;
    padding: 20px;
    direction: rtl;
    text-align: right;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .header {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #ffffff;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
  }
  .content {
    padding: 30px;
    color: #333333;
    line-height: 1.8;
    font-size: 16px;
  }
  .alert-box {
    background: #fffbeb;
    border-right: 4px solid #f59e0b;
    padding: 20px;
    border-radius: 8px;
    margin: 25px 0;
  }
  .days-badge {
    display: inline-block;
    background: #f59e0b;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
  }
  .cta {
    text-align: center;
    margin: 25px 0;
    background: #f0fdfa;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #ccfbf1;
  }
  .cta a {
    background: #043832;
    color: #ffffff;
    padding: 14px 36px;
    text-decoration: none;
    border-radius: 30px;
    font-weight: 700;
    display: inline-block;
    font-size: 16px;
    box-shadow: 0 4px 10px rgba(4, 56, 50, 0.3);
  }
  .footer {
    background: #f5f5f5;
    padding: 25px 30px;
    text-align: center;
    color: #666;
    font-size: 14px;
    border-top: 1px solid #eee;
  }
  .signature {
    margin-top: 25px;
    color: #043832;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>تنبيه: اشتراكك سينتهي قريباً — تاجر أونلاين</h1>
    </div>

    <div class="content">
      <p>مرحباً <strong>${escapeHtml(traderName)}</strong>،</p>

      <p>نود إبلاغك بأن اشتراكك في باقة <strong>Pro</strong> لمتجرك <strong>${escapeHtml(storeName)}</strong> سينتهي قريباً.</p>

      <div class="alert-box">
        <strong>⚠️ تنبيه هام:</strong><br>
        متبقي على انتهاء اشتراكك:
        <div class="days-badge">${remainingDays} يوم</div>
      </div>

      <h3 style="color:#f59e0b; margin-top:20px;">ماذا سيحدث عند انتهاء الاشتراك؟</h3>
      <ul style="margin-right: 20px;">
        <li>فقدان الوصول إلى منتجات لا محدودة</li>
        <li>فقدان رابط المتجر المخصص</li>
        <li>فقدان معرض صور المنتجات</li>
        <li>فقدان تخصيص المظهر</li>
        <li>فقدان جمع بيانات العملاء</li>
        <li>فقدان أدوات الذكاء الاصطناعي</li>
        <li>فقدان الدعم الفني المميز</li>
        <li>ظهور حقوق وشعار "أونلاين كاتالوج"</li>
      </ul>

      <div class="cta">
        <p>جدد اشتراكك الآن لتجنب فقدان المميزات</p>
        <a href="https://tagr-online.com">جدد اشتراكك الآن 🔄</a>
      </div>

      <div class="signature">
        شكراً لاستخدامك تاجر أونلاين 💚<br><br>
        — أحمد عبده<br>
        <span style="color:#666; font-weight:400;">تاجر أونلاين</span>
      </div>
    </div>

    <div class="footer">
      <p>تاجر أونلاين | منظومة تمكين التاجر المحلي</p>
      <p>
        <a href="https://tagr-online.com" style="color:#043832; text-decoration:none;">tagr-online.com</a>
      </p>
      <p style="font-size:12px; color:#999; margin-top:15px;">
        تم إرسال هذا الإيميل لأنك مشترك في تاجر أونلاين. <br>
        <a href="https://tagr-online.com/unsubscribe" style="color:#999; text-decoration:underline;">إلغاء الاشتراك</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim()

  const text = `
تنبيه: اشتراكك سينتهي قريباً — تاجر أونلاين

مرحباً ${traderName}،

نود إبلاغك بأن اشتراكك في باقة Pro لمتجرك ${storeName} سينتهي قريباً.

⚠️ تنبيه هام:
متبقي على انتهاء اشتراكك: ${remainingDays} يوم

ماذا سيحدث عند انتهاء الاشتراك؟
- فقدان الوصول إلى منتجات لا محدودة
- فقدان رابط المتجر المخصص
- فقدان معرض صور المنتجات
- فقدان تخصيص المظهر
- فقدان جمع بيانات العملاء
- فقدان أدوات الذكاء الاصطناعي
- فقدان الدعم الفني المميز
- ظهور حقوق وشعار "أونلاين كاتالوج"

جدد اشتراكك الآن لتجنب فقدان المميزات
https://tagr-online.com

شكراً لاستخدامك تاجر أونلاين 💚

— أحمد عبده
تاجر أونلاين
tagr-online.com

تم إرسال هذا الإيميل لأنك مشترك في تاجر أونلاين.
إلغاء الاشتراك: https://tagr-online.com/unsubscribe
  `.trim()

  return { subject, html, text }
}

/**
 * تنظيف النص من أي HTML خطير (حماية من XSS)
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return ''
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
