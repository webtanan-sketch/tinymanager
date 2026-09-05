# TinyManager Design System

> Foundation design language — v0.1

هدف Design System این است که تمام Repositoryهای TinyManager حتی وقتی مستقل اجرا می‌شوند، از نظر بصری و رفتاری عضو یک خانواده باشند.

---

## 1. Principles

### Quiet, not empty

رابط باید خلوت باشد اما اطلاعات مهم را پنهان نکند.

### Action before decoration

هر Card و Widget باید به تصمیم یا اقدام مدیر کمک کند.

### Direction-aware by default

RTL و LTR باید با همان کیفیت طراحی شوند.

### Consistency across modules

Module حق ندارد Theme و سیستم فاصله‌گذاری کاملاً متفاوتی ایجاد کند.

---

## 2. Brand

### Name

```text
TinyManager
```

### Tagline

```text
Small tools. Better management.
ابزارهای کوچک، مدیریت بهتر
```

### Mark

لوگوی Foundation از چهار خانه مربعی ساخته شده و به مفهوم «Core + Modules» اشاره می‌کند.

---

## 3. Color Tokens

هسته از Semantic Token استفاده می‌کند، نه رنگ‌های hard-coded در Componentهای ماژول.

نمونه Foundation:

```css
--tm-bg
--tm-surface
--tm-surface-soft
--tm-text
--tm-text-soft
--tm-border
--tm-primary
--tm-teal
--tm-warning
--tm-danger
--tm-purple
```

ماژول می‌تواند Accent محدود داشته باشد اما Surface، Border و Typography باید از Core بمانند.

---

## 4. Theme

سه انتخاب کاربر:

```text
Light
Dark
System
```

Theme نباید Direction را تغییر دهد.

---

## 5. Typography

اولویت:

- خوانایی فارسی
- خوانایی داده و اعداد
- وزن‌های محدود
- عدم استفاده از فونت‌های نمایشی در UI

Foundation فعلی از system font stack استفاده می‌کند تا پروژه بدون وابستگی شبکه کار کند.

توصیه وزن:

```text
400 regular
550/600 UI label
700 heading / important value
800 small eyebrow / badge
```

---

## 6. Spacing

واحد پایه پیشنهادی:

```text
4px
```

فواصل رایج:

```text
4 / 8 / 12 / 16 / 20 / 24 / 32
```

Card padding معمول:

```text
18–24px desktop
16–20px mobile
```

---

## 7. Radius

```text
Control: 8–12px
Card: 14–18px
Feature / Hero: 20–24px
Pill: 999px
```

از Radiusهای بسیار گرد برای همه عناصر استفاده نشود.

---

## 8. Icons

Icon family رسمی:

**Lucide**

Stroke پیشنهادی:

```text
1.8–2.0
```

اندازه رایج:

```text
16 / 18 / 20 / 24
```

قواعد:

- Icon-only button باید `aria-label` داشته باشد.
- یک Action مشابه در تمام Moduleها Icon یکسان دارد.
- Icon جهت‌دار در RTL Mirror می‌شود.
- Emoji جایگزین Icon محصول نیست.

---

## 9. Sidebar

Desktop:

```text
FA → Right
EN → Left
```

Mobile:

Navigation به Bottom Dock تبدیل می‌شود.

Active state:

- رنگ متن روشن‌تر
- Accent بسیار محدود
- Border ظریف
- بدون Glow سنگین

---

## 10. Cards

Card استاندارد:

- Surface token
- 1px semantic border
- soft shadow
- title hierarchy واضح
- hover فقط در Card تعاملی

Card نباید صرفاً برای تزئین استفاده شود.

---

## 11. Status

Status فقط با رنگ مشخص نشود.

مثال:

```text
Critical + icon + red accent
Overdue + label + warning accent
Done + check icon + success accent
```

---

## 12. Tables

برای Moduleهای جدولی:

- header sticky در جدول طولانی
- numeric columns align مناسب
- responsive fallback
- keyboard focus
- empty state واضح
- bulk actions فقط زمانی که واقعاً لازم است

در فارسی ترتیب ستون باید بر اساس workflow فارسی طراحی شود، نه فقط `direction: rtl`.

---

## 13. Forms

- Label همیشه قابل مشاهده باشد.
- Placeholder جای Label را نگیرد.
- Error message نزدیک Field باشد.
- Primary Action واضح باشد.
- destructive action از Primary جدا باشد.

---

## 14. Motion

Animation باید کوتاه و کاربردی باشد.

```text
120–180ms
```

پشتیبانی اجباری:

```css
@media (prefers-reduced-motion: reduce)
```

---

## 15. Responsive Baseline

Desktop first for manager workspace، اما Mobile باید usable باشد.

Breakpoints Foundation تقریبی:

```text
1080
860
680
480
```

در Mobile هدف نمایش تمام Dashboard دسکتاپ نیست؛ هدف دسترسی سریع و صحیح به Actionهاست.

---

## 16. Accessibility

حداقل استاندارد داخلی:

- visible focus
- semantic HTML
- keyboard access
- sufficient contrast
- reduced motion
- aria-label for icon controls
- no hover-only critical information

---

## 17. Module Visual Contract

Module می‌تواند:

- نمودار مخصوص Domain داشته باشد.
- Accent محدود داشته باشد.
- Layout داخلی متناسب با مسئله خود داشته باشد.

Module نمی‌تواند:

- Sidebar مستقل داخل Core ایجاد کند.
- typography system را تعویض کند.
- global background را override کند.
- modal/toast system ناسازگار ایجاد کند.
- icon family دیگری را بدون دلیل فنی وارد کند.

---

## 18. Current module icon map

| Module | Lucide icon |
|---|---|
| Core | `LayoutDashboard` |
| Decision Matrix | `Scale` |
| Meeting Cost | `Clock3` |
| RACI | `Network` |
| Risk | `TriangleAlert` |
| Waiting For | `Hourglass` |
| Delegation | `Send` |
| Deadline | `CalendarClock` |
| Weekly Review | `ClipboardCheck` |
| Project Health | `Activity` |
