# ایمپورت غرفه دیجی‌کالا — راهنمای فرانت

این سند برای تیم فرانت است تا UI ایمپورت غرفه دیجی‌کالا به باسلام را به API جدید وصل کند.

## Endpoint

```
POST /api/products/ingest/digikala/seller/import
Authorization: Bearer <encrypted_token>
Content-Type: application/json
```

- ≤۵ کالا: پاسخ **sync** (نتیجه همان درخواست)
- \>۵ کالا: **async** + `job_id` → polling با `GET /api/jobs/{jobId}/status`

---

## پارامترهای جدید (رفتار با کالاهای قبلی)

### `import_mode`

| مقدار | رفتار |
|--------|--------|
| `skip` | **پیش‌فرض.** کالاهایی که قبلاً برای این کاربر لینک دیجی‌کالا↔باسلام دارند **ایمپورت نمی‌شوند**. |
| `duplicate` | همه کالاها (از جمله لینک‌شده‌ها) **به‌صورت محصول جدید** در باسلام ساخته می‌شوند. |
| `replace` | اگر لینک وجود داشته باشد، **همان محصول باسلام** با داده تازه دیجی‌کالا **PATCH** می‌شود. اگر لینک نباشد، مثل ایمپورت عادی **create** می‌شود. |

### سازگاری با API قدیمی

| قدیمی | معادل جدید |
|--------|------------|
| `skip_existing: true` | `import_mode: "skip"` |
| `skip_existing: false` | `import_mode: "duplicate"` |

اگر هر دو `import_mode` و `skip_existing` ارسال شوند، **`import_mode` اولویت دارد**.

---

### `name_suffix` (فقط `duplicate`)

به **انتهای عنوان محصول** اضافه می‌شود.

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "import_mode": "duplicate",
  "name_suffix": " (کپی)"
}
```

عنوان نهایی: `{عنوان دیجی‌کالا} (کپی)`

---

### `sku_suffix` (فقط `duplicate`)

به SKU تولیدشده (`DK-{digikala_product_id}-...`) اضافه می‌شود.

- اگر **نفرستید**: پسوند خودکار ۶ رقمی timestamp
- اگر **بفرستید**: همان مقدار (مثلاً `"v2"`)

```json
{
  "import_mode": "duplicate",
  "sku_suffix": "v2"
}
```

SKU نمونه: `DK-8500838-v2`

---

### `replace_fields` (فقط `replace`)

مشخص می‌کند کدام فیلدهای محصول باسلام از دیجی‌کالا **جایگزین** شوند. پیش‌فرض: `all`.

| مقدار | فیلدهای آپدیت‌شده |
|--------|-------------------|
| `all` | همه فیلدهای قابل نگاشت (عنوان، توضیحات، قیمت، موجودی، عکس، واریانت، …) |
| `price` | فقط `primary_price` |
| `stock` | فقط `stock` |
| `price_stock` | قیمت + موجودی |
| `content` | عنوان، brief، description، keywords، attributes، category، وزن، واریانت‌ها، … |
| `media` | `photo`, `photos`, `video` |
| `["price", "media"]` | ترکیب چند مورد |

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "import_mode": "replace",
  "replace_fields": "all"
}
```

یا فقط قیمت و عکس:

```json
{
  "import_mode": "replace",
  "replace_fields": ["price", "media"]
}
```

---

## نمونه درخواست‌ها

### ۱. ایمپورت اول — skip (پیش‌فرض)

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "import_mode": "skip",
  "speed": "normal",
  "price_markup_percent": 50
}
```

### ۲. ایمپورت مجدد — duplicate با پسوند

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "import_mode": "duplicate",
  "name_suffix": " (نسخه ۲)",
  "sku_suffix": "v2"
}
```

### ۳. به‌روزرسانی کالاهای موجود — replace

```json
{
  "url": "https://www.digikala.com/seller/DCVJG/",
  "import_mode": "replace",
  "replace_fields": "all"
}
```

### ۴. فقط آپدیت قیمت و موجودی کالاهای لینک‌شده

```json
{
  "import_mode": "replace",
  "replace_fields": "price_stock"
}
```

> **نکته:** برای sync دوره‌ای فقط قیمت/موجودی، endpoint سبک‌تر `POST /api/products/digikala/sync` هم وجود دارد.

---

## پاسخ sync (۲۰۰)

```json
{
  "success": true,
  "mode": "sync",
  "import_mode": "replace",
  "import_candidate_count": 12,
  "skipped_existing_count": 0,
  "replace_candidate_count": 8,
  "products_requested": 12,
  "products_imported": 12,
  "products_failed": 0,
  "products_created": 4,
  "products_replaced": 8,
  "products_duplicated": 0,
  "name_suffix": null,
  "sku_suffix": null,
  "replace_fields": ["all"],
  "skipped_existing": [],
  "replace_candidates": [
    {
      "digikala_product_id": 8500838,
      "title": "نام محصول",
      "url": "https://www.digikala.com/product/dkp-8500838/",
      "basalam_product_id": 12345678
    }
  ],
  "imported": [
    {
      "success": true,
      "action": "replaced",
      "import_mode": "replace",
      "digikala_product_id": 8500838,
      "basalam_product_id": 12345678,
      "replaced_fields": ["name", "primary_price", "stock", "photo"],
      "stock": 5
    }
  ],
  "summary": {
    "success_rate": "100.0%",
    "successful_imports": 12,
    "failed_imports": 0
  }
}
```

### فیلد `action` در هر آیتم `imported`

| `action` | معنی |
|----------|------|
| `created` | محصول جدید ساخته شد (لینک قبلی نداشت) |
| `replaced` | محصول لینک‌شده PATCH شد |
| `duplicated` | محصول جدید ساخته شد در حالی که لینk قبلی وجود داشت |

---

## پاسخ async (۲۰۰ — job صف شد)

```json
{
  "success": true,
  "mode": "async",
  "job_id": "uuid",
  "status": "pending",
  "import_mode": "duplicate",
  "name_suffix": " (کپی)",
  "sku_suffix": "v2",
  "replace_fields": ["all"],
  "note": "Use GET /api/jobs/:jobId/status to check progress"
}
```

نتیجه نهایی در `results` همان job status است (ساختار مشابه پاسخ sync).

---

## خطاهای رایج

| HTTP | شرایط |
|------|--------|
| `400` | `import_mode` نامعتبر، `replace_fields` خالی/نامعتبر، `upload_media=false` |
| `404` | در حالت `skip` همه کالاها قبلاً لینک شده‌اند |
| `503` | Redis در دسترس نیست و batch بزرگ است |

---

## پیشنهاد UI

```
┌─────────────────────────────────────────┐
│  کالاهای قبلاً ایمپورت‌شده:            │
│  ○ رد شوند (skip)          [پیش‌فرض]   │
│  ○ دوباره اضافه شوند (duplicate)       │
│     └─ پسوند نام: [________]           │
│     └─ پسوند SKU:  [________] (اختیاری)│
│  ○ جایگزین شوند (replace)              │
│     └─ فیلدها: [همه ▼]                 │
└─────────────────────────────────────────┘
```

- در **preview** (`POST /api/products/ingest/digikala/seller`) می‌توانید تعداد کل غرفه را نشان دهید.
- برای نمایش کالاهای لینک‌شده: `GET /api/products/digikala/links`
- markup غرفه: `GET/PUT /api/products/digikala/sync-rule`

---

## Changelog

| تاریخ | تغییر |
|--------|--------|
| 2026-09-02 | اضافه شد: `import_mode`, `name_suffix`, `sku_suffix`, `replace_fields` |
