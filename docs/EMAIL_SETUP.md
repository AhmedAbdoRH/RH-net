# 📧 دليل إعداد خدمة الإيميل (Resend)

## 🎯 الهدف
عند الضغط على زر **"ترقية إلى Pro"** من لوحة تحكم الأدمن، يتم إرسال إيميل ترحيبي تلقائي للتاجر على بريده الإلكتروني يحتوي على:
- رسالة تهنئة بالترقية
- مميزات باقة البرو
- رابط لوحة التحكم
- معلومات التواصل مع الدعم

---

## 🚀 خطوات الإعداد (5 دقائق)

### الخطوة 1: إنشاء حساب في Resend
1. اذهب إلى [https://resend.com](https://resend.com)
2. سجّل حساب مجاني (Free tier: **100 إيميل/يوم**)
3. أكد الإيميل بتاعك

### الخطوة 2: الحصول على API Key
1. بعد تسجيل الدخول، اذهب إلى [https://resend.com/api-keys](https://resend.com/api-keys)
2. اضغط **"Create API Key"**
3. اختر اسم (مثلاً: "تاجر أونلاين - Production")
4. اختر صلاحية: **Full Access** (أو Sending access على الأقل)
5. اضغط **"Add"**
6. **انسخ المفتاح** (بيبدأ بـ `re_`)

### الخطوة 3: إعداد ملف البيئة
أنشئ ملف `.env.local` في جذر المشروع (لو مش موجود) وأضف:

```env
# مفتاح Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# اسم المُرسل (اختياري - الافتراضي: "تاجر أونلاين")
RESEND_FROM_NAME=تاجر أونلاين

# إيميل المُرسل
# للتجربة السريعة استخدم: onboarding@resend.dev
# للإنتاج: لازم تتحقق من النطاق بتاعك في Resend
RESEND_FROM_EMAIL=onboarding@resend.dev

# إيميل الرد (اختياري)
RESEND_REPLY_TO=support@tagr-online.com
```

### الخطوة 4: التحقق من النطاق (للإنتاج فقط)
للاستخدام في الإنتاج (Production) بدل `onboarding@resend.dev`:

1. في Resend Dashboard، اذهب إلى **"Domains"**
2. اضغط **"Add Domain"**
3. أضف النطاق بتاعك (مثلاً: `tagr-online.com`)
4. أضف الـ DNS records المطلوبة في إعدادات النطاق بتاعك
5. بعد التحقق، استخدم إيميل من النطاق بتاعك في `RESEND_FROM_EMAIL`:
   ```env
   RESEND_FROM_EMAIL=noreply@tagr-online.com
   RESEND_FROM_NAME=تاجر أونلاين
   ```

### الخطوة 5: إعادة تشغيل السيرفر
```bash
# أوقف السيرفر (Ctrl+C) ثم أعد تشغيله
npm run dev
```

---

## 🧪 الاختبار

### 1. تجربة سريعة (بدون نطاق مخصص)
- استخدم `onboarding@resend.dev` كإيميل المُرسل
- ⚠️ **ملحوظة:** Resend بيسمح بإرسال إيميل من `onboarding@resend.dev` **فقط إلى الإيميل اللي سجلت بيه في Resend** للتجربة
- لو عايز تجرب على أي إيميل تاني، لازم تتحقق من النطاق أولاً

### 2. تجربة كاملة
1. شغّل المشروع: `npm run dev`
2. افتح صفحة الأدمن
3. اضغط على زر **"ترقية إلى Pro"** (👑) لأي تاجر
4. **افحص:**
   - إيميل التاجر (لازم يوصله إيميل "تم ترقية باقة البرو الخاصة بك")
   - Console في المتصفح (لازم تشوف رسالة نجاح)
   - Resend Dashboard > **Logs** (لاقي الإيميل هناك مع تفاصيل)

---

## 📂 الملفات المهمة

| الملف | الوظيفة |
|-------|---------|
| `src/lib/email.ts` | خدمة إرسال الإيميلات الأساسية |
| `src/lib/email-templates/upgrade-to-pro.ts` | قالب إيميل ترقية Pro |
| `src/app/api/users/route.ts` | API endpoint اللي بيشغل الترقية + الإيميل |
| `.env.local` | متغيرات البيئة (بتحتوي على API Key) |
| `.env.example` | مثال للمتغيرات المطلوبة |

---

## 🔒 ملاحظات أمنية

⚠️ **مهم جداً:**
- **لا ترفع** ملف `.env.local` على Git
- ملف `.gitignore` لازم يكون فيه `.env.local` (متأكد من ده)
- **لا تشارك** الـ `RESEND_API_KEY` مع أي حد
- لو الـ Key اتسرّب، اعمله revoke فوراً من [Resend Dashboard](https://resend.com/api-keys) واعمل واحد جديد

---

## 🎨 تخصيص القالب

لو عايز تعدّل شكل أو محتوى الإيميل:

1. افتح `src/lib/email-templates/upgrade-to-pro.ts`
2. عدّل الـ HTML أو النص
3. الـ function `buildUpgradeToProEmail` بتاخد parameters ديناميكية:
   - `traderName`: اسم التاجر
   - `storeName`: اسم المتجر
   - `dashboardUrl`: رابط لوحة التحكم
   - `supportEmail`: إيميل الدعم

---

## 🆘 حل المشاكل

### الإيميل مش بيتبعت
1. تأكد من `RESEND_API_KEY` موجود في `.env.local`
2. تأكد إنك عملت **restart** للسيرفر بعد إضافة المتغيرات
3. شوف الـ **console logs** في السيرفر
4. ادخل [Resend Dashboard > Logs](https://resend.com/logs) وشوف سبب الفشل

### Error: "You can only send testing emails to your own email address"
- للتجربة، `onboarding@resend.dev` بيسمح بإرسال إيميلات للإيميل المسجل في Resend فقط
- **الحل:** سجّل دخول في [resend.com](https://resend.com) وتحقق من النطاق بتاعك

### Error: "Domain not verified"
- لازم تتحقق من النطاق في [Resend Dashboard > Domains](https://resend.com/domains)
- أو استخدم `onboarding@resend.dev` للتجربة

---

## 💡 بدائل Resend

لو عايز تستخدم خدمة تانية:
- **SendGrid** - مشهور، free tier 100 إيميل/يوم
- **Nodemailer + Gmail SMTP** - مجاني تماماً، بس محتاج App Password
- **AWS SES** - رخيص جداً (0.10$ لكل 1000 إيميل)، بس أعقد في الإعداد

كل اللي محتاجه تعدّل ملف `src/lib/email.ts` لاستخدام الخدمة الجديدة.
