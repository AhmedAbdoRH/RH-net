/**
 * قالب إيميل ترحيبي للتاجر الجديد
 */

export interface WelcomeEmailParams {
  traderName: string
  storeName?: string
  storeUrl?: string
}

const DEFAULT_TRADER_NAME = 'عزيزي التاجر'
const DEFAULT_STORE_NAME = 'متجرك'

export function buildWelcomeEmail(params: WelcomeEmailParams): {
  subject: string
  html: string
  text: string
} {
  const traderName = params.traderName || DEFAULT_TRADER_NAME
  const storeName = params.storeName || DEFAULT_STORE_NAME
  const storeUrl = params.storeUrl || 'https://tagr-online.com'

  const subject = `أهلاً بيك في تاجر أونلاين — متجرك جاهز للإطلاق! 🚀`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>أهلاً بيك في تاجر أونلاين — متجرك جاهز للإطلاق! 🚀</title>
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
    background: linear-gradient(135deg, #043832 0%, #0E343C 100%);
    color: #ffffff;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
  }
  .header p {
    margin: 10px 0 0;
    color: #55F9E6;
    font-size: 16px;
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
  .feature {
    background: #f9f9f9;
    border-right: 4px solid #55F9E6;
    padding: 15px 20px;
    margin: 12px 0;
    border-radius: 8px;
  }
  .feature-title {
    font-weight: 700;
    color: #043832;
    margin-bottom: 5px;
    font-size: 16px;
  }
  .feature-desc {
    color: #555;
    font-size: 14px;
  }
  .cta {
    text-align: center;
    margin: 25px 0;
    background: #f0fdfa;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #ccfbf1;
  }
  .cta p {
    margin-top: 0;
    margin-bottom: 15px;
    font-weight: 600;
    color: #043832;
  }
  .cta a {
    background: #55F9E6;
    color: #043832;
    padding: 14px 36px;
    text-decoration: none;
    border-radius: 30px;
    font-weight: 700;
    display: inline-block;
    font-size: 16px;
    box-shadow: 0 4px 10px rgba(85, 249, 230, 0.3);
  }
  .trial-box {
    background: #fff8e1;
    padding: 20px;
    border-radius: 8px;
    border-right: 4px solid #ffc107;
    margin: 25px 0;
  }
  .trial-box h3 {
    margin: 0 0 10px;
    color: #043832;
    font-size: 18px;
  }
  .btn-group {
    text-align: center;
    margin: 20px 0;
  }
  .btn-social {
    display: inline-block;
    padding: 10px 20px;
    margin: 5px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    color: #fff;
  }
  .btn-facebook {
    background-color: #1877F2;
  }
  .btn-whatsapp {
    background-color: #25D366;
  }
  .help-box {
    background: #fff8e1;
    padding: 20px;
    border-radius: 8px;
    border-right: 4px solid #ffc107;
    margin: 25px 0;
  }
  .btn-help-whatsapp {
    display: inline-block;
    background: #043832;
    color: #fff;
    padding: 10px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 12px;
    font-size: 14px;
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
      <h1>أهلاً بيك في تاجر أونلاين — متجرك جاهز للإطلاق! 🚀</h1>
      <p>مبروك! متجرك ${escapeHtml(storeName)} جاهز للبدء ✨</p>
    </div>

    <div class="content">
      <p>أهلاً بيك يا <strong>${escapeHtml(traderName)}</strong>،</p>

      <p>مبروك على إنشاء متجرك <strong>${escapeHtml(storeName)}</strong>! من اللحظة دي، عندك متجر أونلاين كامل جاهز لعرض منتجاتك والوصول لعملاء جدد.</p>

      <hr class="divider">

      <div class="trial-box">
        <h3>⏰ فترة تجريبية مجانية — 40 يوم كاملة!</h3>
        <p>لديك <strong>30 يوم فترة تجريبية</strong> لاستكشاف كل مميزات المنصة، بالإضافة إلى <strong>10 أيام فترة سماح</strong> بعد انتهاء الفترة التجريبية.</p>
        <p style="margin-top:10px; color:#666; font-size:14px;">بعد الـ 40 يوم، هتتلقى إيميل تذكير قبل انتهاء الفترة.</p>
      </div>

      <hr class="divider">

      <h3 style="color:#043832; margin-top:20px;">🎯 الخطوات القادمة:</h3>

      <div class="feature">
        <div class="feature-title">1️⃣ أضف أول منتج</div>
        <div class="feature-desc">ابدأ بإضافة منتجاتك مع صور وأسعار ووصف دقيق. كل ما أضفت منتجات أكثر، زادت فرصك في البيع!</div>
      </div>

      <div class="feature">
        <div class="feature-title">2️⃣ نظّم متجرك</div>
        <div class="feature-desc">أنشئ تصنيفات لمنتجاتك عشان يسهل على العملاء البحث والعثور على اللي بيحتاجوه.</div>
      </div>

      <div class="feature">
        <div class="feature-title">3️⃣ شارك متجرك</div>
        <div class="feature-desc">انسخ رابط متجرك وشاركه على فيسبوك، واتساب، إنستجرام، وأي منصة تانية. رابط متجرك: <a href="${escapeHtml(storeUrl)}" style="color:#043832; text-decoration:underline;">${escapeHtml(storeUrl)}</a></div>
      </div>

      <div class="feature">
        <div class="feature-title">4️⃣ تفاعل مع عملائك</div>
        <div class="feature-desc">رد على استفسارات العملاء بسرعة وحسن خدمتهم عشان يرجعوا تاني ويوصوا بيك لغيرهم.</div>
      </div>

      <hr class="divider">

      <div class="cta">
        <p>📱 دلوقتي تقدر تفتح التطبيق وتبدأ إضافة منتجاتك مباشرة!</p>
        <a href="https://play.google.com/store/apps/details?id=com.nextcatalog.app">افتح التطبيق وابدأ الآن 🚀</a>
      </div>

      <hr class="divider">

      <div class="help-box">
        <strong>💬 محتاج مساعدة في أي حاجة؟</strong><br>
        فريقنا في خدمتك مباشرة:<br>
        <a href="https://api.whatsapp.com/send/?phone=201008116452&text=أهلاً، محتاج مساعدة في متجري&text&type=phone_number&app_absent=0" class="btn-help-whatsapp">📞 تواصل معنا عبر واتساب</a>
      </div>

      <p>ولو حابب تتعلم تستفاد من كل ميزة بشكل أعمق، انضم لمجتمع تاجر أونلاين على فيسبوك وواتساب واحصل على شروحات أسبوعية وقصص نجاح تجار زيك.</p>
      
      <div class="btn-group">
        <a href="https://www.facebook.com/groups/tagr.online/" class="btn-social btn-facebook">مجموعة فيسبوك 👥</a>
        <a href="https://whatsapp.com/channel/0029Vb8HBRN6mYPSvZzfgo2Y" class="btn-social btn-whatsapp">قناة واتساب 📢</a>
      </div>

      <hr class="divider">

      <div class="signature">
        شكراً لاختيارك تاجر أونلاين 💚<br><br>
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
        تم إرسال هذا الإيميل لأنك سجلت في تاجر أونلاين. <br>
        <a href="https://tagr-online.com/unsubscribe" style="color:#999; text-decoration:underline;">إلغاء الاشتراك</a>
      </p>
    </div>

  </div>
</body>
</html>`.trim()

  const text = `
أهلاً بيك في تاجر أونلاين — متجرك جاهز للإطلاق! 🚀

مبروك! متجرك ${storeName} جاهز للبدء ✨

أهلاً بيك يا ${traderName}،

مبروك على إنشاء متجرك ${storeName}! من اللحظة دي، عندك متجر أونلاين كامل جاهز لعرض منتجاتك والوصول لعملاء جدد.

⏰ فترة تجريبية مجانية — 40 يوم كاملة!
لديك 30 يوم فترة تجريبية لاستكشاف كل مميزات المنصة، بالإضافة إلى 10 أيام فترة سماح بعد انتهاء الفترة التجريبية.
بعد الـ 40 يوم، هتتلقى إيميل تذكير قبل انتهاء الفترة.

🎯 الخطوات القادمة:

1️⃣ أضف أول منتج
ابدأ بإضافة منتجاتك مع صور وأسعار ووصف دقيق. كل ما أضفت منتجات أكثر، زادت فرصك في البيع!

2️⃣ نظّم متجرك
أنشئ تصنيفات لمنتجاتك عشان يسهل على العملاء البحث والعثور على اللي بيحتاجوه.

3️⃣ شارك متجرك
انسخ رابط متجرك وشاركه على فيسبوك، واتساب، إنستجرام، وأي منصة تانية.
رابط متجرك: ${storeUrl}

4️⃣ تفاعل مع عملائك
رد على استفسارات العملاء بسرعة وحسن خدمتهم عشان يرجعوا تاني ويوصوا بيك لغيرهم.

📱 دلوقتي تقدر تفتح التطبيق وتبدأ إضافة منتجاتك مباشرة!
https://play.google.com/store/apps/details?id=com.nextcatalog.app

💬 محتاج مساعدة في أي حاجة؟
فريقنا في خدمتك مباشرة عبر واتساب:
https://api.whatsapp.com/send/?phone=201008116452

مجموعة فيسبوك: https://www.facebook.com/groups/tagr.online/
قناة واتساب: https://whatsapp.com/channel/0029Vb8HBRN6mYPSvZzfgo2Y

شكراً لاختيارك تاجر أونلاين 💚

— أحمد عبده
تاجر أونلاين
tagr-online.com

تم إرسال هذا الإيميل لأنك سجلت في تاجر أونلاين.
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
