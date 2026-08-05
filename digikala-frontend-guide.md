# راهنمای فرانت — ایمپورت و سینک دیجی‌کالا در پیوندیار

## خلاصه برای UI

وقتی فروشنده از دیجی‌کالا ایمپورت می‌کند:

1. محصول در **غرفه باسلام** ساخته می‌شود.
2. یک **لینک** Digikala ↔ Basalam داخل **پیوندیار** ذخیره می‌شود.
3. با API لیست لینک‌ها، همان محصولات ایمپورت‌شده را در UI پیوندیار می‌بیند.
4. بعداً می‌تواند **قیمت / موجودی** را از دیجی‌کالا سینک کند (نام و عکس و … سینک نمی‌شوند).

همه endpointها نیاز به هدر احراز هویت دارند:

```http
X-Encrypted-Token: <token>
Content-Type: application/json
```

---

## فلو پیشنهادی UI

```text
۱) تک‌محصول
   URL محصول دیجی‌کالا
   → (اختیاری) Preview
   → Publish
   → محصول در باسلام + لینک در پیوندیار

۲) غرفه seller دیجی‌کالا
   URL غرفه (مثل /seller/DCVJG/)
   → Preview کاتالوگ
   → انتخاب محصولات (یا همه)
   → Import
   → اگر ≤۵ محصول: پاسخ sync
   → اگر >۵ محصول: job_id بگیر و poll وضعیت

۳) صفحه «محصولات دیجی‌کالا»
   GET /api/products/digikala/links
   → روی هر ردیف دکمه «سینک»
   → بالای لیست دکمه «سینک همه»
   → انتخاب نوع سینک: قیمت / موجودی / هر دو
```

---

## ۱) تک‌محصول — Preview

`POST /api/products/ingest/digikala`

محصول را **نمی‌سازد**؛ فقط مپینگ و پیش‌نمایش را برمی‌گرداند.

```json
{
  "url": "https://www.digikala.com/product/dkp-8500838/",
  "category_id": 1132,
  "stock": 5,
  "upload_media": true,
  "include_video": false,
  "variant_id": "31048400"
}
```

| فیلد | الزامی | توضیح |
|------|--------|--------|
| `url` | بله | لینک محصول یا dkp |
| `category_id` | خیر | دسته برگ باسلام؛ اگر نباشد auto-map |
| `stock` | خیر | موجودی اولیه (پیش‌فرض `1`) |
| `upload_media` | خیر | پیش‌فرض `true` |
| `include_video` | خیر | پیش‌فرض `false` |
| `variant_id` | خیر | وریانت خاص دیجی‌کالا |

---

## ۲) تک‌محصول — Publish (ساخت واقعی)

`POST /api/products/ingest/digikala/publish`

همان body بالا. محصول در غرفه ساخته می‌شود و لینک در پیوندیار ذخیره می‌شود.

پاسخ موفق تقریباً شامل این‌هاست:

- `created: true`
- `product_id` / محصول ساخته‌شده
- لینک سینک (اگر ذخیره شده باشد)

برای publish، `upload_media` باید `true` بماند؛ بدون عکس معتبر، ساخت fail می‌شود.

---

## ۳) کاتالوگ فروشنده — Preview

`POST /api/products/ingest/digikala/seller`

چیزی منتشر نمی‌کند؛ فقط لیست/کارت‌های preview + `product_ids` را می‌دهد.

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "preview_limit": 20,
  "only_marketable": true,
  "limit": 200
}
```

پاسخ مهم:

| فیلد | کاربرد UI |
|------|-----------|
| `product_count` | تعداد کل پیدا‌شده |
| `preview` | کارت‌های نمایش |
| `product_ids` | برای انتخاب subset در import |
| `seller_code` / `seller_url` | نمایش منبع |

---

## ۴) کاتالوگ فروشنده — Import

`POST /api/products/ingest/digikala/seller/import`

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "limit": 50,
  "skip_existing": true,
  "only_marketable": true,
  "upload_media": true,
  "include_video": false,
  "product_ids": [8500838, 1234567],
  "category_id": 1132
}
```

| فیلد | پیش‌فرض | توضیح |
|------|---------|--------|
| `url` | — | الزامی |
| `limit` | `200` | حداکثر `500` |
| `skip_existing` | `true` | محصولات قبلاً لینک‌شده همین کاربر رد می‌شوند |
| `only_marketable` | `true` | فقط قابل‌فروش |
| `product_ids` | — | اگر بفرستی فقط همین‌ها ایمپورت می‌شوند |
| `stock` | — | اگر بفرستی موجودی ثابت؛ وگرنه از `marketable_stock` دیجی‌کالا |
| `upload_media` | `true` | باید `true` باشد |

### رفتار sync / async

| تعداد محصولات برای ایمپورت | رفتار |
|----------------------------|--------|
| ≤ ۵ | پاسخ همان لحظه (sync) |
| > ۵ | `job_id` برمی‌گردد؛ با job status پیگیری کن |

اگر چیزی برای ایمپورت نماند (همه قبلاً لینک شده‌اند):

- `404`
- `error: No Digikala products left to import`
- `skipped_existing` در پاسخ

---

## ۵) پیگیری Job (ایمپورت بزرگ)

`GET /api/jobs/:jobId/status`

بعد از import async، `job_id` را poll کنید تا `completed` / `failed` شود و نتیجه را نشان دهید.

---

## ۶) لیست محصولات ایمپورت‌شده در پیوندیار

`GET /api/products/digikala/links?limit=100&offset=0`

فقط لینک‌های **همان کاربر لاگین‌شده**.

نمونه فیلدهای هر آیتم:

| فیلد | معنی |
|------|------|
| `id` | `link_id` برای sync تک‌آیتم |
| `digikala_product_id` | شناسه محصول دیجی‌کالا |
| `basalam_product_id` | شناسه محصول در غرفه باسلام |
| `digikala_title` / `external_title` | عنوان |
| `source_url` | لینک منبع |
| `last_digikala_price` / `last_basalam_price` | آخرین قیمت‌ها |
| `last_digikala_stock` / `last_basalam_stock` | آخرین موجودی‌ها |
| `last_synced_at` | آخرین سینک موفق |
| `last_error` | خطای آخر (اگر باشد) |
| `digikala_seller_code` | برای sync موجودی مهم است |
| `source` | معمولاً `digikala` |
| `destination` | معمولاً `basalam` |

این همان API است که صفحه «محصولاتی که از دیجی‌کالا آوردم» باید صدا بزند.

---

## ۷) سینک قیمت / موجودی — پیاده‌سازی کامل برای فرانت

هدف: کاربر در صفحه لینک‌های دیجی‌کالا بتواند روی هر محصول **سینک** بزند، یا همه را یکجا سینک کند.

### Endpoint

```http
POST /api/products/digikala/sync
X-Encrypted-Token: <token>
Content-Type: application/json
```

### چه چیزی سینک می‌شود؟

| فیلد | سینک؟ |
|------|--------|
| قیمت (`primary_price`) | بله |
| موجودی (`stock`) | بله |
| نام، عکس، توضیح، دسته، attribute، variant | **خیر** |

| مقدار `fields` | معنی |
|----------------|------|
| `"price"` | فقط قیمت (پیش‌فرض اگر نفرستی) |
| `"stock"` | فقط موجودی |
| `"all"` | قیمت + موجودی |
| `["price","stock"]` | همان `"all"` |

---

### ۷.۱ — UI پیشنهادی صفحه لینک‌ها

**بالای لیست (toolbar):**

1. انتخابگر نوع سینک (segment / select):
   - قیمت
   - موجودی
   - قیمت + موجودی (پیشنهاد پیش‌فرض UI: `all`)
2. دکمه **«سینک همه»**
3. بعد از کلیک → loading روی دکمه تا پاسخ بیاید → toast نتیجه → refresh لیست

**روی هر ردیف:**

1. دکمه **«سینک»** (آیکون refresh)
2. روی کلیک → همان `fields` انتخاب‌شده از toolbar را بفرست
3. loading فقط روی همان ردیف
4. toast نتیجه → refresh همان ردیف / کل لیست

**نمایش کمکی روی ردیف:**

- اگر `last_error` پر بود → badge قرمز «خطای سینک»
- اگر `digikala_seller_code` خالی بود و کاربر `stock`/`all` زد → قبل از درخواست هشدار بده که موجودی ممکن است fail شود (قیمت معمولاً اوکی است)
- `last_synced_at` را به‌صورت relative نشان بده («۵ دقیقه پیش»)

---

### ۷.۲ — سینک یک محصول (دکمه روی ردیف)

ترجیحاً با `link_id` از همان لیست (`links[].id`):

```json
{
  "link_id": 12,
  "fields": "all"
}
```

جایگزین (اگر `link_id` نداشتی):

```json
{
  "basalam_product_id": 50355963,
  "fields": "all"
}
```

نمونه fetch:

```js
await fetch('/api/products/digikala/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Encrypted-Token': token
  },
  body: JSON.stringify({
    link_id: row.id,
    fields: selectedFields // 'price' | 'stock' | 'all'
  })
});
```

#### پاسخ موفق تک‌آیتم (نمونه شکل)

```json
{
  "success": true,
  "message": "Basalam updated from Digikala (price, stock)",
  "fields": ["price", "stock"],
  "price_changed": true,
  "stock_changed": false,
  "basalam_updated": true,
  "patched_fields": ["primary_price"]
}
```

یا اگر تغییری نبود:

```json
{
  "success": true,
  "message": "Already up to date — no Basalam change needed",
  "basalam_updated": false,
  "price_changed": false,
  "stock_changed": false
}
```

#### رفتار toast پیشنهادی

| شرط | متن UI |
|------|--------|
| `basalam_updated === true` | «به‌روزرسانی شد» + چه فیلدهایی (`price_changed` / `stock_changed`) |
| `basalam_updated === false` | «قبلاً به‌روز بود؛ تغییری لازم نبود» |
| خطا | متن `error` از پاسخ |

---

### ۷.۳ — سینک همه محصولات کاربر (دکمه بالای لیست)

Body خالی = همه لینک‌های همین کاربر، فقط قیمت:

```json
{}
```

یا صریح:

```json
{
  "fields": "all"
}
```

```js
await fetch('/api/products/digikala/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Encrypted-Token': token
  },
  body: JSON.stringify({ fields: selectedFields })
});
```

> مهم: اگر `link_id` یا `basalam_product_id` نفرستی، یعنی **سینک همه**.  
> اگر یکی از آن‌ها را بفرستی، یعنی **سینک تک**.

سینک همه روی سرور پشت‌سرهم اجرا می‌شود (با فاصله کوتاه بین آیتم‌ها). برای تعداد زیاد ممکن است چند ثانیه طول بکشد — دکمه را disable کن و spinner نشان بده.

#### پاسخ batch (شکل کلی)

```json
{
  "success": true,
  "mode": "batch",
  "fields": ["price", "stock"],
  "total": 20,
  "updated": 7,
  "unchanged": 11,
  "failed": 2,
  "results": [
    {
      "success": true,
      "link_id": 12,
      "basalam_updated": true,
      "price_changed": true,
      "stock_changed": false
    },
    {
      "success": false,
      "link_id": 15,
      "error": "..."
    }
  ]
}
```

#### toast پیشنهادی بعد از سینک همه

```text
سینک تمام شد: N به‌روز شد، M بدون تغییر، K ناموفق
```

اگر `failed > 0`، لیست را refresh کن تا `last_error` روی ردیف‌های خراب دیده شود.

---

### ۷.۴ — mapping دکمه → API (کپی برای فرانت)

| اکشن UI | Body |
|---------|------|
| سینک ردیف — فقط قیمت | `{ "link_id": <id>, "fields": "price" }` |
| سینک ردیف — فقط موجودی | `{ "link_id": <id>, "fields": "stock" }` |
| سینک ردیف — هر دو | `{ "link_id": <id>, "fields": "all" }` |
| سینک همه — فقط قیمت | `{ "fields": "price" }` یا `{}` |
| سینک همه — فقط موجودی | `{ "fields": "stock" }` |
| سینک همه — هر دو | `{ "fields": "all" }` |

بعد از هر sync موفق یا fail:

1. دوباره `GET /api/products/digikala/links` بزن (یا همان صفحه را invalidate کن)
2. ستون‌های قیمت/موجودی/`last_synced_at`/`last_error` را از پاسخ جدید بگیر

---

### ۷.۵ — Stateهای UI که باید پوشش داده شود

| State | رفتار |
|-------|--------|
| `idle` | دکمه‌ها فعال |
| `syncingOne(linkId)` | فقط همان ردیف spinner؛ بقیه دکمه‌ها اختیاری disable |
| `syncingAll` | همه دکمه‌های سینک disable + overlay/spinner بالای لیست |
| `success` | toast + refresh links |
| `error` | toast خطا؛ ردیف را بعد از refresh برای `last_error` نشان بده |

Confirm dialog اختیاری ولی پیشنهادی برای «سینک همه»:

> قیمت/موجودی همه محصولات لینک‌شده از دیجی‌کالا روی غرفه باسلام به‌روز می‌شود. ادامه می‌دهی؟

---

### ۷.۶ — محدودیت‌ها / نکات

- Scope فقط **کاربر لاگین‌شده** است؛ محصول دیگران برنمی‌گردد و سینک نمی‌شود.
- سینک موجودی به `digikala_seller_code` روی لینک وابسته است؛ اگر خالی بود و `fields` شامل stock بود، ممکن است fail شود.
- سینک خودکار/زمان‌بندی‌شده در این API نیست؛ فقط با کلیک کاربر (دستی).
- Admin endpoint جدا (`POST /api/admin/digikala/sync`) برای فرانت فروشنده نیست — استفاده نکنید.

---

## صفحات پیشنهادی فرانت

1. **افزودن تک‌محصول**  
   اینپوت URL → Preview → تأیید → Publish → toast موفقیت + لینک به لیست

2. **افزودن از غرفه seller**  
   اینپوت URL غرفه → Preview لیست → multi-select (از `product_ids`) → Import → اگر job بود progress bar

3. **محصولات دیجی‌کالا (لینک‌ها) + سینک**  
   - لود لیست از `GET /api/products/digikala/links`
   - ستون‌ها: عنوان، قیمت DK/Basalam، موجودی DK/Basalam، آخرین سینک، خطا
   - toolbar: انتخاب `fields` + دکمه «سینک همه»
   - هر ردیف: دکمه «سینک» → `POST /api/products/digikala/sync` با `link_id`
   - لینک بیرونی به صفحه دیجی‌کالا (`source_url`) و محصول باسلام (`basalam_product_id`)

---

## خطاهای رایج

| وضعیت | کجا | معنی پیشنهادی برای UI |
|-------|-----|------------------------|
| `401` | همه | توکن نامعتبر / لاگین مجدد |
| `400` | import / sync | ورودی ناقص یا نامعتبر |
| `404` | import | چیزی برای ایمپورت نمانده |
| `404` | sync تک | لینک پیدا نشد (مال این کاربر نیست یا حذف شده) |
| `502` | import / sync | خطای upstream دیجی‌کالا یا باسلام |
| `503` | import بزرگ | صف Redis در دسترس نیست |

---

## نکته مهم محصولی

- ایمپورت = محصول واقعی در غرفه باسلام + رکورد لینک در پیوندیار
- لیست پیوندیار = `GET /api/products/digikala/links` (نه کاتالوگ خام دیجی‌کالا)
- سینک = با دکمه روی ردیف یا «سینک همه»، فقط قیمت و/یا موجودی را از دیجی‌کالا روی باسلام می‌نویسد
- برای آپدیت کامل محتوا (نام/عکس/…) فعلاً مسیر جداگانه‌ای نیست
