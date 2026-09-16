# کپی محصول از غرفه باسلام → غرفه کاربر

این سند برای تیم فرانت است. با این API کاربر می‌تواند از **هر غرفه عمومی باسلام** تا سقف مشخصی محصول بردارد و در **غرفه خودش** بسازد.

---

## خلاصه سریع

| مورد | مقدار |
|------|--------|
| Endpoint | `POST /api/products/copy-from-booth` |
| Auth | لازم (همان توکن session فعلی) |
| Body | `{ "booth": "...", "limit": 50 }` |
| مقصد | همیشه غرفه کاربر لاگین‌شده (`basalam_vendor_id`) |
| ≤ ۲۰ محصول | پاسخ sync (نتیجه نهایی) |
| > ۲۰ محصول | صف background + `job_id` |
| سهمیه | متر `import_products` پلن کاربر |

---

## احراز هویت

مثل بقیه APIهای محافظت‌شده، یکی از این‌ها کافی است:

- Header: `Authorization: Bearer <encrypted_token>`
- Header: `X-Encrypted-Token: <encrypted_token>`
- Cookie: `encrypted_token`

```http
POST /api/products/copy-from-booth
Authorization: Bearer <encrypted_token>
Content-Type: application/json
```

اگر توکن نباشد → `401`  
اگر کاربر `basalam_vendor_id` نداشته باشد → `400`

---

## Endpoint اصلی

### `POST /api/products/copy-from-booth`

محصولات یک غرفه عمومی را جمع می‌کند و در غرفه کاربر ایجاد می‌کند.

#### Request body

```json
{
  "booth": "https://basalam.com/abrangplus",
  "limit": 50
}
```

| فیلد | الزامی | توضیح |
|------|--------|--------|
| `booth` | بله | URL یا slug غرفه مبدأ. Aliasها: `vendor`, `url`, `vendorIdentifier`, `vendor_url` |
| `limit` | خیر | حداکثر تعداد محصول برای کپی. پیش‌فرض `100`. Alias: `count` |

نمونه‌های معتبر `booth`:

- `https://basalam.com/abrangplus`
- `abrangplus`

#### رفتار سمت سرور

1. `limit` درخواست با **مانده سهمیه پلن** مقایسه می‌شود → `effectiveLimit = min(limit, remaining)`
2. از سرچ عمومی باسلام تا `effectiveLimit` تا id محصول جمع می‌شود
3. کپی انجام می‌شود:
   - اگر تعداد ≤ ۲۰ → sync
   - اگر تعداد > ۲۰ → job صف (`vendor_copy_queue`)

> نکته UX: اگر کاربر `limit: 100` بزند ولی فقط ۳۰ سهمیه مانده باشد، سرور حداکثر ۳۰ تا کپی می‌کند (یا برای >۲۰ صف می‌کند)، بدون خطای سهمیه — مگر اینکه سهمیه صفر باشد.

---

## پاسخ‌ها

### ۱) Sync (≤ ۲۰ محصول)

```json
{
  "success": true,
  "message": "Booth products copied to your store",
  "mode": "sync",
  "source_booth": "abrangplus",
  "target_vendor_id": "1563824",
  "requested": 15,
  "search_reported_total": 320,
  "total_products_found": 15,
  "products_copied": 14,
  "products_failed": 1,
  "product_ids": [35423357, 37825439],
  "errors": [
    {
      "product_id": 123,
      "error": "...",
      "details": {}
    }
  ],
  "summary": {
    "success_rate": "93.3%",
    "successful_copies": 14,
    "failed_copies": 1
  }
}
```

فرانت باید:

- اگر `products_failed > 0` پیام جزئی نشان دهد (`success` ممکن است `false` باشد حتی اگر بخشی موفق شده)
- لیست `errors` را در UI جزئیات نشان دهد (اختیاری)

### ۲) Async (> ۲۰ محصول)

```json
{
  "success": true,
  "message": "Vendor products copy job created successfully",
  "source_vendor_id": "abrangplus",
  "target_vendor_id": "1563824",
  "total_products": 50,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "note": "Use GET /api/jobs/:jobId/status to check status"
}
```

تشخیص async در فرانت:

```ts
if (response.job_id) {
  // شروع polling
} else {
  // نتیجه sync را نشان بده
}
```

### ۳) غرفه بدون محصول

`404`

```json
{
  "success": false,
  "error": "No products found for this booth",
  "source_booth": "abrangplus",
  "requested": 50
}
```

### ۴) سهمیه تمام شده

`403`

```json
{
  "success": false,
  "error": "QUOTA_EXCEEDED",
  "message": "سهمیه افزودن/ایمپورت محصول این دوره تمام شده است (600/600). برای ادامه پلن خود را ارتقا دهید.",
  "code": "QUOTA_EXCEEDED",
  "quota": {
    "meter": "import_products",
    "used": 600,
    "limit": 600,
    "remaining": 0,
    "plan_id": "monthly"
  }
}
```

### ۵) سرویس سهمیه در دسترس نیست

`503` با `code: "QUOTA_UNAVAILABLE"`

---

## پیگیری job (برای کپی بزرگ)

### `GET /api/jobs/:jobId/status`

Auth لازم است (همان توکن).

```http
GET /api/jobs/550e8400-e29b-41d4-a716-446655440000/status
Authorization: Bearer <encrypted_token>
```

پاسخ نمونه:

```json
{
  "success": true,
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "vendor_copy_products",
    "status": "processing",
    "progress": "12/50",
    "progress_done": 12,
    "progress_total": 50,
    "created_at": "2026-09-16T09:00:00.000Z"
  }
}
```

وقتی `status === "completed"` فیلدهای مفید:

- `summary.successful_copies`
- `summary.failed_copies`
- `summary.success_rate`
- در صورت خطا: `error_summary`

پیشنهاد polling فرانت:

- هر ۲–۳ ثانیه
- توقف وقتی `status` یکی از: `completed` | `failed` | `cancelled`
- نمایش `progress` یا `progress_done / progress_total`

---

## نمایش سهمیه به کاربر

راهنمای کامل و آمادهٔ فرانت:

→ [`docs/usage-quota-frontend.md`](./usage-quota-frontend.md)

خلاصه: از `GET /api/me` بخوانید:

```ts
data.usage.usage.import_products.remaining
```

سقف‌های پیش‌فرض (ممکن است در ادمین تغییر کند): trial ۲۰ / monthly ۶۰۰ / pro ۲۵۰۰ — مشترک بین کپی باسلام و بقیه ایمپورت‌ها.

---

## پیش‌نمایش idها (اختیاری، بدون auth)

اگر قبل از کپی می‌خواهید تعداد/لیست را نشان دهید:

### `GET /api/products/vendor-product-ids?vendor=abrangplus&limit=50`

یا:

### `POST /api/products/vendor-product-ids`

```json
{
  "booth": "https://basalam.com/abrangplus",
  "limit": 50
}
```

پاسخ:

```json
{
  "success": true,
  "vendorIdentifier": "abrangplus",
  "requested": 50,
  "count": 50,
  "searchReportedTotal": 320,
  "productIds": [35423357, 37825439]
}
```

این endpoint فقط لیست می‌دهد؛ کپی نمی‌کند.

---

## فلو پیشنهادی UI

```
1. کاربر URL/slug غرفه مبدأ را وارد می‌کند
2. (اختیاری) GET vendor-product-ids برای پیش‌نمایش تعداد
3. کاربر limit را انتخاب می‌کند (با توجه به usage.import_products.remaining)
4. POST copy-from-booth
5. اگر job_id آمد → progress bar + poll job status
6. اگر sync → toast نتیجه فوری
7. در صورت QUOTA_EXCEEDED → مودال ارتقای پلن
```

نمونه تایپ TypeScript:

```ts
type CopyFromBoothRequest = {
  booth: string;
  limit?: number;
};

type CopyFromBoothSyncResponse = {
  success: boolean;
  mode: 'sync';
  source_booth: string;
  target_vendor_id: string;
  requested: number;
  total_products_found: number;
  products_copied: number;
  products_failed: number;
  product_ids: number[];
  errors?: Array<{ product_id: number | string; error: string }>;
};

type CopyFromBoothAsyncResponse = {
  success: true;
  job_id: string;
  status: 'pending';
  total_products: number;
  source_vendor_id: string;
  target_vendor_id: string;
};

type CopyFromBoothResponse =
  | CopyFromBoothSyncResponse
  | CopyFromBoothAsyncResponse;
```

---

## Endpointهای مرتبط (در صورت نیاز)

| Endpoint | کاربرد |
|----------|--------|
| `POST /api/product/:product_id/copy` | کپی یک محصول تکی به غرفه کاربر |
| `POST /api/products/copy-selected` | کپی لیست idهای مشخص (نیاز به `targetVendorId` + `targetVendorToken`) |
| `POST /api/products/copy-vendor-products` | کپی کامل vendor→vendor با توکن مبدأ و مقصد |

برای سناریوی «از هر غرفه عمومی باسلام تا سقف X» همان **`copy-from-booth`** کافی است.

---

## خطاهای رایج

| Status | معنی | کار فرانت |
|--------|------|-----------|
| `400` | `booth` خالی / `limit` نامعتبر / vendor روی یوزر نیست | validation پیام |
| `401` | توکن نیست/نامعتبر | ریدایرکت لاگین |
| `403` | سهمیه تمام | ارتقای پلن |
| `404` | غرفه محصولی ندارد / job پیدا نشد | پیام واضح |
| `503` | Redis یا سرویس سهمیه | «بعداً دوباره» / کاهش limit |

---

## نکات مهم برای فرانت

1. مقصد را از کاربر نگیرید؛ سرور خودش غرفه لاگین‌شده را استفاده می‌کند.
2. برای batch بزرگ حتماً `job_id` را هندل کنید؛ منتظر sync طولانی نمانید.
3. سهمیه را از `/api/me` بخوانید و قبل از کال محدودیت UI بگذارید.
4. `limit` پیش‌فرض سرور ۱۰۰ است؛ بهتر است در UI صریح ست شود.
5. سقف سخت جمع‌آوری از سرچ عمومی حدود ۱۰٬۰۰۰ است.
