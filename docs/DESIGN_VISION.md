# الرؤية الفنية - نظام UI الاحترافي

## الفلسفة العامة

نظام واجهة مستخدم احترافي يركز على **الوضوح، الأداء، والوصول**، مع طبقة بصرية تفاعلية تعزز التجربة دون التأثير على الوظائف الأساسية.

## نظام الألوان (Dark-First Palette)

### الألوان الأساسية
```css
--color-bg-primary: #0A0E14;      /* خلفية رئيسية - أزرق داكن جداً */
--color-bg-secondary: #0F1419;    /* خلفية ثانوية */
--color-bg-tertiary: #151A21;     /* خلفية للبطاقات */
--color-bg-elevated: #1A1F28;     /* عناصر مرفوعة */

--color-surface-1: #1E242E;       /* سطح مستوى 1 */
--color-surface-2: #252C38;       /* سطح مستوى 2 */
--color-surface-3: #2D3542;       /* سطح مستوى 3 */
```

### الألوان التفاعلية
```css
--color-accent-primary: #4DB6E8;   /* أزرق فاتح - التفاعلات الأساسية */
--color-accent-hover: #5CC4F5;     /* حالة hover */
--color-accent-active: #3DA5D9;    /* حالة active */

--color-accent-warm: #F59E42;      /* برتقالي دافئ - للتنبيهات */
--color-accent-success: #4CAF50;   /* أخضر - النجاح */
--color-accent-error: #EF5350;     /* أحمر - الأخطاء */
```

### النصوص
```css
--color-text-primary: #E6EDF3;     /* نص أساسي - تباين 14:1 */
--color-text-secondary: #8B949E;   /* نص ثانوي - تباين 4.5:1 */
--color-text-tertiary: #6E7681;    /* نص ثالثي */
--color-text-disabled: #484F58;    /* نص معطل */
```

### الحدود والظلال
```css
--color-border-default: #30363D;   /* حدود افتراضية */
--color-border-muted: #21262D;     /* حدود خفيفة */
--color-border-emphasis: #4DB6E8;  /* حدود مميزة */

--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 8px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.5);
--shadow-glow: 0 0 20px rgba(77,182,232,0.15);
```

## نظام الطباعة

### الخطوط
```css
--font-family-base: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### القياسات
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px - Body */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px - H3 */
--font-size-2xl: 1.5rem;    /* 24px - H2 */
--font-size-3xl: 1.875rem;  /* 30px - H1 */

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

## نظام التباعد

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
```

## Micro-Interactions

### مبادئ التفاعل
1. **السرعة**: جميع التفاعلات < 150ms
2. **الوضوح**: تغييرات واضحة لكن غير مزعجة
3. **الثبات**: لا تغيير في موقع العناصر
4. **التوقع**: سلوك متوقع ومتسق

### أنماط التفاعل

#### Hover
```css
transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
transform: translateY(-1px);
box-shadow: var(--shadow-md);
```

#### Focus
```css
outline: 2px solid var(--color-accent-primary);
outline-offset: 2px;
box-shadow: 0 0 0 4px rgba(77, 182, 232, 0.1);
```

#### Active/Click
```css
transform: scale(0.98);
transition: transform 80ms cubic-bezier(0.4, 0, 0.2, 1);
```

#### Loading
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
}
animation: skeleton-pulse 1.5s ease-in-out infinite;
```

## الخلفية التفاعلية (Canvas/WebGL)

### المفهوم
طبقة جسيمات ضوئية تتفاعل مع المؤشر، تخلق إحساساً بالعمق والحيوية دون التأثير على القراءة.

### المواصفات التقنية

#### نظام الجسيمات
- **العدد**: 40-120 جسيم (حسب الدقة)
- **الحجم**: 1-3px
- **السرعة**: 0.2-0.5 px/frame
- **اللون**: تدرجات من #4DB6E8 مع alpha 0.3-0.7
- **الاتصالات**: خطوط بين الجسيمات < 150px

#### التفاعل مع المؤشر
- **نطاق التأثير**: 200px radius
- **القوة**: تناسب عكسي مع المسافة
- **Parallax**: 3 طبقات بسرعات مختلفة (0.5x, 1x, 1.5x)

#### مستويات الأداء
```javascript
const QUALITY_PRESETS = {
  low: {
    particleCount: 40,
    connectionDistance: 100,
    fps: 30,
    dpr: 1
  },
  medium: {
    particleCount: 70,
    connectionDistance: 130,
    fps: 45,
    dpr: 1.5
  },
  high: {
    particleCount: 120,
    connectionDistance: 150,
    fps: 60,
    dpr: 2
  }
};
```

### البديل CSS-Only
للأجهزة الضعيفة، استخدام gradients متحركة:
```css
background: 
  radial-gradient(circle at 20% 50%, rgba(77,182,232,0.03) 0%, transparent 50%),
  radial-gradient(circle at 80% 50%, rgba(77,182,232,0.02) 0%, transparent 50%);
animation: gradient-shift 20s ease infinite;
```

## إرشادات الوصول (Accessibility)

### التباين
- نص أساسي: ≥ 14:1 (WCAG AAA)
- نص ثانوي: ≥ 4.5:1 (WCAG AA)
- عناصر تفاعلية: ≥ 3:1

### Focus Management
- Focus ring واضح (2px solid)
- Skip links للتنقل السريع
- Focus trap في Modals

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Readers
- ARIA labels على جميع العناصر التفاعلية
- Live regions للتحديثات الديناميكية
- Semantic HTML

## الأداء

### أهداف الأداء
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Canvas FPS: 60fps (أو 30fps في low mode)
- Memory: < 50MB للخلفية

### التحسينات
1. **Canvas Optimization**
   - Object pooling للجسيمات
   - RequestAnimationFrame مع throttling
   - Pause عند `document.hidden`
   - DPR clamping (max 2)

2. **CSS Optimization**
   - CSS containment
   - will-change على العناصر المتحركة فقط
   - Transform/opacity للرسوم المتحركة

3. **JavaScript**
   - Debounce/throttle للأحداث
   - Intersection Observer للتحميل الكسول
   - Code splitting

## أمثلة الاستخدام

### Button Component
```css
.btn {
  padding: var(--spacing-3) var(--spacing-5);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background: var(--color-surface-2);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  background: var(--color-surface-3);
  border-color: var(--color-accent-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.98);
}

.btn:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

### Card Component
```css
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-muted);
  border-radius: 8px;
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--color-border-default);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

## الخلاصة

هذا النظام يوفر:
- ✅ تجربة بصرية احترافية ومريحة
- ✅ أداء عالي على جميع الأجهزة
- ✅ وصول كامل (WCAG 2.1 AA+)
- ✅ مرونة في التخصيص
- ✅ سهولة الصيانة والتطوير
