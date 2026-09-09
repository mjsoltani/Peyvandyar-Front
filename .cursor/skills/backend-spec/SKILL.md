---
name: backend-spec
description: >-
  Places a backend-team markdown spec into docs/guides/<domain>/ then implements
  it in the frontend immediately. Use when the user invokes this skill and
  attaches or names an MD spec, or says to follow the backend-spec flow for a
  new .md file.
disable-model-invocation: true
---

# Backend spec → docs → پیاده‌سازی

وقتی این skill صدا زده شد و یک فایل `.md` (مشخصات بک‌اند) داده شد، **بدون پرسیدن «پیاده کنم؟»** همین فلو را تا آخر اجرا کن. کامیت/پوش نکن مگر کاربر جداگانه بخواهد.

## فلو (همیشه به همین ترتیب)

```
Task Progress:
- [ ] ۱. خواندن spec
- [ ] ۲. تشخیص دامنه و انتقال به docs
- [ ] ۳. به‌روز کردن ایندکس docs
- [ ] ۴. پیاده‌سازی طبق spec
- [ ] ۵. خلاصه برای کاربر
```

### ۱. خواندن spec

فایل MD را کامل بخوان. مخاطب، endpointها، فیلدها، خطاها، اولویت (P0/P1/P2)، چیزهایی که **نباید** در UI بیاید، و چک‌لیست فرانت را استخراج کن.

اگر فایل در ریشهٔ ریپو است، آن را آنجا نگذار — ریشه `*.md` را gitignore می‌کند (به‌جز `README.md`).

### ۲. تشخیص دامنه و انتقال به docs

دامنه را از عنوان/کلمات spec حدس بزن و فایل را **کپی/انتقال** کن به مسیر مربوط، با نامی پایدار (معمولاً همان نام فایل):

| سیگنال در spec | مسیر |
|---|---|
| دیجی‌کالا، seller import، digikala | `docs/guides/digikala/` |
| پرداخت، پلن، قیمت، subscription catalog | `docs/guides/payment/` |
| ادمین، superadmin، `/admin` | `docs/guides/admin/` |
| mixin | `docs/guides/mixin/` |
| شبکه اجتماعی، social | `docs/guides/social/` |
| کپی محصول، چندفروشگاهی | `docs/guides/products/` |
| معماری / ریفکتور | `docs/architecture/` |
| استقرار / ops | `docs/ops/` |

اگر دامنه مشخص نبود: نزدیک‌ترین پوشهٔ موجود در `docs/guides/` را بساز (مثلاً `docs/guides/<domain>/`) و یک `README.md` کوتاه برای همان پوشه بنویس.

بعد از انتقال، فایل MD ریشه را حذف کن.

### ۳. به‌روز کردن ایندکس

- `docs/README.md` — ردیف در جدول همان دامنه
- `docs/guides/<domain>/README.md` — اگر وجود دارد، لینک spec را اضافه کن

محتوای spec را بازنویسی نکن؛ همان متن بک‌اند را نگه دار.

### ۴. پیاده‌سازی

کد فعلی همان فیچر را پیدا کن (API در `src/lib/api.ts`، صفحات `src/app/`، کامپوننت‌های مرتبط). طبق spec **جایگزین یا تکمیل** کن، نه یک مسیر موازی قدیمی.

قوانین این ریپو:

- درخواست‌های لاگین‌دار: `apiRequest` با هدر `X-Encrypted-Token` — base: `https://api.peyvand-yar.ir/api`
- endpoint عمومی بدون لاگین: fetch جدا (مثل `publicApiRequest`)؛ `apiRequest` بدون توکن fail می‌شود
- ادمین فقط `role === "superadmin"` از `GET /api/user/status` (نه `/api/me`). روت‌ها زیر `/admin`
- UI را با الگوی موجود هم‌رنگ کن (DashboardLayout، نارنجی/slate، تاریخ شمسی فقط در نمایش)
- اگر spec می‌گوید قیمت/مقدار را hard-code نکن، از API بخوان
- چیزی که جدول «نیاوری» / «بدون API» است را نساز
- P0 را کامل بساز؛ P1 را هم اگر در همین spec آمده پیاده کن؛ P2 فقط اگر ساده و داخل همان سند است
- سازگاری با API قدیمی فقط اگر spec معادل ذکر کرده

بعد از کد: typecheck/lint فایل‌های لمس‌شده. اگر ابزار مرورگر بود، فلو اصلی را چک کن؛ وگرنه در خلاصه بگو چه چیزی را نتوانستی در مرورگر تست کنی.

### ۵. خلاصه برای کاربر

به فارسی، کوتاه:

- مسیر نهایی spec در docs
- صفحات/endpointهای وصل‌شده
- اگر کامیت نخواسته، پیشنهاد نده که خودت کامیت کنی مگر بپرسد

## این skill چه کاری نمی‌کند

- کامیت یا پوش خودکار
- تغییر قرارداد API از طرف فرانت
- گذاشتن MD در ریشهٔ ریپو
