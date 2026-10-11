# انتقال و همگام‌سازی محصولات باسلام → میکسین (راهنمای فرانت)

کاربر غرفه‌ی خودش در باسلام را به فروشگاه میکسین خودش وصل می‌کند. بک‌اند همه‌ی محصولات غرفه را می‌خواند و در میکسین می‌سازد. بعد از آن قیمت و موجودی را همگام نگه می‌دارد. می‌شود همگام‌سازی را دستی زد یا خودکار گذاشت.

## احراز هویت

همه‌ی درخواست‌ها مثل بقیه‌ی پنل با توکن رمز‌شده‌ی کاربر فرستاده می‌شوند. هر کدام از این روش‌ها کار می‌کند:

- کوکی `encrypted_token`
- هدر `X-Encrypted-Token: <token>`
- هدر `Authorization: Bearer <token>`

همه‌ی پاسخ‌های خطا این شکل را دارند:

```json
{ "success": false, "error": "پیام خطا", "details": { } }
```

---

## جریان کلی صفحه

1. **اتصال میکسین** (اندپوینت‌ها از قبل وجود داشتند): اول با `GET /api/products/mixin/connection` چک کن کاربر وصل هست یا نه. اگر نبود، فرم آدرس فروشگاه و کلید API را نشان بده و `POST /api/products/mixin/connect` را صدا بزن.
2. **دکمه‌ی «انتقال همه‌ی محصولات به میکسین»** که `POST /api/products/mixin/export` را صدا می‌زند و یک job برمی‌گرداند. job را poll کن و نوار پیشرفت نشان بده.
3. **جدول محصولات منتقل‌شده** از `GET /api/products/mixin/export/links`.
4. **دکمه‌ی «به‌روزرسانی قیمت و موجودی»** که `POST /api/products/mixin/export/sync` را صدا می‌زند.
5. **تنظیمات**: سوییچ «همگام‌سازی خودکار» و انتخاب دسته‌بندی پیش‌فرض، با `PUT /api/products/mixin/export/settings`.

> ⚠️ کلید API میکسین باید **دسترسی نوشتن** (ساخت و ویرایش محصول) داشته باشد. اگر نداشته باشد، انتقال با خطای 401 و پیام «کلید API میکسین اجازهٔ ساخت محصول ندارد…» متوقف می‌شود. این پیام را به کاربر نشان بده و راهنمایی کن که کلید جدید بسازد.

---

## 1) اتصال میکسین (موجود از قبل)

### `GET /api/products/mixin/connection`

اگر کاربر وصل نباشد 404 برمی‌گردد. اگر وصل باشد:

```json
{
  "success": true,
  "connection": {
    "id": 3,
    "shop_url": "https://myshop.mixin.ir",
    "shop_name": "فروشگاه من",
    "is_active": true,
    "last_error": null,
    "export_auto_sync": false,
    "export_category_id": null,
    "last_validated_at": "2026-10-10T10:00:00.000Z"
  }
}
```

فیلدهای `export_auto_sync` و `export_category_id` جدید هستند. از آن‌ها برای مقدار اولیه‌ی تنظیمات استفاده کن.

### `POST /api/products/mixin/connect`

```json
{ "shop_url": "https://myshop.mixin.ir", "api_key": "xxxx" }
```

### `DELETE /api/products/mixin/connection`

اتصال را قطع می‌کند.

---

## 2) شروع انتقال — `POST /api/products/mixin/export`

همه‌ی فیلدهای بدنه اختیاری‌اند:

| فیلد | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `product_ids` | `number[]` | – | اگر خالی باشد **کل غرفه** منتقل می‌شود. اگر پر باشد فقط همین محصولات. |
| `include_images` | `boolean` | `true` | عکس‌ها هم آپلود شوند. |
| `category_id` | `number` | تنظیمات کاربر | شناسه‌ی دسته‌بندی میکسین. اگر نباشد، دسته‌بندی از روی اسم دسته‌ی باسلام پیدا می‌شود. |
| `create_missing` | `boolean` | `true` | محصولی که در میکسین نیست ساخته شود. |
| `max_products` | `number` | `5000` | سقف تعداد محصول (حداکثر ۵۰۰۰). |

دو حالت پاسخ داریم:

**الف) حداکثر ۵ محصول در `product_ids`:** کار همان لحظه انجام می‌شود و پاسخ 200 برمی‌گردد.

```json
{
  "mode": "inline",
  "success": true,
  "shop_url": "https://myshop.mixin.ir",
  "vendor_id": "123456",
  "price_divisor": 10,
  "summary": { "total": 2, "created": 1, "updated": 1, "linked_existing": 0, "skipped": 0, "failed": 0 },
  "items": [
    { "basalam_product_id": "57025569", "mixin_product_id": 812, "action": "created", "images_uploaded": 3 },
    { "basalam_product_id": "57025570", "mixin_product_id": 790, "action": "updated" }
  ]
}
```

**ب) کل غرفه یا بیشتر از ۵ محصول:** کار در صف می‌رود و پاسخ 202 برمی‌گردد.

```json
{
  "success": true,
  "mode": "queued",
  "message": "انتقال محصولات باسلام به میکسین در صف قرار گرفت",
  "job_id": "5b0c…",
  "status_url": "/api/jobs/5b0c…/status"
}
```

فرانت باید فیلد `mode` را چک کند و فقط در حالت `queued` سراغ poll برود.

### poll کردن job: `GET /api/jobs/:job_id/status`

هر ۲ تا ۳ ثانیه صدا بزن تا `job.status` برابر `completed` یا `failed` شود.

```json
{
  "success": true,
  "job": {
    "id": "5b0c…",
    "type": "mixin_export",
    "status": "processing",
    "progress": "42/310",
    "progress_done": 42,
    "progress_total": 310,
    "progress_percent": 13.5,
    "current_product": "57025569",
    "summary": { "total": 310, "created": 30, "updated": 8, "linked_existing": 2, "skipped": 1, "failed": 1 }
  }
}
```

- مقدار `status` یکی از این‌هاست: `pending`، `processing`، `completed`، `failed`.
- وقتی `completed` شد، نتیجه‌ی کامل در `job.results` است و شکلش مثل پاسخ حالت inline است (`summary` و `items`).
- وقتی `failed` شد، پیام خطا در `job.error` است.
- اگر `job.results.summary.aborted === true` بود، انتقال وسط کار قطع شده (معمولاً به‌خاطر کلید نامعتبر یا کلید بدون دسترسی نوشتن). دلیلش در `job.results.summary.abort_reason` است و باید به کاربر نشان داده شود.
- فیلد `items` فقط بخشی از محصولات را دارد، ولی محصولات ناموفق همیشه در آن هستند. برای نمایش کامل از اندپوینت links استفاده کن.

### معنی `action` در هر آیتم

| action | متن پیشنهادی |
|---|---|
| `created` | در میکسین ساخته شد |
| `updated` | به‌روزرسانی شد |
| `linked_existing` | محصول از قبل در میکسین بود و وصل شد |
| `skipped` | رد شد (دلیل در `reason`) |
| `failed` | خطا (پیام در `error` و جزئیات در `details`) |

مقادیر `reason` برای حالت `skipped`:

| reason | متن پیشنهادی |
|---|---|
| `imported_from_mixin` | این محصول خودش از میکسین آمده؛ برای جلوگیری از چرخه منتقل نمی‌شود |
| `not_your_product` | محصول متعلق به غرفه‌ی شما نیست |
| `not_linked` | هنوز به میکسین منتقل نشده (فقط در sync) |

فیلدهای اختیاری هر آیتم:

- `images_uploaded`: تعداد عکس‌های آپلودشده.
- `images_failed`: عکس‌هایی که آپلود نشدند.
- `unmatched_variants`: تعداد تنوع‌هایی در میکسین که معادلشان در باسلام پیدا نشد. اگر بیشتر از صفر بود، یک هشدار کوچک نشان بده.

---

## 3) همگام‌سازی قیمت و موجودی — `POST /api/products/mixin/export/sync`

فقط محصولاتی را به‌روز می‌کند که قبلاً منتقل شده‌اند. محصول جدید نمی‌سازد و عکس هم آپلود نمی‌کند.

| فیلد | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `product_ids` | `number[]` | – | اگر خالی باشد همه‌ی محصولات لینک‌شده. |
| `mode` | `"stock_price"` یا `"full"` | `stock_price` | مقدار `full` اسم و توضیحات را هم به‌روز می‌کند. |

پاسخ این اندپوینت دقیقاً همان دو حالت `inline` و `queued` بالا را دارد.

---

## 4) لیست محصولات منتقل‌شده — `GET /api/products/mixin/export/links?limit=100&offset=0`

- مقدار `limit` حداکثر ۵۰۰ است.
- مرتب‌سازی بر اساس آخرین تغییر است.

```json
{
  "success": true,
  "total": 310,
  "with_errors": 3,
  "links": [
    {
      "id": 1,
      "basalam_product_id": "57025569",
      "mixin_product_id": "812",
      "basalam_title": "پیراهن مردانه راه راه سبز کد 6",
      "last_price": 1100000,
      "last_stock": 12,
      "last_available": true,
      "last_synced_at": "2026-10-10T10:20:00.000Z",
      "last_error": null,
      "last_error_details": null,
      "created_at": "…",
      "updated_at": "…"
    }
  ]
}
```

پیشنهاد ستون‌های جدول:

- عنوان
- قیمت در میکسین (به تومان)
- موجودی
- وضعیت (موجود یا ناموجود)
- آخرین همگام‌سازی
- خطا: اگر `last_error` پر بود، ردیف را قرمز کن و `last_error` را در tooltip نشان بده.

لینک‌ها:

- محصول باسلام: `https://basalam.com/p/{basalam_product_id}`
- محصول میکسین: `{shop_url}/product/{mixin_product_id}` (آدرس `shop_url` از connection می‌آید)

شمارنده‌ی `with_errors` را می‌شود به‌صورت badge کنار عنوان صفحه نشان داد.

---

## 5) تنظیمات — `PUT /api/products/mixin/export/settings`

```json
{ "auto_sync": true, "category_id": 45 }
```

- هر دو فیلد اختیاری‌اند و فقط فیلدی که فرستاده شود عوض می‌شود. برای پاک کردن دسته‌بندی، `category_id: null` بفرست.
- وقتی `auto_sync: true` باشد، بک‌اند وب‌هوک باسلام را هم ثبت می‌کند. از آن به بعد هر تغییر محصول در باسلام (قیمت، موجودی، وضعیت و…) خودکار روی میکسین اعمال می‌شود.
- اگر ثبت وب‌هوک شکست بخورد، پاسخ **502** با پیام «ثبت وب‌هوک باسلام ناموفق بود؛ سینک خودکار فعال نشد» برمی‌گردد. در این حالت سوییچ را به حالت خاموش برگردان.

پاسخ:

```json
{
  "success": true,
  "connection": { "...": "...", "export_auto_sync": true, "export_category_id": 45 },
  "webhook": { "registered": true, "already_exists": false }
}
```

> همگام‌سازی خودکار فقط روی محصولاتی کار می‌کند که حداقل یک بار منتقل شده‌اند. پس بعد از روشن کردنش، اگر کاربر هنوز انتقال اولیه را نزده، به او پیشنهاد بده این کار را بکند.

---

## نکته‌های UI

- **واحد قیمت:** قیمت‌های باسلام ریال‌اند و در میکسین تومان ذخیره می‌شوند (تقسیم بر `price_divisor` که الان ۱۰ است). در جدول links، فیلد `last_price` به تومان است.
- **مدت زمان:** انتقال کل غرفه ممکن است چند دقیقه طول بکشد. هر محصول، به‌خاطر آپلود عکس و محدودیت نرخ درخواست میکسین، حدود ۱ تا ۳ ثانیه زمان می‌برد. پس نوار پیشرفت لازم است و کاربر می‌تواند صفحه را ببندد. اگر `job_id` را در `localStorage` نگه داری، با برگشتن کاربر می‌شود دوباره poll کرد.
- **تکرار امن است:** اگر کاربر دوباره دکمه‌ی انتقال را بزند، محصول تکراری ساخته نمی‌شود. محصولاتی که قبلاً منتقل شده‌اند فقط به‌روز می‌شوند.
- **خطاهای رایج:**
  - `400` با پیام `No active Mixin connection…`: کاربر را به فرم اتصال میکسین بفرست.
  - `400` با پیام «غرفه‌ای برای این حساب باسلام پیدا نشد»: کاربر غرفه ندارد.
  - `401` از طرف میکسین: کلید API نامعتبر است یا دسترسی نوشتن ندارد.
