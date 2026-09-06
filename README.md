<p align="center">
  <img src="docs/assets/tinymanager-hero.svg" alt="TinyManager — ابزارهای کوچک، مدیریت بهتر" width="100%" />
</p>

<p align="center">
  <strong>فضای کاری مدیریتی سبک، ماژولار، Local-first، دو‌زبانه و مجهز به Tiny Language Engine</strong>
</p>

<p align="center">
  <a href="README.md">🇮🇷 فارسی</a> · <a href="README.en.md">🇬🇧 English</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-First-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=0B1220" />
  <img alt="RTL LTR" src="https://img.shields.io/badge/RTL%20%2F%20LTR-Native-0F766E" />
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-Yes-7C3AED" />
  <img alt="Offline Language Engine" src="https://img.shields.io/badge/Tiny%20Language%20Engine-Offline-D97706" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-111827" />
</p>

# TinyManager

**TinyManager** قرار نیست یک ERP یا داشبورد مدیریتی شلوغ باشد. این پروژه یک **هسته مدیریتی ساده و ماژول‌پذیر** است که مدیر فقط ابزارهای موردنیاز خود را فعال می‌کند و برای کارهای روزانه تا حد ممکن به‌جای فرم و منو، یک درخواست کوتاه می‌نویسد.

> **اصل محصول:** TinyManager همراه مدیر بزرگ می‌شود؛ نه اینکه از روز اول او را با امکانات شلوغ کند.

## وضعیت فعلی — v0.1.0-alpha.2

هسته پروژه اکنون اجرایی است و این قابلیت‌ها را دارد:

- App Shell دو‌زبانه فارسی/English
- RTL/LTR واقعی و Mirror شدن رابط
- Theme روشن/تیره/System
- Module Registry و Module Manager
- IndexedDB و Storage API مشترک
- Backup / Restore کل Core و ماژول‌ها
- Shared Projects و Shared People با Alias و تشخیص ابهام نام
- Webtanan Jalali Date Engine برای تاریخ فارسی
- Tiny AI مبتنی بر **Tiny Language Engine (TLE)**، کاملاً Local و بدون LLM خارجی
- اجرای فرمان‌های کنترل‌شده برای ماژول‌های مدیریتی
- یادگیری واژگان جدید با تأیید مدیر
- Vocabulary Manager برای مدیریت واژگان اختصاصی
- Suggestion Center بر اساس Training History تأییدشده
- Route اجرایی برای تمام ماژول‌های Alpha داخل Core

### ماژول‌های اجرایی فعلی

| ماژول | وضعیت | کاربرد |
|---|---|---|
| `tiny-decision-matrix` | Alpha | مقایسه و رتبه‌بندی گزینه‌ها با معیارهای وزن‌دار |
| `tiny-meeting-cost` | Alpha | محاسبه هزینه مالی و نفر-ساعت جلسه |
| `tiny-waiting` | Alpha | ثبت و پیگیری موارد منتظر پاسخ با Shared People |
| `tiny-delegation` | Alpha | ثبت و پیگیری کارهای تفویض‌شده |
| `tiny-deadline` | Alpha | ثبت موعد و عبارت‌های زمانی طبیعی |
| `tiny-risk` | Alpha | ثبت ریسک و امتیاز احتمال × اثر |
| `tiny-raci` | Alpha | ثبت Responsible / Accountable برای فعالیت‌ها |
| `tiny-weekly-review` | Alpha | ساخت مرور هفتگی از سیگنال ماژول‌ها |
| `tiny-project-health` | Alpha | محاسبه امتیاز سلامت از Deadline/Risk/Waiting/Delegation |

هر ۹ ماژول هم **Standalone** اجرا می‌شوند و هم از طریق Package مستقل خودشان داخل TinyManager Core قرار می‌گیرند؛ Domain Logic داخل Core کپی نشده است.

## Tiny AI بدون LLM خارجی

TinyManager از یک مدل عمومی مثل ChatGPT درون برنامه استفاده نمی‌کند. موتور داخلی آن **Tiny Language Engine — TLE** است.

TLE فقط واژه‌ها، مترادف‌ها و الگوهای تعریف‌شده را می‌شناسد و مقادیر آزاد مثل نام پروژه، نام شخص، مبلغ و توضیح را به‌صورت Slot استخراج می‌کند.

مثال:

```text
پروژه خط تولید شماره ۳ با بودجه ۵۰۰ میلیون ایجاد کن
```

کنترل‌ها:

```text
پروژه → entity.project
بودجه → field.budget
ایجاد → action.create
```

مقادیر آزاد:

```text
خط تولید شماره ۳
۵۰۰ میلیون
```

Tiny AI در Alpha.2 علاوه بر فرمان‌های Core می‌تواند درخواست‌های کنترل‌شده ماژول‌ها را نیز Route و اجرا کند؛ از جمله:

```text
پیگیری قرارداد را به علی بسپار
موعد ارسال قرارداد را برای فردا ثبت کن
ریسک تاخیر تامین را ثبت کن احتمال ۴ اثر ۵
مرور هفتگی
سلامت پروژه چطوره
```

عملیات تغییردهنده داده قبل از اجرا Preview و Confirm می‌شوند. گزارش‌هایی مانند Weekly Review و Project Health فقط داده‌های Local موجود را می‌خوانند.

### اطلاعات ناقص

اگر مدیر بنویسد:

```text
پروژه نمایشگاه ایجاد کن
```

Tiny AI فرم کامل باز نمی‌کند؛ فقط داده ضروری بعدی را می‌پرسد.

### واژه ناشناخته و یادگیری درجا

اگر مدیر عبارتی بنویسد که هنوز در واژگان تعریف نشده، Tiny AI حدس اجرایی نمی‌زند. همان‌جا امکان نسبت دادن آن عبارت به یک مفهوم کنترل‌شده TLE را می‌دهد.

Aliasها در:

```text
core.language.aliases.v1
```

و Context آموزش تأییدشده در:

```text
core.language.training.v1
```

ذخیره می‌شوند. هر دو Local هستند، از «مرکز زبان و یادگیری» قابل مدیریت‌اند و همراه Backup منتقل می‌شوند.

جزئیات در [`docs/TINY_LANGUAGE_ENGINE.md`](docs/TINY_LANGUAGE_ENGINE.md).

## چرا TinyManager؟

مدیر باید خیلی سریع بداند:

- امروز چه چیزی نیازمند توجه است؟
- منتظر پاسخ چه کسی هستم؟
- چه کاری را به چه کسی سپرده‌ام؟
- چه موعدی نزدیک یا عقب‌افتاده است؟
- کدام ریسک مهم است؟
- چه تصمیمی باید گرفته شود؟
- وضعیت کلی کارها و پروژه‌ها چگونه است؟

TinyManager این مسائل را به ماژول‌های کوچک تقسیم می‌کند، ولی داده و تجربه کاربری را در یک Core مشترک نگه می‌دارد.

## ماژول‌ها

| ماژول | Repository | کاربرد |
|---|---|---|
| Decision Matrix | `tiny-decision-matrix` | مقایسه و امتیازدهی گزینه‌ها با معیارهای وزن‌دار |
| Meeting Cost | `tiny-meeting-cost` | محاسبه هزینه واقعی جلسه |
| RACI | `tiny-raci` | تعیین Responsible / Accountable / Consulted / Informed |
| Risk | `tiny-risk` | ثبت ریسک و امتیاز احتمال × اثر |
| Waiting For | `tiny-waiting` | پیگیری مواردی که منتظر پاسخ دیگران هستند |
| Delegation | `tiny-delegation` | پیگیری کارهای تفویض‌شده |
| Deadline | `tiny-deadline` | رادار موعدهای نزدیک و عقب‌افتاده |
| Weekly Review | `tiny-weekly-review` | مرور هفتگی تولیدشده از داده ماژول‌ها |
| Project Health | `tiny-project-health` | سنجش سریع سلامت بر اساس سیگنال‌های واقعی |

هر ماژول دو حالت دارد:

1. **Standalone** — مستقل اجرا می‌شود.
2. **TinyManager Module** — با همان Domain Logic داخل Core استفاده می‌شود.

## Shared People

ماژول‌های مرتبط با افراد به‌جای ساخت دفترچه‌های تکراری، از Shared People هسته استفاده می‌کنند.

- نام فارسی/English Normalize می‌شود.
- Alias برای هر شخص پشتیبانی می‌شود.
- Match یکتا مستقیماً Resolve می‌شود.
- اگر چند شخص با یک نام Match شوند، سیستم به‌جای حدس زدن درخواست نام دقیق‌تر می‌کند.
- Waiting و Delegation شناسه `personId` را کنار نام خوانا ذخیره می‌کنند.

## Weekly Review و Project Health

این دو ماژول برای مدیر فرم طولانی ایجاد نمی‌کنند.

**Weekly Review** سیگنال‌های Delegation، Deadline، Risk و Waiting را می‌خواند و یک مرور قابل‌توضیح تولید می‌کند.

**Project Health** از همین داده‌ها یک امتیاز ۰ تا ۱۰۰ و دلایل وضعیت ارائه می‌کند. این محاسبات قطعی و Local هستند و به سرویس بیرونی وابسته نیستند.

## دو زبان از هسته، نه به‌عنوان افزونه

فارسی زبان اول TinyManager و English زبان دوم است.

### فارسی

- رابط RTL
- Sidebar سمت راست
- تاریخ شمسی با Webtanan Jalali Date Engine
- متن و کنترل‌های جهت‌دار سازگار با RTL

### English

- Full LTR interface
- Sidebar on the left
- Gregorian date presentation
- English labels and Latin digits

تغییر زبان فقط ترجمه متن نیست؛ **جهت کل رابط نیز Mirror می‌شود**.

## Technology Stack

- **TypeScript** — زبان اصلی
- **React** — رابط کاربری
- **Vite** — Build و Development
- **Tailwind CSS + CSS Variables** — Design System
- **Lucide Icons** — خانواده آیکن مشترک
- **IndexedDB** — ذخیره Local-first
- **Webtanan Jalali Date Engine** — موتور رسمی تاریخ فارسی
- **Vitest** — تست هسته و ماژول‌ها

## معماری

```text
TinyManager Core
│
├── App Shell
├── Dashboard
├── Tiny AI / TLE
│   ├── Controlled vocabulary
│   ├── Core interpreter
│   ├── Module interpreters
│   ├── Action resolver
│   ├── Slot extraction
│   ├── Inline learning
│   ├── Vocabulary Manager
│   └── Suggestion Center
├── i18n + RTL/LTR
├── Module Registry
├── Storage API
├── Date API
├── Theme
├── Backup / Restore
└── Shared Entities
     ├── People
     ├── Projects
     ├── Teams
     └── Tags

Modules
├── Decision Matrix
├── Meeting Cost
├── RACI
├── Risk
├── Waiting For
├── Delegation
├── Deadline
├── Weekly Review
└── Project Health
```

جزئیات قرارداد در [`docs/MODULE_SPEC.md`](docs/MODULE_SPEC.md) قرار دارد.

## Local-first و حریم خصوصی

نسخه پایه بدون حساب کاربری و بدون Server کار می‌کند.

- داده اصلی روی دستگاه کاربر نگهداری می‌شود.
- Tiny Language Engine به اینترنت نیاز ندارد.
- هیچ API Key یا LLM خارجی برای فرمان‌های اصلی لازم نیست.
- ماژول‌ها از Storage API هسته استفاده می‌کنند.
- Backup یکپارچه، داده Core، ماژول‌ها، Shared People و واژگان آموزشی را منتقل می‌کند.

در آینده Cloud Sync می‌تواند به‌صورت Adapter اضافه شود، بدون تغییر Domain Logic ماژول‌ها.

## راه‌اندازی توسعه

```bash
git clone https://github.com/webtanan-sketch/tinymanager.git
cd tinymanager
npm install
npm run dev
```

بررسی کیفیت:

```bash
npm run typecheck
npm run test
npm run build
```

## اصول طراحی

1. **یک مسئله، یک ماژول**
2. **کمترین ورود اطلاعات برای مدیر**
3. **یک سؤال در هر مرحله**
4. **Progressive Disclosure به‌جای فرم‌های شلوغ**
5. **فارسی و RTL درجه‌یک**
6. **Local-first به‌صورت پیش‌فرض**
7. **هیچ Mutation بدون Preview و Confirm**
8. **Design System مشترک برای همه Repositoryها**
9. **هر ماژول مستقل و قابل استفاده خارج از Core**
10. **پیشنهاد می‌تواند هوشمندتر شود؛ اجرای خودکار همچنان کنترل‌شده می‌ماند**

## اسناد توسعه

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — معماری هسته
- [`MODULE_SPEC.md`](docs/MODULE_SPEC.md) — قرارداد ماژول‌ها
- [`DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — سیستم طراحی و آیکن‌ها
- [`UX_PRINCIPLES.md`](docs/UX_PRINCIPLES.md) — اصول UX کم‌ورودی
- [`TINY_LANGUAGE_ENGINE.md`](docs/TINY_LANGUAGE_ENGINE.md) — موتور زبان و یادگیری کنترل‌شده

## Roadmap

- [x] Stack اصلی TypeScript + React + Vite
- [x] App Shell دو‌زبانه RTL/LTR
- [x] Module Registry و Module Manager
- [x] Storage API روی IndexedDB
- [x] Date Service با Webtanan Jalali Date Engine
- [x] Backup / Restore
- [x] Tiny Language Engine آفلاین
- [x] Runtime vocabulary teaching
- [x] Vocabulary Manager + Suggestion Center
- [x] Shared People integration برای Waiting و Delegation
- [x] Decision Matrix Module
- [x] Meeting Cost Module
- [x] Waiting For Module
- [x] Delegation Module
- [x] Deadline Module + natural date phrases
- [x] Risk Module
- [x] RACI Module
- [x] Weekly Review auto-aggregation
- [x] Project Health scoring
- [x] Route اجرایی تمام ۹ ماژول در Core
- [ ] Dashboard Widgets غنی از داده
- [ ] PWA Offline Mode کامل
- [ ] اولین Release عمومی Alpha

## مشارکت

TinyManager برای توسعه ماژول‌های مستقل طراحی شده است. هر Module باید Domain Logic خود را مستقل نگه دارد و از قرارداد Core برای Storage، Language Actions، Shared Entities و UI integration استفاده کند.

## License

MIT © 2026 Webtanan
