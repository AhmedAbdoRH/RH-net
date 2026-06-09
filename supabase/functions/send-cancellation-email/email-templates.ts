/**
 * قالب إيميل إيقاف الاشتراك (انتهاء فترة السماح)
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

  const subject = `انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك 🚨`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك 🚨</title>
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
    background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
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
  .status-stopped {
    background: #fef2f2;
    border: 2px solid #fca5a5;
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
    color: #991b1b;
  }
  .features-lost {
    background: #f9fafb;
    padding: 20px;
    border-radius: 10px;
    border-right: 4px solid #6b7280;
    margin: 20px 0;
  }
  .features-lost ul {
    margin: 10px 0 0 0;
    padding-right: 20px;
    color: #4b5563;
  }
  .features-lost li {
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
  .btn-app {
    background: #f0fdfa;
    color: #043832;
    border: 2px solid #55F9E6;
    box-sizing: border-box;
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
      <h1>🚨 انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك</h1>
    </div>

    <div class="content">
      <p>أهلاً <strong>${escapeHtml(traderName)}</strong> 👋</p>

      <p>بنعلمك إن فترة السماح الـ 10 أيام انتهت بالفعل، وللأسف تم إيقاف باقة <strong>Pro</strong> على متجرك <strong>${escapeHtml(storeName)}</strong> وعاد المتجر تلقائياً إلى الباقة الأساسية المحدودة.</p>

      <div class="status-stopped">
        <strong style="font-size: 17px;">💚 حاجة مهمة حابين نطمنك عليها أولاً:</strong><br>
        بيانات متجرك، منتجاتك الحالية، وقائمة عملائك في أمان تماماً ولم يتم حذف أو تعديل أي شيء منها.
      </div>

      <p>بسبب الانتقال للباقة الأساسية، هناك بعض المميزات الاحترافية التي توقفت حالياً:</p>

      <div class="features-lost">
        <strong style="color: #4b5563;">⚠️ الخصائص المتوقفة مؤقتاً:</strong>
        <ul>
          <li><strong>حد المنتجات:</strong> عاد المتجر بحد أقصى 25 منتجاً (لن تتمكن من إضافة منتجات جديدة إذا كنت تخطيت هذا الحد).</li>
          <li><strong>الهوية التجارية:</strong> عاد شعار وحقوق المنصة للظهور في فوتر متجرك.</li>
          <li><strong>الأدوات الذكية:</strong> توقفت ميزة تفريغ الخلفيات بالذكاء الاصطناعي وتخصيص المظهر المتقدم.</li>
        </ul>
      </div>

      <p>إعادة تفعيل متجرك بكامل قوته وسرعته سهلة جداً وبضغطة زر واحدة، وبمجرد التجديد هترجع كل المميزات السابقة فوراً دون الحاجة لإعادة ضبط أي شيء.</p>

      <hr class="divider">

      <!-- أزرار الإجراءات والتواصل الثلاثية -->
      <div class="btn-group">
        <a href="https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20إعادة%20تفعيل%20اشتراك%20Pro" class="btn btn-renew">إعادة تفعيل باقة Pro (عبر واتساب) 🚀</a>
        <a href="https://api.whatsapp.com/send/?phone=201008116452&text=مرحباً،%20عندي%20استفسار%20بخصوص%20متجري%20بعد%20انتهاء%20باقة%20Pro" class="btn btn-contact">تواصل معنا للدعم أو الاستفسار 💬</a>
        <a href="https://play.google.com/store/apps/details?id=com.nextcatalog.app" class="btn btn-app">افتح التطبيق مباشرة من هنا 📱</a>
      </div>

      <hr class="divider">

      <div class="signature">
        جاهزين ومستعدين لمساعدتك في أي وقت لإعادة براندك للقمة 🤝<br><br>
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
انتهت فترة السماح — تم إيقاف باقة Pro لمتجرك 🚨

أهلاً ${traderName} 👋

بنعلمك إن فترة السماح الـ 10 أيام انتهت بالفعل، وللأسف تم إيقاف باقة Pro على متجرك ${storeName} وعاد المتجر تلقائياً إلى الباقة الأساسية المحدودة.

💚 حاجة مهمة حابين نطمنك عليها أولاً:
بيانات متجرك، منتجاتك الحالية، وقائمة عملائك في أمان تماماً ولم يتم حذف أو تعديل أي شيء منها.

بسبب الانتقال للباقة الأساسية، هناك بعض المميزات الاحترافية التي توقفت حالياً:

⚠️ الخصائص المتوقفة مؤقتاً:
- حد المنتجات: عاد المتجر بحد أقصى 25 منتجاً (لن تتمكن من إضافة منتجات جديدة إذا كنت تخطيت هذا الحد)
- الهوية التجارية: عاد شعار وحقوق المنصة للظهور في فوتر متجرك
- الأدوات الذكية: توقفت ميزة تفريغ الخلفيات بالذكاء الاصطناعي وتخصيص المظهر المتقدم

إعادة تفعيل متجرك بكامل قوته وسرعته سهلة جداً وبضغطة زر واحدة، وبمجرد التجديد هترجع كل المميزات السابقة فوراً دون الحاجة لإعادة ضبط أي شيء.

إعادة تفعيل باقة Pro (عبر واتساب):
https://api.whatsapp.com/send/?phone=201008116452&text=أريد%20إعادة%20تفعيل%20اشتراك%20Pro

تواصل معنا للدعم أو الاستفسار:
https://api.whatsapp.com/send/?phone=201008116452&text=مرحباً،%20عندي%20استفسار%20بخصوص%20متجري%20بعد%20انتهاء%20باقة%20Pro

افتح التطبيق مباشرة:
https://play.google.com/store/apps/details?id=com.nextcatalog.app

جاهزين ومستعدين لمساعدتك في أي وقت لإعادة براندك للقمة 🤝

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
