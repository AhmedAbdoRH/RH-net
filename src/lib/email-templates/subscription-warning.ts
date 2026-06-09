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

  const subject = `جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات ⚠️`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات ⚠️</title>
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
    background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
    color: #ffffff;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.4;
  }
  .content {
    padding: 30px;
    color: #333333;
    line-height: 1.8;
    font-size: 16px;
  }
  .divider {
    border: 0;
    border-top: 1px dashed #ddd;
    margin: 25px 0;
  }
  .countdown {
    background: linear-gradient(135deg, #043832 0%, #0E343C 100%);
    color: #55F9E6;
    text-align: center;
    padding: 20px;
    border-radius: 10px;
    margin: 25px 0;
  }
  .countdown-number {
    font-size: 48px;
    font-weight: 900;
    color: #55F9E6;
    margin: 0;
    line-height: 1;
  }
  .countdown-text {
    color: #ffffff;
    font-size: 15px;
    margin-top: 8px;
    font-weight: 600;
  }
  .features-summary {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    border-right: 4px solid #043832;
    margin: 20px 0;
  }
  .features-summary ul {
    margin: 10px 0 0 0;
    padding-right: 20px;
    color: #4b5563;
  }
  .features-summary li {
    margin-bottom: 8px;
  }
  .btn-group {
    text-align: center;
    margin: 30px 0;
  }
  .btn {
    display: block;
    max-width: 320px;
    margin: 12px auto;
    padding: 14px 24px;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 700;
    font-size: 16px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    transition: all 0.3s ease;
  }
  .btn-renew {
    background: #55F9E6;
    color: #043832;
    box-shadow: 0 4px 12px rgba(85,249,230,0.4);
  }
  .btn-contact {
    background: #043832;
    color: #ffffff;
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
      <h1>⏰ جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات</h1>
    </div>

    <div class="content">
      <p>أهلاً <strong>${escapeHtml(traderName)}</strong> 👋</p>

      <p>حابين نذكرك إن اشتراكك الحالي في باقة <strong>Pro</strong> لمتجرك <strong>${escapeHtml(storeName)}</strong> قد انتهى. للحفاظ على استقرار مبيعاتك ونمو متجرك، من المهم تجديد الاشتراك الآن لضمان عدم توقف الأدوات الاحترافية التي تعتمد عليها.</p>

      <div class="countdown">
        <p class="countdown-number">${remainingDays}</p>
        <p class="countdown-text">أيام متبقية في فترة السماح للتجديد</p>
      </div>

      <p>متجرك حالياً يعمل بكامل كفاءته خلال فترة السماح، وتواصلك معنا الآن يضمن لك استمرار الاستفادة من هذه الخصائص دون انقطاع:</p>

      <div class="features-summary">
        <strong style="color: #043832;">📌 أبرز المميزات التي يتوجب الحفاظ عليها:</strong>
        <ul>
          <li>إضافة منتجات وتصنيفات لا نهائية لمتجرك.</li>
          <li>أدوات الذكاء الاصطناعي المتقدمة وتخصيص المظهر بالكامل.</li>
          <li>إخفاء حقوق المنصة ليبقى براندك هو الظاهر فقط للعملاء.</li>
          <li>الوصول الكامل إلى بيانات عملائك.</li>
        </ul>
      </div>

      <p style="text-align: center; font-weight: 600; color: #ca8a04;">⚠️ يرجى العلم أنه بعد انتهاء فترة السماح، ستعود خصائص المتجر تلقائياً إلى الباقة الأساسية المحدودة.</p>

      <hr class="divider">

      <!-- أزرار الإجراءات والتواصل -->
      <div class="btn-group">
        <a href="https://play.google.com/store/apps/details?id=com.nextcatalog.app" class="btn btn-renew">جدد اشتراكك من خلال التطبيق 📱</a>
        <a href="https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20تجديد%20اشتراك%20Pro" class="btn btn-contact">جدد اشتراكك من خلال WhatsApp 💬</a>
      </div>

      <hr class="divider">

      <div class="signature">
        نتطلع لاستمرار رحلة نجاحك معنا 🤝<br><br>
        — أحمد عبده<br>
        <span style="color:#666; font-weight:400;">تاجر أونلاين</span>
      </div>
    </div>

    <div class="footer">
      <p>تاجر أونلاين | منظومة تمكين التاجر المحلي</p>
      <p>
        <a href="https://tagr-online.com" style="color:#043832; text-decoration:none;">tagr-online.com</a>
      </p>
    </div>

  </div>
</body>
</html>`.trim()

  const text = `
جدد اشتراكك الآن في باقة Pro لتجنب فقدان المميزات ⚠️

أهلاً ${traderName} 👋

حابين نذكرك إن اشتراكك الحالي في باقة Pro لمتجرك ${storeName} قد انتهى. للحفاظ على استقرار مبيعاتك ونمو متجرك، من المهم تجديد الاشتراك الآن لضمان عدم توقف الأدوات الاحترافية التي تعتمد عليها.

⏰ ${remainingDays} أيام متبقية في فترة السماح للتجديد

متجرك حالياً يعمل بكامل كفاءته خلال فترة السماح، وتواصلك معنا الآن يضمن لك استمرار الاستفادة من هذه الخصائص دون انقطاع:

📌 أبرز المميزات التي يتوجب الحفاظ عليها:
- إضافة منتجات وتصنيفات لا نهائية لمتجرك
- أدوات الذكاء الاصطناعي المتقدمة وتخصيص المظهر بالكامل
- إخفاء حقوق المنصة ليبقى براندك هو الظاهر فقط للعملاء
- الوصول الكامل إلى بيانات عملائك

⚠️ يرجى العلم أنه بعد انتهاء فترة السماح، ستعود خصائص المتجر تلقائياً إلى الباقة الأساسية المحدودة.

جدد اشتراكك من خلال التطبيق:
https://play.google.com/store/apps/details?id=com.nextcatalog.app

جدد اشتراكك من خلال WhatsApp:
https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20تجديد%20اشتراك%20Pro

نتطلع لاستمرار رحلة نجاحك معنا 🤝

— أحمد عبده
تاجر أونلاين
tagr-online.com
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
