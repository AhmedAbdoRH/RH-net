/**
 * قالب إيميل إيقاف الاشتراك
 */

export interface SubscriptionCancelledEmailParams {
  traderName: string
  storeName?: string
}

const DEFAULT_TRADER_NAME = 'عزيزي التاجر'
const DEFAULT_STORE_NAME = 'متجرك'

export function buildSubscriptionCancelledEmail(params: SubscriptionCancelledEmailParams): {
  subject: string
  html: string
  text: string
} {
  const traderName = params.traderName || DEFAULT_TRADER_NAME
  const storeName = params.storeName || DEFAULT_STORE_NAME

  const subject = `تم إيقاف اشتراك Pro لمتجرك ${storeName} — تاجر أونلاين`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>تم إيقاف اشتراك Pro — تاجر أونلاين</title>
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
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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
    background: #fef2f2;
    border-right: 4px solid #dc2626;
    padding: 20px;
    border-radius: 8px;
    margin: 25px 0;
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
      <h1>تم إيقاف اشتراك Pro — تاجر أونلاين</h1>
    </div>

    <div class="content">
      <p>مرحباً <strong>${escapeHtml(traderName)}</strong>،</p>

      <p>نود إبلاغك بأن اشتراكك في باقة <strong>Pro</strong> لمتجرك <strong>${escapeHtml(storeName)}</strong> تم إيقافه.</p>

      <div class="alert-box">
        <strong>⚠️ ملاحظة هامة:</strong><br>
        من هذه اللحظة، لن تتمكن من الوصول إلى مميزات باقة Pro. يمكنك تجديد اشتراكك في أي وقت لاستعادة المميزات.
      </div>

      <h3 style="color:#dc2626; margin-top:20px;">المميزات التي فقدتها:</h3>
      <ul style="margin-right: 20px;">
        <li>منتجات لا محدودة</li>
        <li>رابط متجر مخصص</li>
        <li>معرض صور للمنتج</li>
        <li>تخصيص المظهر بالكامل</li>
        <li>جمع بيانات العملاء</li>
        <li>أدوات الذكاء الاصطناعي</li>
        <li>دعم فني وأولوية مميزة</li>
        <li>إخفاء حقوق وشعار "أونلاين كاتالوج"</li>
      </ul>

      <div class="cta">
        <p>تريد استعادة المميزات؟</p>
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
تم إيقاف اشتراك Pro — تاجر أونلاين

مرحباً ${traderName}،

نود إبلاغك بأن اشتراكك في باقة Pro لمتجرك ${storeName} تم إيقافه.

⚠️ ملاحظة هامة:
من هذه اللحظة، لن تتمكن من الوصول إلى مميزات باقة Pro. يمكنك تجديد اشتراكك في أي وقت لاستعادة المميزات.

المميزات التي فقدتها:
- منتجات لا محدودة
- رابط متجر مخصص
- معرض صور للمنتج
- تخصيص المظهر بالكامل
- جمع بيانات العملاء
- أدوات الذكاء الاصطناعي
- دعم فني وأولوية مميزة
- إخفاء حقوق وشعار "أونلاين كاتالوج"

تريد استعادة المميزات؟
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
