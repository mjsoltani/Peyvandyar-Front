# Mixin → باسلام — راهنمای فرانت

ایمپورت محصولات از فروشگاه Mixin به غرفه باسلام فروشنده.

فروشنده فقط **آدرس فروشگاه Mixin** و **API Key** را می‌دهد. بقیه کار (خواندن کاتالوگ، آپلود عکس، ساخت محصول در باسلام، لینک و سینک قیمت/موجودی) سمت بک‌اند است.

Swagger زنده: `GET /api-docs` → تگ **Products - Mixin** و **Products - Ingest**.

---

## احراز هویت

مثل بقیه APIهای پنل. یکی از این‌ها کافی است:

| روش | مقدار |
|---|---|
| Header | `X-Encrypted-Token: <token>` |
| Header | `Authorization: Bearer <token>` |
| Cookie | `encrypted_token` |

بدون توکن → `401`. اشتراک منقضی → `403`.

کلید Mixin را **هرگز در localStorage لاگ نکنید** و بعد از connect دیگر به بک‌اند نفرستید؛ بک‌اند خودش از دیتابیس می‌خواند.

---

## فلو پیشنهادی UI

```
۱) صفحه اتصال
   GET  /api/products/mixin/connection
   اگر connected=false → فرم shop_url + api_key
   POST /api/products/mixin/connect

۲) لیست محصولات Mixin
   GET  /api/products/mixin/products?page=1&page_size=25&search=

۳) یک محصول
   Preview: POST /api/products/ingest/mixin
   Publish: POST /api/products/ingest/mixin/publish

۴) چند محصول / کل کاتالوگ
   POST /api/products/ingest/mixin/catalog/import
   اگر 202 و mode=import_queued → poll وضعیت job

۵) محصولات لینک‌شده + سینک
   GET  /api/products/mixin/links
   POST /api/products/mixin/sync
```

قطع اتصال: `DELETE /api/products/mixin/connection`  
لینک‌های قبلی محصولات پاک نمی‌شوند؛ فقط اتصال غیرفعال می‌شود.

---

## خطاهای مشترک

همه خطاها این شکل را دارند:

```json
{
  "success": false,
  "error": "No active Mixin connection. POST /api/products/mixin/connect first",
  "details": null
}
```

| HTTP | معنی برای UI |
|---|---|
| `400` | ورودی ناقص / اتصال Mixin وجود ندارد |
| `401` | توکن پنل یا API Key میکسین رد شده |
| `403` | اشتراک کاربر اجازه API ندارد |
| `404` | محصول یا لینک پیدا نشد |
| `502` | Mixin یا آپلود عکس باسلام شکست خورد |
| `503` | صف Redis در دسترس نیست و تعداد محصول زیاد است |

اگر `error` شامل `No active Mixin connection` بود، کاربر را به صفحه اتصال ببرید.

---

## ۱) وضعیت اتصال

`GET /api/products/mixin/connection`

**Response**

```json
{
  "success": true,
  "connected": true,
  "connection": {
    "id": 1,
    "user_id": 12,
    "vendor_id": 345,
    "shop_url": "https://myshop.mixin.ir",
    "shop_name": "فروشگاه من",
    "last_validated_at": "2026-08-11T08:00:00.000Z",
    "last_error": null,
    "is_active": true,
    "created_at": "2026-08-11T07:50:00.000Z",
    "updated_at": "2026-08-11T08:00:00.000Z"
  }
}
```

- `connected: false` و `connection: null` یعنی هنوز وصل نشده.
- **`api_key` هرگز برنمی‌گردد.** در UI نشان ندهید.

اگر `last_error` پر بود، یک بنر هشدار نشان دهید (کلید نامعتبر یا فروشگاه در دسترس نیست).

---

## ۲) اتصال

`POST /api/products/mixin/connect`

```json
{
  "shop_url": "https://myshop.mixin.ir",
  "api_key": "xxxxxxxx"
}
```

Aliasهای قابل قبول: `shopUrl` / `url` و `apiKey` / `key`. ترجیح: `shop_url` و `api_key`.

`shop_url` می‌تواند بدون `https://` باشد؛ بک‌اند نرمالایز می‌کند به origin (مثلاً `https://myshop.mixin.ir`).

**موفق**

```json
{
  "success": true,
  "message": "Mixin connection saved and validated",
  "connection": { "...بدون api_key..." },
  "validation": {
    "via": "info",
    "title": "فروشگاه من",
    "version": "4.x"
  }
}
```

`401` یعنی API Key رد شده. پیام واضح: «کلید Mixin معتبر نیست.»

اتصال جدید برای همان کاربر **جایگزین** اتصال قبلی می‌شود (یک اتصال فعال per user).

---

## ۳) قطع اتصال

`DELETE /api/products/mixin/connection`

```json
{
  "success": true,
  "message": "Mixin connection deactivated",
  "connection": { "is_active": false }
}
```

---

## ۴) لیست محصولات فروشگاه Mixin

`GET /api/products/mixin/products`

| Query | پیش‌فرض | توضیح |
|---|---|---|
| `page` | `1` | صفحه |
| `page_size` | `25` | حداکثر سمت Mixin تا ۱۰۰۰؛ UI بهتر است ۲۵–۵۰ بماند |
| `search` | — | جستجو در کاتالوگ Mixin |
| `available` | — | `true` / `false`. اگر نفرستید فیلتر نمی‌شود |

**Response**

```json
{
  "success": true,
  "shop_url": "https://myshop.mixin.ir",
  "status": "success",
  "products": [
    {
      "id": 1042,
      "name": "تیشرت مشکی",
      "price": 250000,
      "stock": 12,
      "available": true,
      "has_variants": false
    }
  ],
  "pagination": {
    "has_next": true
  },
  "message": null
}
```

آیتم‌های `products` همان payload خام Mixin هستند (عکس، واریانت، دسته و … ممکن است همراه باشد). برای کارت لیست حداقل این فیلدها را استفاده کنید:

- `id` → `product_id` در ingest/publish
- `name`
- `price` (تومان)
- `stock`
- `available`
- تصویر اگر در آبجکت بود (معمولاً فیلدهای image/images)

`pagination` را از Mixin پاس می‌دهیم؛ اگر `has_next === true` دکمه صفحه بعد را نشان دهید.

---

## ۵) Preview یک محصول (بدون ساخت در غرفه)

`POST /api/products/ingest/mixin`

```json
{
  "product_id": 1042,
  "category_id": 123,
  "stock": 10,
  "upload_media": false
}
```

| فیلد | اجباری | توضیح |
|---|---|---|
| `product_id` | بله | آیدی محصول Mixin |
| `category_id` | خیر | دسته باسلام. اگر نباشد بک‌اند خودش leaf category مپ می‌کند |
| `stock` | خیر | اگر نباشد از موجودی Mixin استفاده می‌شود |
| `upload_media` | خیر، پیش‌فرض `true` | |

**مهم:** اگر `upload_media: true` باشد، Preview هم عکس را روی باسلام آپلود می‌کند (محصول ساخته نمی‌شود). برای پیش‌نمایش ارزان در UI بگذارید `upload_media: false`.

**Response (خلاصه)**

```json
{
  "success": true,
  "mode": "preview",
  "message": "Mixin preview ready — nothing was published to your booth",
  "created": false,
  "source": {
    "provider": "mixin",
    "product_id": 1042,
    "name": "تیشرت مشکی",
    "available": true,
    "has_variants": false,
    "stock": 12,
    "image_urls": ["https://..."]
  },
  "pricing": {
    "mixin_price_toman": 250000,
    "basalam_primary_price_toman": 250000
  },
  "category_mapping": {},
  "basalam_payload": {
    "name": "تیشرت مشکی",
    "primary_price": 250000,
    "stock": 12,
    "category_id": 123,
    "variants": []
  },
  "notes": []
}
```

در UI می‌توانید نام، قیمت، موجودی، عکس‌ها و واریانت‌های `basalam_payload` را نشان دهید، بعد دکمه «انتشار در باسلام».

---

## ۶) Publish یک محصول

`POST /api/products/ingest/mixin/publish`

Body همان Preview. برای publish واقعی `upload_media` باید `true` بماند (پیش‌فرض). بدون عکس معتبر، بک‌اند `502` می‌دهد.

**Response (خلاصه)**

```json
{
  "success": true,
  "mode": "publish",
  "message": "Mixin product published to your Basalam booth",
  "created": true,
  "product_id": 987654,
  "product": { "id": 987654 },
  "sync_link": {
    "id": 44,
    "mixin_product_id": "1042",
    "basalam_product_id": 987654,
    "source_url": "https://myshop.mixin.ir/api/v4/products/1042/"
  },
  "source": { "product_id": 1042, "name": "تیشرت مشکی" },
  "pricing": {
    "mixin_price_toman": 250000,
    "basalam_primary_price_toman": 250000
  }
}
```

`product_id` = آیدی محصول ساخته‌شده در باسلام. بعد از موفقیت، کاربر را به محصول غرفه یا لیست لینک‌ها ببرید.

این کار ممکن است چند ثانیه طول بکشد (دانلود عکس Mixin + آپلود باسلام + create). روی دکمه loading بگذارید و timeout فرانت را کوتاه نگذارید (حداقل ۶۰ ثانیه).

---

## ۷) Import چند محصول / کاتالوگ

`POST /api/products/ingest/mixin/catalog/import`

```json
{
  "product_ids": [1042, 1043, 1044],
  "category_id": 123,
  "skip_existing": true,
  "only_available": true,
  "use_mixin_stock": true,
  "upload_media": true,
  "limit": 100
}
```

| فیلد | پیش‌فرض | توضیح |
|---|---|---|
| `product_ids` | — | اگر باشد فقط همین‌ها. اگر نباشد از کاتالوگ Mixin می‌خواند |
| `limit` | `200` | سقف کاتالوگ؛ حداکثر `500` |
| `skip_existing` | `true` | محصولاتی که قبلاً لینک شده‌اند رد می‌شوند |
| `only_available` | `true` | فقط موجودها (وقتی `product_ids` نیست) |
| `search` | — | فیلتر کاتالوگ Mixin |
| `category_id` | — | دسته باسلام برای همه |
| `stock` | — | اگر باشد روی همه اعمال می‌شود |
| `use_mixin_stock` | `true` | موجودی از Mixin |
| `upload_media` | `true` | برای catalog **نمی‌تواند false باشد** |

### سه حالت پاسخ — UI باید هر سه را هندل کند

**الف) چیزی برای ایمپورت نبود** (`200`)

```json
{
  "success": true,
  "mode": "import",
  "message": "Nothing to import",
  "products_requested": 0,
  "products_imported": 0,
  "skipped_existing": [1042]
}
```

**ب) تعداد ≤ ۵ — همزمان** (`200`, `mode: import_sync`)

```json
{
  "success": true,
  "mode": "import_sync",
  "shop_url": "https://myshop.mixin.ir",
  "skipped_existing": [],
  "products_requested": 3,
  "products_imported": 2,
  "products_failed": 1,
  "items": [
    { "mixin_product_id": 1042, "success": true, "basalam_product_id": 987654, "name": "تیشرت" },
    { "mixin_product_id": 1043, "success": false, "error": "..." }
  ]
}
```

اگر `success: false` یعنی حداقل یکی fail شده؛ جدول `items` را نشان دهید.

**ج) تعداد > ۵ — صف** (`202`, `mode: import_queued`)

```json
{
  "success": true,
  "mode": "import_queued",
  "message": "Queued 40 Mixin products for import",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "products_queued": 40,
  "skipped_existing": [12],
  "status_url": "/api/jobs/550e8400-e29b-41d4-a716-446655440000/status"
}
```

اگر Redis نباشد و تعداد ≤ ۲۰ باشد ممکن است `mode: import_sync_fallback` با همان شکل sync برگردد. اگر تعداد زیاد باشد `503`.

### Poll وضعیت job

`GET /api/jobs/{job_id}/status`

هر ۲–۳ ثانیه تا `job.status` یکی از `completed` / `failed` شود.

```json
{
  "success": true,
  "job": {
    "id": "550e8400-...",
    "type": "mixin_catalog_import",
    "status": "processing",
    "progress": "3/40",
    "current_product": "1045",
    "created_at": "...",
    "started_at": "...",
    "completed_at": null,
    "results": null
  }
}
```

| `job.status` | UI |
|---|---|
| `pending` | در صف |
| `processing` | در حال ایمپورت — `progress` مثل `3/40` و `current_product` |
| `completed` | تمام — از `job.results` خلاصه بسازید |
| `failed` | خطا — `job.error` |

`progress` ممکن است `null` باشد (بک‌اند گاهی آن را parse می‌کند). در آن صورت از `status` + `current_product` استفاده کنید.

بعد از `completed`:

```json
{
  "job": {
    "status": "completed",
    "results": {
      "products_requested": 40,
      "products_imported": 38,
      "products_failed": 2,
      "skipped_existing": [],
      "items": [
        { "mixin_product_id": 1042, "success": true, "basalam_product_id": 987654, "name": "..." }
      ],
      "summary": { "success_rate": "95.0%" }
    }
  }
}
```

---

## ۸) لینک‌های Mixin ↔ باسلام

`GET /api/products/mixin/links?limit=100&offset=0`

```json
{
  "success": true,
  "count": 1,
  "links": [
    {
      "id": 44,
      "mixin_product_id": "1042",
      "basalam_product_id": 987654,
      "mixin_title": "تیشرت مشکی",
      "last_mixin_price": 250000,
      "last_basalam_price": 250000,
      "last_mixin_stock": 12,
      "last_basalam_stock": 12,
      "last_synced_at": "2026-08-11T08:10:00.000Z",
      "last_error": null,
      "shop_url": "https://myshop.mixin.ir",
      "source_url": "https://myshop.mixin.ir/api/v4/products/1042/"
    }
  ]
}
```

برای جدول: عنوان Mixin، قیمت دو طرف، موجودی دو طرف، آخرین سینک، خطا.

`basalam_product_id` را به صفحه محصول غرفه لینک کنید.

---

## ۹) سینک قیمت / موجودی

فقط **دستی** است؛ کرون خودکار ندارد.

`POST /api/products/mixin/sync`

**یک لینک**

```json
{ "link_id": 44, "fields": "all" }
```

یا با آیدی باسلام:

```json
{ "basalam_product_id": 987654, "fields": "price" }
```

`fields`: `"price"` | `"stock"` | `"all"` (پیش‌فرض `"price"`)

**موفق یک مورد**

```json
{
  "success": true,
  "message": "Basalam updated from Mixin (primary_price, stock)",
  "basalam_updated": true,
  "price_changed": true,
  "stock_changed": true,
  "patched_fields": ["primary_price", "stock"],
  "mixin_product_id": "1042",
  "basalam_product_id": 987654,
  "link_id": 44
}
```

اگر تغییری نباشد: `basalam_updated: false` و پیام «Already up to date».

**همه لینک‌های کاربر** — `link_id` و `basalam_product_id` را نفرستید:

```json
{ "fields": "all" }
```

```json
{
  "success": true,
  "total": 10,
  "updated": 3,
  "unchanged": 6,
  "failed": 1,
  "items": [
    { "link_id": 44, "success": true, "basalam_updated": true, "patched_fields": ["primary_price"] },
    { "link_id": 45, "success": false, "error": "..." }
  ]
}
```

سینک همه لینک‌ها ممکن است طول بکشد (حدود ۳۵۰ms فاصله بین هر محصول). برای لیست بزرگ، دکمه را disable کنید و progress نشان دهید.

---

## نکات UI

1. **اتصال را اول چک کنید.** بقیه endpointها بدون اتصال `400` می‌دهند.
2. **یک اتصال per user.** فرم connect یعنی «ذخیره / جایگزینی کلید».
3. **قیمت Mixin تومان است**؛ تبدیل ارز لازم نیست.
4. **واریانت‌ها** در publish مپ می‌شوند؛ در لیست اگر `has_variants: true` بود badge بزنید.
5. **تکراری:** با `skip_existing: true` (پیش‌فرض) محصول قبلاً ایمپورت‌شده دوباره ساخته نمی‌شود.
6. **جهت فقط Mixin → باسلام است.** برعکس (باسلام به Mixin) وجود ندارد.
7. **فرانت نباید به API خود Mixin درخواست بزند.** فقط همین endpointهای پنل.

---

## چک‌لیست پیاده‌سازی

- [ ] صفحه اتصال: وضعیت، فرم `shop_url` + `api_key`، قطع اتصال
- [ ] لیست محصولات Mixin با pagination و search
- [ ] Preview (با `upload_media: false`) + Publish تکی
- [ ] انتخاب چندتایی → catalog import
- [ ] هندل `import_sync` و `import_queued` + poll job
- [ ] لیست لینک‌ها
- [ ] دکمه سینک یک محصول و سینک همه (`fields: "all"`)
- [ ] خطاهای `401` کلید Mixin و «اتصال وجود ندارد»
