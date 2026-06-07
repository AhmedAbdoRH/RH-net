/**
 * قالب إيميل ترقية التاجر إلى باقة البرو
 */

export interface UpgradeToProEmailParams {
  traderName: string
  storeName?: string
}

const DEFAULT_TRADER_NAME = 'عزيزي التاجر'
const DEFAULT_STORE_NAME = 'متجرك'

export function buildUpgradeToProEmail(params: UpgradeToProEmailParams): {
  subject: string
  html: string
  text: string
} {
  const traderName = params.traderName || DEFAULT_TRADER_NAME
  const storeName = params.storeName || DEFAULT_STORE_NAME

  const subject = `تم تفعيل اشتراك Pro لمتجرك ${storeName} — تاجر أونلاين`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>أهلاً بيك في عائلة Pro — تاجر أونلاين 👑</title>
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
      <h1>أهلاً بيك في عائلة Pro — تاجر أونلاين 👑</h1>
    </div>

    <div class="content">
      <p>مبروك! اشتراكك في باقة <strong>Pro</strong> من تاجر أونلاين تم تفعيله بنجاح.</p>

      <p>من اللحظة دي، متجرك <strong>${escapeHtml(storeName)}</strong> بقى أقوى، وعندك أدوات احترافية تساعدك تكبر وتنمو بشكل أسرع.</p>

      <hr class="divider">

      <h3 style="color:#043832; margin-top:20px;">🎁 المميزات اللي بقت متاحة ليك دلوقتي:</h3>

      <div class="feature">
        <div class="feature-title">♾️ منتجات لا محدودة</div>
        <div class="feature-desc">ضيف عدد لا نهائي من المنتجات والتصنيفات لمتجرك.</div>
      </div>

      <div class="feature">
        <div class="feature-title">🔗 رابط متجر مخصص</div>
        <div class="feature-desc">استخدم اسم علامتك التجارية بدلاً من رقم الهاتف.</div>
      </div>

      <div class="feature">
        <div class="feature-title">🖼️ معرض صور للمنتج</div>
        <div class="feature-desc">ضيف واعرض صور إضافية لكل منتج عشان العميل يشوف كل التفاصيل.</div>
      </div>

      <div class="feature">
        <div class="feature-title">🎨 تخصيص المظهر بالكامل</div>
        <div class="feature-desc">اختار من بين 10 ألوان وأنماط احترافية تناسب هوية متجرك.</div>
      </div>

      <div class="feature">
        <div class="feature-title">📥 جمع بيانات العملاء</div>
        <div class="feature-desc">صدّر بيانات عملائك كملف CSV لإدارة أفضل وحملات أذكى.</div>
      </div>

      <div class="feature">
        <div class="feature-title">✨ أدوات الذكاء الاصطناعي</div>
        <div class="feature-desc">إزالة وتفريغ خلفية صور المنتجات بضغطة زر واحدة.</div>
      </div>

      <div class="feature">
        <div class="feature-title">👑 دعم فني وأولوية مميزة</div>
        <div class="feature-desc">عندك أولوية في الرد والدعم الفني لضمان استمرار أعمالك دائماً.</div>
      </div>

      <div class="feature">
        <div class="feature-title">🚫 هوية متجرك فقط</div>
        <div class="feature-desc">اخفاء حقوق وشعار "أونلاين كاتالوج" من الفوتر — متجرك ببراندك بس.</div>
      </div>

      <hr class="divider">

      <div class="cta">
        <p>📱 دلوقتي تقدر تفتح التطبيق وتستفاد من كل المميزات دي مباشرة من موبايلك!</p>
        <a href="https://play.google.com/store/apps/details?id=com.nextcatalog.app">افتح التطبيق وابدأ الآن 🚀</a>
      </div>

      <hr class="divider">

      <div class="help-box">
        <strong>💬 محتاج مساعدة في أي حاجة؟</strong><br>
        فريقنا في خدمتك مباشرة:<br>
        <a href="https://api.whatsapp.com/send/?phone=201008116452&text&type=phone_number&app_absent=0" class="btn-help-whatsapp">📞 تواصل معنا عبر واتساب</a>
      </div>

      <p>ولو حابب تتعلم تستفيد من كل ميزة بشكل أعمق، انضم لمجتمع تاجر أونلاين على فيسبوك وواتساب واحصل على شروحات أسبوعية وقصص نجاح تجار زيك.</p>
      
      <div class="btn-group">
        <a href="https://www.facebook.com/groups/tagr.online/" class="btn-social btn-facebook">مجموعة فيسبوك 👥</a>
        <a href="https://whatsapp.com/channel/0029Vb8HBRN6mYPSvZzfgo2Y" class="btn-social btn-whatsapp">قناة واتساب 📢</a>
      </div>

      <hr class="divider">

      <div class="signature">
        شكراً إنك اخترت تكبر معانا 💚<br><br>
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
أهلاً بيك في عائلة Pro — تاجر أونلاين 👑

مبروك! اشتراكك في باقة Pro من تاجر أونلاين تم تفعيله بنجاح.

من اللحظة دي، متجرك ${storeName} بقى أقوى، وعندك أدوات احترافية تساعدك تكبر وتنمو بشكل أسرع.

🎁 المميزات اللي بقت متاحة ليك دلوقتي:
♾️ منتجات لا محدودة - ضيف عدد لا نهائي من المنتجات والتصنيفات لمتجرك.
🔗 رابط متجر مخصص - استخدم اسم علامتك التجارية بدلاً من رقم الهاتف.
🖼️ معرض صور للمنتج - ضيف واعرض صور إضافية لكل منتج عشان العميل يشوف كل التفاصيل.
🎨 تخصيص المظهر بالكامل - اختار من بين 10 ألوان وأنماط احترافية تناسب هوية متجرك.
📥 جمع بيانات العملاء - صدّر بيانات عملائك كملف CSV لإدارة أفضل وحملات أذكى.
✨ أدوات الذكاء الاصطناعي - إزالة وتفريغ خلفية صور المنتجات بضغطة زر واحدة.
👑 دعم فني وأولوية مميزة - عندك أولوية في الرد والدعم الفني لضمان استمرار أعمالك دائماً.
🚫 هوية متجرك فقط - اخفاء حقوق وشعار "أونلاين كاتالوج" من الفوتر — متجرك ببراندك بس.

📱 دلوقتي تقدر تفتح التطبيق وتستفاد من كل المميزات دي مباشرة من موبايلك!
https://play.google.com/store/apps/details?id=com.nextcatalog.app

💬 محتاج مساعدة في أي حاجة؟
فريقنا في خدمتك مباشرة عبر واتساب:
https://api.whatsapp.com/send/?phone=201008116452

مجموعة فيسبوك: https://www.facebook.com/groups/tagr.online/
قناة واتساب: https://whatsapp.com/channel/0029Vb8HBRN6mYPSvZzfgo2Y

شكراً إنك اخترت تكبر معانا 💚

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
