# دليل الاستخدام - نظام UI الاحترافي

## نظرة عامة

تم تنفيذ نظام UI احترافي متكامل يتضمن:
- ✅ خلفية Canvas تفاعلية مع 3 مستويات جودة
- ✅ نظام متغيرات CSS شامل
- ✅ Micro-interactions جاهزة للاستخدام
- ✅ دعم كامل للوصول (WCAG 2.1 AA+)
- ✅ أداء محسّن (60 FPS)

---

## 1. الخلفية التفاعلية

### الاستخدام الأساسي

```tsx
import { InteractiveBackground } from '@/components/ui/interactive-background';

export default function Page() {
  return (
    <>
      <InteractiveBackground quality="medium" />
      
      <div className="relative z-10">
        {/* المحتوى */}
      </div>
    </>
  );
}
```

### مستويات الجودة

```tsx
// جودة منخفضة - للأجهزة الضعيفة
<InteractiveBackground quality="low" />
// 40 جسيم، 30 FPS، DPR 1

// جودة متوسطة - الافتراضي
<InteractiveBackground quality="medium" />
// 70 جسيم، 45 FPS، DPR 1.5

// جودة عالية - للأجهزة القوية
<InteractiveBackground quality="high" />
// 120 جسيم، 60 FPS، DPR 2
```

### المميزات

- **تفاعل مع الماوس**: الجسيمات تتفاعل ضمن 200px radius
- **Parallax**: 3 طبقات بسرعات مختلفة
- **Auto-pause**: يتوقف عند `document.hidden`
- **Reduced Motion**: يحترم تفضيلات المستخدم
- **CSS Fallback**: بديل تلقائي للأجهزة الضعيفة

---

## 2. نظام المتغيرات CSS

### الألوان

```css
/* الخلفيات */
background: var(--color-bg-primary);      /* #0A0E14 */
background: var(--color-bg-elevated);     /* #1A1F28 */
background: var(--color-surface-2);       /* #252C38 */

/* النصوص */
color: var(--color-text-primary);         /* #E6EDF3 */
color: var(--color-text-secondary);       /* #8B949E */

/* التفاعلات */
color: var(--color-accent-primary);       /* #4DB6E8 */
border-color: var(--color-border-emphasis);
```

### الطباعة

```css
font-size: var(--font-size-sm);          /* 14px - Body */
font-size: var(--font-size-xl);          /* 20px - H3 */
font-weight: var(--font-weight-medium);  /* 500 */
line-height: var(--line-height-normal);  /* 1.5 */
```

### التباعد

```css
padding: var(--spacing-4);               /* 16px */
gap: var(--spacing-3);                   /* 12px */
margin: var(--spacing-6);                /* 24px */
```

### الظلال

```css
box-shadow: var(--shadow-sm);            /* خفيف */
box-shadow: var(--shadow-md);            /* متوسط */
box-shadow: var(--shadow-glow);          /* إضاءة */
```

---

## 3. Micro-Interactions

### الأزرار

```html
<!-- زر أساسي -->
<button class="btn-base btn-primary">
  حفظ
</button>

<!-- زر ثانوي -->
<button class="btn-base btn-secondary">
  إلغاء
</button>

<!-- زر شفاف -->
<button class="btn-base btn-ghost">
  المزيد
</button>
```

### البطاقات

```html
<!-- بطاقة عادية -->
<div class="card-base">
  المحتوى
</div>

<!-- بطاقة تفاعلية -->
<div class="card-base card-interactive">
  المحتوى التفاعلي
</div>
```

### الحقول

```html
<input 
  type="text" 
  class="input-base" 
  placeholder="أدخل النص"
/>
```

### Badges

```html
<span class="badge badge-primary">نشط</span>
<span class="badge badge-success">مكتمل</span>
<span class="badge badge-error">خطأ</span>
<span class="badge badge-warning">تحذير</span>
```

### Loading States

```html
<!-- Skeleton -->
<div class="skeleton" style="width: 200px; height: 20px;"></div>

<!-- Spinner -->
<div class="spinner"></div>
```

### Tooltips

```html
<button 
  class="tooltip" 
  data-tooltip="نص التلميح"
>
  زر مع tooltip
</button>
```

---

## 4. الرسوم المتحركة

### Fade In

```html
<div class="fade-in">
  محتوى يظهر تدريجياً
</div>
```

### Slide In

```html
<div class="slide-in-up">
  محتوى يظهر من الأسفل
</div>

<div class="slide-in-down">
  محتوى يظهر من الأعلى
</div>
```

### Scale In

```html
<div class="scale-in">
  محتوى يتكبر تدريجياً
</div>
```

### Glow Effect

```html
<div class="glow">
  عنصر مع إضاءة نابضة
</div>
```

---

## 5. أمثلة عملية

### بطاقة إحصائيات

```tsx
function StatsCard({ title, value, icon: Icon }) {
  return (
    <div className="card-base card-interactive">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
```

### نموذج تسجيل دخول

```tsx
function LoginForm() {
  return (
    <div className="card-base max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">تسجيل الدخول</h2>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            البريد الإلكتروني
          </label>
          <input 
            type="email" 
            className="input-base" 
            placeholder="email@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            كلمة المرور
          </label>
          <input 
            type="password" 
            className="input-base" 
            placeholder="••••••••"
          />
        </div>
        
        <button type="submit" className="btn-base btn-primary w-full">
          دخول
        </button>
      </form>
    </div>
  );
}
```

### قائمة مع Loading

```tsx
function ItemList({ items, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="card-base card-interactive fade-in">
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

---

## 6. التخصيص

### تغيير الألوان

في `src/styles/design-system.css`:

```css
:root {
  --color-accent-primary: #YOUR_COLOR;
  --color-accent-hover: #YOUR_HOVER_COLOR;
}
```

### تغيير الخطوط

```css
:root {
  --font-family-base: 'Your Font', sans-serif;
}
```

### تغيير سرعة الانتقالات

```css
:root {
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 7. الأداء

### تحسين الخلفية

```tsx
// للأجهزة الضعيفة
<InteractiveBackground quality="low" />

// تعطيل الخلفية
{!isMobile && <InteractiveBackground quality="medium" />}
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 8. الوصول (Accessibility)

### Focus Management

```tsx
// استخدم focus-ring للعناصر المخصصة
<div 
  className="focus-ring" 
  tabIndex={0}
  role="button"
>
  عنصر تفاعلي
</div>
```

### ARIA Labels

```tsx
<button aria-label="إغلاق النافذة">
  <X aria-hidden="true" />
</button>
```

### Skip Links

```tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only"
>
  تخطى إلى المحتوى
</a>
```

---

## 9. استكشاف الأخطاء

### الخلفية لا تظهر

```tsx
// تأكد من:
// 1. z-index صحيح
// 2. المحتوى له position: relative و z-index أعلى
<InteractiveBackground />
<div className="relative z-10">المحتوى</div>
```

### الأداء بطيء

```tsx
// قلل الجودة
<InteractiveBackground quality="low" />

// أو استخدم CSS fallback فقط
// احذف InteractiveBackground
```

### الألوان لا تظهر

```tsx
// تأكد من استيراد CSS
import '../styles/design-system.css';
import '../styles/micro-interactions.css';
```

---

## 10. الموارد

### الملفات الأساسية
- `src/styles/design-system.css` - المتغيرات
- `src/styles/micro-interactions.css` - التفاعلات
- `src/components/ui/interactive-background.tsx` - الخلفية

### التوثيق
- `docs/DESIGN_VISION.md` - الرؤية الفنية
- `docs/ACCESSIBILITY_PERFORMANCE.md` - الوصول والأداء
- `docs/USAGE_GUIDE.md` - هذا الملف

---

## الخلاصة

النظام جاهز للاستخدام مع:
- ✅ خلفية تفاعلية احترافية
- ✅ مكونات UI جاهزة
- ✅ أداء محسّن
- ✅ وصول كامل
- ✅ سهولة التخصيص

للمساعدة أو الأسئلة، راجع التوثيق الكامل في مجلد `docs/`.
