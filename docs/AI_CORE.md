# Tiny AI Core

[فارسی](#فارسی) · [English](#english)

## فارسی

Tiny AI یک چت عمومی نیست. هدف آن کم‌کردن تعداد فرم‌ها، کلیک‌ها و انتخاب‌های مدیر است.

### جریان استاندارد

```text
متن مدیر
   ↓
Intent Detection
   ↓
انتخاب Action / Module
   ↓
استخراج فیلدهای قابل تشخیص
   ↓
فقط یک سؤال برای اولین فیلد ضروریِ ناقص
   ↓
Draft
   ↓
پیش‌نمایش کوتاه
   ↓
تأیید مدیر
   ↓
Execute
   ↓
TinyManager Storage
```

### قانون حیاتی

**هیچ Action تغییردهنده‌ای قبل از تأیید مدیر روی Storage اجرا نمی‌شود.**

Tiny AI ابتدا `Draft` تولید می‌کند. Draft داده واقعی نیست و قابل لغو است.

### کمترین ورودی

هر Action باید فقط فیلدهایی را `required` کند که بدون آن‌ها ثبت داده خطرناک یا بی‌معنی می‌شود. فیلدهای اختیاری نباید جلوی عملیات را بگیرند.

مثال:

```text
مدیر: پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن
Tiny AI: پروژه «نمایشگاه» با بودجه ۳۰۰٬۰۰۰٬۰۰۰ تومان — تأیید می‌کنی؟
مدیر: تأیید
Tiny AI: پروژه ثبت شد.
```

اگر اطلاعات ناقص باشد:

```text
مدیر: پروژه انبار جدید ایجاد کن
Tiny AI: مبلغ/بودجه را وارد کن.
مدیر: ۵۰۰ میلیون
Tiny AI: پروژه «انبار جدید» با بودجه ۵۰۰٬۰۰۰٬۰۰۰ تومان — تأیید می‌کنی؟
```

### Provider Architecture

Core به مدل یا شرکت خاصی قفل نیست:

```text
TinyAssistantProvider
├── HTTP AI Provider (optional)
└── Local Interpreter (always available fallback)
```

`VITE_TINY_AI_ENDPOINT` فقط آدرس Endpoint امن را مشخص می‌کند. کلید API مدل نباید در Vite client قرار گیرد.

Endpoint می‌تواند بعداً با Vercel AI SDK، سرویس Self-hosted یا هر LLM Provider دیگری پیاده شود. خروجی Provider همیشه باید Structured باشد و فقط یکی از Actionهای ثبت‌شده TinyManager را انتخاب کند.

### امنیت و کنترل

- AI اجازه نوشتن آزاد در IndexedDB ندارد.
- فقط `TinyAssistantActionDefinition`های ثبت‌شده قابل اجرا هستند.
- Actionهای تغییردهنده به‌صورت پیش‌فرض Confirmation دارند.
- Provider نمی‌تواند نام Action دلخواه اختراع کند.
- اگر confidence کافی نباشد، Local Interpreter یا پیام عدم تشخیص استفاده می‌شود.
- داده فقط از طریق Repository/Storage API هسته ثبت می‌شود.

### Actions فعلی

- `core.project.create`
- `core.module.enable`
- `core.module.disable`
- `core.module.open`

ماژول‌های بعدی Actionهای خود را به همین Registry اضافه خواهند کرد؛ برای مثال:

```text
tiny-risk.create
tiny-delegation.create
tiny-waiting.create
tiny-deadline.create
tiny-raci.assign
```

---

## English

Tiny AI is not intended to be a general-purpose chat screen. It is an orchestration layer that reduces forms, clicks and configuration for managers.

Its flow is: **intent → action/module → extracted fields → one missing-field question → draft → confirmation → execute → storage**.

No mutating action writes to storage before explicit manager confirmation. AI providers are optional and provider-agnostic; a deterministic local interpreter remains available as a fallback. API credentials must never be embedded in the Vite client.
