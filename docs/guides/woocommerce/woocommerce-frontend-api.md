# ووکامرس → باسلام — راهنمای فرانت

ایمپورت محصولات یک فروشگاه ووکامرس/وردپرس به غرفه باسلامِ کاربر لاگین‌شده.

فرانت فقط با API پیوندیار حرف می‌زند. توکن باسلام، Consumer Secret و عکس محصول از مرورگر به OpenAPI باسلام یا به فروشگاه ووکامرس فرستاده نمی‌شود. بک‌اند توکن باسلام را از همان نشست OAuth کاربر دارد.

پایه: `https://api.peyvand-yar.ir/api`

ساخت محصول در باسلام، سمت بک‌اند، با OpenAPI خود باسلام:

| کار | متد و مسیر |
|---|---|
| آپلود عکس | `POST https://openapi.basalam.com/v1/files` با `file_type=product.photo` |
| ساخت محصول | `POST https://openapi.basalam.com/v1/vendors/{vendor_id}/products` |
| برگه‌های دسته | `GET https://openapi.basalam.com/v1/categories` |
| ویژگی دسته | `GET https://openapi.basalam.com/v1/categories/{category_id}/attributes` |
| وضعیت غرفه | `GET https://openapi.basalam.com/v1/users/me` |

---

## احراز هویت

مثل بقیه APIهای پنل:

| روش | مقدار |
|---|---|
| Header | `X-Encrypted-Token: <token>` |
| Header | `Authorization: Bearer <token>` |
| Cookie | `encrypted_token` |

بدون توکن → `401`. اشتراک منقضی → `403`.

کلید ووکامرس را بعد از connect در پاسخ برنگردانید.

---

## فلو UI

```
۱) اتصال
   GET  /api/products/woocommerce/connection
   اگر connected=false → فرم shop_url و در صورت نیاز consumer_key + consumer_secret
   POST /api/products/woocommerce/connect

۲) دسته‌بندی باسلام
   GET /api/products/woocommerce/categories?search=
   GET /api/products/woocommerce/categories/{category_id}/attributes

۳) کاتالوگ
   GET /api/products/woocommerce/products?page=1&page_size=20

۴) ایمپورت
   POST /api/products/ingest/woocommerce/catalog/import
   اگر 202 و mode=import_queued → poll
   GET /api/jobs/{job_id}/status
```

قطع اتصال: `DELETE /api/products/woocommerce/connection`  
لینک محصولات قبلی پاک نمی‌شود.

اگر غرفه باسلام فعال نباشد، connect و import هر دو `409` با `code: VENDOR_INACTIVE` می‌دهند. UI همان `error` را نشان می‌دهد و ایمپورت را شروع نمی‌کند. محصولات روی غرفه غیرفعال ساخته می‌شوند و باسلام آن‌ها را با دلیل «غرفه غیرفعال است» رد می‌کند؛ از صف تأیید می‌روند.

---

## خطاهای مشترک

```json
{
  "success": false,
  "error": "غرفه باسلام غیرفعال است. بعد از فعال شدن غرفه دوباره ایمپورت کنید.",
  "code": "VENDOR_INACTIVE",
  "details": null
}
```

| HTTP | `code` | معنی برای UI |
|---|---|---|
| `400` | | ورودی ناقص، یا اتصال ووکامرس نیست |
| `401` | | توکن پنل یا کلید ووکامرس رد شده |
| `403` | | اشتراک اجازه API ندارد |
| `409` | `VENDOR_INACTIVE` | غرفه باسلام غیرفعال است؛ ایمپورت نکنید |
| `502` | | ووکامرس یا باسلام در دسترس نیست |
| `503` | | صف در دسترس نیست و تعداد محصول زیاد است |

اگر `error` شامل `No active WooCommerce connection` بود، کاربر را به فرم اتصال برگردانید.

---

## ۱) وضعیت اتصال

`GET /api/products/woocommerce/connection`

```json
{
  "success": true,
  "connected": true,
  "connection": {
    "id": 1,
    "user_id": 12,
    "vendor_id": 1659297,
    "vendor_title": "ولدینو",
    "vendor_identifier": "weldino",
    "vendor_active": true,
    "shop_url": "https://weldparsiansanat.ir",
    "currency_code": "IRT",
    "source": "store",
    "last_validated_at": "2026-10-29T08:00:00.000Z",
    "last_error": null,
    "is_active": true
  }
}
```

- `connected: false` و `connection: null` یعنی هنوز وصل نشده.
- `source` برابر `store` یعنی بدون کلید از Store API خوانده می‌شود؛ `v3` یعنی با Consumer Key.
- `consumer_key` و `consumer_secret` هرگز برنمی‌گردند.
- اگر `vendor_active` برابر `false` است، بنر `VENDOR_INACTIVE` را نشان دهید حتی اگر اتصال فروشگاه ذخیره شده باشد.
- اگر `last_error` پر بود، بنر هشدار نشان دهید.

---

## ۲) اتصال

`POST /api/products/woocommerce/connect`

```json
{
  "shop_url": "https://weldparsiansanat.ir",
  "consumer_key": "",
  "consumer_secret": ""
}
```

Aliasهای قابل قبول: `shopUrl`، `consumerKey`، `consumerSecret`. ترجیح: snake_case.

`shop_url` می‌تواند بدون `https://` باشد. بک‌اند آن را به origin نرمال می‌کند.

کلیدها اختیاری‌اند. اگر هر دو خالی باشند، کاتالوگ از API عمومی خوانده می‌شود:

`GET {origin}/wp-json/wc/store/v1/products`

اگر هر دو پر باشند، از API مدیریتی:

`GET {origin}/wp-json/wc/v3/products`

با `consumer_key` و `consumer_secret`. یکی بدون دیگری → `400`.

قبل از ذخیره، بک‌اند باید غرفه را از `GET /v1/users/me` بخواند. اگر `vendor.is_active` برابر `false` باشد یا وضعیت غرفه غیرفعال (`2988`) باشد، اتصال فروشگاه را ذخیره نکنید و `409` / `VENDOR_INACTIVE` برگردانید.

آدرس فروشگاه فقط `http` یا `https` و میزبان عمومی باشد. IP خصوصی، localhost و ریدایرکت به دامنه دیگر رد شود.

**موفق**

```json
{
  "success": true,
  "message": "WooCommerce connection saved",
  "connection": { }
}
```

اتصال جدید برای همان کاربر جایگزین اتصال قبلی می‌شود.

---

## ۳) قطع اتصال

`DELETE /api/products/woocommerce/connection`

```json
{ "success": true, "message": "WooCommerce connection removed" }
```

---

## ۴) کاتالوگ

`GET /api/products/woocommerce/products?page=1&page_size=20&search=`

بدون اتصال فعال → `400`.

`page_size` حداکثر `100`. قیمت‌ها در پاسخ به **تومان** هستند.

```json
{
  "success": true,
  "page": 1,
  "page_size": 20,
  "total": 556,
  "total_pages": 28,
  "currency_code": "IRT",
  "products": [
    {
      "id": 21085,
      "name": "مانومتر اکسیژن طرح جنرال برند تاپ گاز مدل OR58",
      "sku": "OR58",
      "price_toman": 4600000,
      "in_stock": true,
      "image_url": "https://weldparsiansanat.ir/wp-content/uploads/...",
      "has_variations": false,
      "permalink": "https://weldparsiansanat.ir/product/..."
    }
  ]
}
```

محصول بدون قیمت معتبر در لیست می‌ماند و `price_toman` برابر `null` است. ایمپورت همان را رد می‌کند.

محصول متغیر یک ردیف است؛ ایمپورت آن را محصول ساده می‌سازد و قیمت نمایشی را می‌فرستد.

تبدیل قیمت:

| ارز ووکامرس | `primary_price` باسلام |
|---|---|
| `IRT` | همان مبلغ، بعد از تقسیم بر `10^minor_unit` در Store API |
| `IRR` | مبلغ ریال تقسیم بر ۱۰ (تومان) |

Store API مبلغ را در واحد خرد برمی‌گرداند. REST v3 مبلغ را در واحد اصلی و به صورت رشته برمی‌گرداند.

---

## ۵) دسته‌بندی باسلام

`GET /api/products/woocommerce/categories?search=جوش`

فقط برگ‌های درخت دسته. جستجو روی مسیر عنوان است. حداکثر ۵۰ نتیجه.

```json
{
  "success": true,
  "categories": [
    {
      "id": 693,
      "title": "ابزار جوشکاری",
      "path": "ابزارآلات و تجهیزات خودرو / تاسیسات / ابزار جوشکاری"
    }
  ]
}
```

`search` خالی → ۲۰ برگ اول، نه کل درخت.

---

## ۶) ویژگی‌های دسته

`GET /api/products/woocommerce/categories/693/attributes`

```json
{
  "success": true,
  "attributes": [
    {
      "id": 1751,
      "title": "برند",
      "required": false,
      "unit": null,
      "options": []
    }
  ]
}
```

اگر `options` پر باشد UI انتخابی است و مقدار ارسالی `selected_values` است. وگرنه متن آزاد در `value`.

ویژگی `required: true` بدون مقدار → ایمپورت `400` می‌دهد.

---

## ۷) ایمپورت کاتالوگ

`POST /api/products/ingest/woocommerce/catalog/import`

```json
{
  "product_ids": [21085, 21074],
  "category_id": 693,
  "status": 2976,
  "preparation_days": 2,
  "package_weight": 600,
  "default_stock": 5,
  "skip_existing": true,
  "only_priced": true,
  "product_attribute": [
    { "attribute_id": 1751, "value": "تاپ گاز" }
  ]
}
```

| فیلد | پیش‌فرض | توضیح |
|---|---|---|
| `product_ids` | — | اگر نباشد، کل کاتالوگ متصل. اگر باشد فقط همین شناسه‌های ووکامرس |
| `category_id` | — | اجباری. باید برگ باشد |
| `status` | `2976` | `2976` منتشر شده، `3790` منتشر نشده. پیش‌فرض را `3790` نگذارید |
| `preparation_days` | `2` | بین ۱ و ۳۰. مهلت طولانی می‌تواند غرفه را در باسلام غیرفعال کند |
| `package_weight` | `600` | گرم. باید **بزرگ‌تر** از وزن کالا باشد، نه مساوی |
| `default_stock` | `5` | وقتی ووکامرس تعداد موجودی ندهد و کالا موجود باشد |
| `skip_existing` | `true` | sku برابر `wc-{id}` که قبلاً لینک شده رد شود |
| `only_priced` | `true` | `price_toman` خالی یا صفر ایمپورت نشود |
| `product_attribute` | `[]` | ویژگی اجباری دسته |

### بدنه ساخت هر محصول در OpenAPI باسلام

```json
{
  "name": "مانومتر اکسیژن طرح جنرال برند تاپ گاز مدل OR58",
  "photo": 464914437,
  "photos": [464914437],
  "brief": "توضیح کوتاه بدون شماره تلفن",
  "description": "توضیح محصول بدون شماره تلفن",
  "category_id": 693,
  "status": 2976,
  "preparation_days": 2,
  "weight": 500,
  "package_weight": 600,
  "primary_price": 4600000,
  "stock": 5,
  "sku": "wc-21085",
  "is_wholesale": false
}
```

قواعدی که بدون آن‌ها باسلام محصول را رد می‌کند یا اصلاً نمی‌سازد:

1. **غرفه غیرفعال.** اگر `vendor.is_active` برابر `false` است، هیچ محصولی نسازید. دلیل رد باسلام، کد `7094`، این متن است: «محصول شما به دلیل غیر فعال بودن غرفه بررسی نشد.» وضعیت محصول بعد از رد `3567` (تایید نشده) می‌شود و از غرفه می‌رود.
2. **وزن بسته.** `package_weight` باید از `weight` بزرگ‌تر باشد. خطای `422`: «وزن با بسته بندی نمی تواند کمتر یا مساوی از وزن محصول باشد.» اگر ووکامرس وزن ندارد، `weight=500` و `package_weight` حداقل `600`. اگر وزن ووکامرس (کیلوگرم × ۱۰۰۰) از بسته بزرگ‌تر شد، بسته را یک گرم بیشتر از وزن بگذارید.
3. **شماره تماس در متن.** باسلام `422` می‌دهد اگر توضیح شماره تلفن داشته باشد. رقم‌های پشت‌سرهم و عبارت «شماره تلفن/تماس» را از `brief` و `description` حذف کنید. توضیح را از `short_description` و بعد `description` ووکامرس بگیرید و HTML را به متن ساده تبدیل کنید. اگر چیزی نماند، از نام محصول استفاده کنید.
4. **نام تکراری.** `422` با «نام کالا تکراری است». یک بار با پسوند ` wc-{woocommerce_id}` دوباره بسازید.
5. **قیمت.** `primary_price` به تومان است، نه ریال. قیمت صفر را نسازید.
6. **عکس.** حداقل یک عکس از همان دامنه فروشگاه. بدون عکس محصول را نسازید. آپلود را یک بار در صورت timeout تکرار کنید.
7. **sku.** `wc-{woocommerce_id}` تا ایمپورت بعدی تکراری را بشناسد.

پاسخ ساخت باسلام ممکن است لحظه‌ای `status.name = در انتظار تایید` (`3568`) باشد. روی غرفه فعال، خواندن مجدد محصول باید به `در دسترس` (`2976`) و `is_showable: true` برسد. این را خطای ایمپورت حساب نکنید.

### پاسخ‌ها

**الف) چیزی برای ایمپورت نبود** (`200`)

```json
{
  "success": true,
  "mode": "import",
  "message": "Nothing to import",
  "products_requested": 0,
  "products_imported": 0,
  "skipped_unpriced": [21081],
  "skipped_existing": [21085]
}
```

**ب) تعداد ≤ ۵ — همزمان** (`200`, `mode: import_sync`)

```json
{
  "success": true,
  "mode": "import_sync",
  "products_requested": 3,
  "products_imported": 2,
  "products_failed": 1,
  "items": [
    {
      "woocommerce_product_id": 21085,
      "success": true,
      "basalam_product_id": 65089927,
      "name": "مانومتر اکسیژن طرح جنرال برند تاپ گاز مدل OR58"
    },
    {
      "woocommerce_product_id": 21081,
      "success": false,
      "error": "قیمت ندارد"
    }
  ]
}
```

**ج) تعداد > ۵ — صف** (`202`, `mode: import_queued`)

```json
{
  "success": true,
  "mode": "import_queued",
  "message": "Queued 40 WooCommerce products for import",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "products_queued": 40,
  "status_url": "/api/jobs/550e8400-e29b-41d4-a716-446655440000/status"
}
```

### Poll

`GET /api/jobs/{job_id}/status` هر ۲ تا ۳ ثانیه تا `completed` یا `failed`.

```json
{
  "success": true,
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "woocommerce_catalog_import",
    "status": "processing",
    "progress": "3/40",
    "current_product": "مانومتر اکسیژن",
    "results": null
  }
}
```

بعد از اتمام، `job.results` همان شکل `import_sync` را دارد (`products_imported`، `products_failed`، `items`).

| `job.status` | UI |
|---|---|
| `pending` | در صف |
| `processing` | `progress` مثل `3/40` و نام `current_product` |
| `completed` | خلاصه نتایج |
| `failed` | `job.error` |

---

## ۸) لینک‌ها

`GET /api/products/woocommerce/links?limit=100&offset=0`

```json
{
  "success": true,
  "count": 1,
  "links": [
    {
      "id": 44,
      "woocommerce_product_id": "21085",
      "basalam_product_id": 65089927,
      "name": "مانومتر اکسیژن طرح جنرال برند تاپ گاز مدل OR58",
      "shop_url": "https://weldparsiansanat.ir",
      "last_error": null
    }
  ]
}
```

فرانت این لیست را در نسخه اول نشان نمی‌دهد. بک‌اند برای `skip_existing` نگهش می‌دارد.

---

## چیزی که فرانت نمی‌فرستد

- توکن دسترسی باسلام یا JWT خام
- فایل تصویر
- بدنه خام `CreateProductSchema`

این‌ها فقط سمت بک‌اند و OpenAPI باسلام هستند.
