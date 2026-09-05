# TinyManager UX Principles

## فارسی

TinyManager برای مدیر ساخته می‌شود، نه برای اپراتوری که تمام روز با فرم‌ها کار می‌کند. بنابراین ماژول‌ها باید این قواعد را رعایت کنند.

### 1. یک کار، یک صفحه ساده

هر صفحه باید یک هدف مدیریتی روشن داشته باشد. از ترکیب چند Workflow نامرتبط در یک فرم خودداری شود.

### 2. Progressive Disclosure

فقط اطلاعات ضروری ابتدا نمایش داده شود. جزئیات حرفه‌ای، تنظیمات و فیلدهای اختیاری بعد از نیاز کاربر باز شوند.

### 3. One Question at a Time

اگر سیستم برای ادامه به اطلاعات بیشتری نیاز دارد، در هر مرحله فقط مهم‌ترین فیلد ناقص را سؤال کند.

### 4. Sensible Defaults

TinyManager باید تا حد امن Default مناسب پیشنهاد کند؛ مدیر نباید برای هر عملیات مجبور به انتخاب وضعیت، دسته، رنگ، Owner و تنظیمات متعدد باشد.

### 5. AI-first, Form-second

فرم‌ها باقی می‌مانند، اما مسیر سریع اصلی باید Tiny AI باشد. مدیر بتواند با زبان طبیعی Action را شروع کند و فرم فقط برای اصلاح یا جزئیات بیشتر استفاده شود.

### 6. Confirmation before Mutation

هر عملیات ایجاد، حذف، تغییر وضعیت یا تغییر داده مهم باید ابتدا Preview کوتاه نشان دهد و بعد از تأیید اجرا شود.

### 7. Shared Data, No Duplicate Entry

People، Projects، Teams، Tags و سایر Entityهای مشترک فقط یک بار در Core ثبت شوند. هیچ ماژولی نباید مدیر را مجبور کند همان اطلاعات را دوباره وارد کند.

### 8. Smart Module Routing

مدیر لازم نیست بداند یک درخواست متعلق به کدام ماژول است. Tiny AI باید Action مناسب را تشخیص دهد و در صورت اطمینان پایین صریحاً اعلام کند که چه چیزی را نفهمیده است.

### 9. No Configuration Wall

اولین اجرای یک ماژول نباید Wizard طولانی داشته باشد. ماژول باید با کمترین Setup قابل استفاده باشد و تنظیمات پیشرفته اختیاری باشند.

### 10. Fast Exit

مدیر باید بتواند هر مرحله را با یک دکمه لغو کند و مطمئن باشد Draft ناقص چیزی را در داده واقعی تغییر نداده است.

---

## English

TinyManager is designed for managers, not full-time form operators. Every module must follow progressive disclosure, one-question-at-a-time collection, sensible defaults, shared core entities, confirmation before mutation, AI-first routing and minimal setup.
