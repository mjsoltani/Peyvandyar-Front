# فرانت: مارک‌آپ قیمت دیجی‌کالا → باسلام (per غرفه)

سند پیاده‌سازی برای تیم فرانت. بک‌اند روی `main` آماده است.

## خلاصه محصول

مشتری روی **غرفه باسلام خودش** یک درصد افزایش قیمت ست می‌کند (مثلاً ۵۰٪).

- موقع **ایمپورت** از دیجی‌کالا: قیمت باسلام = قیمت دیجی × `(1 + درصد/100)`
- موقع **سینک بعدی** (دکمه سینک): دوباره قیمت **فعلی** دیجی خوانده می‌شود و **همان درصد ذخیره‌شده** اعمال می‌شود
- لازم نیست هر بار درصد را دوباره بفرستد

مثال: دیجی `100000` تومان + مارک‌آپ `50` → باسلام `150000`

---

## APIها

Base: `https://api.peyvand-yar.ir`  
Auth: همان `EncryptedToken` فعلی محصول.

### 1) ست / خواندن قانون غرفه (مستقیم)

#### خواندن

```http
GET /api/products/digikala/sync-rule
```

پاسخ نمونه:

```json
{
  "success": true,
  "vendor_id": 123456,
  "source": "digikala",
  "destination": "basalam",
  "price_markup_percent": 50,
  "rule": {
    "id": 1,
    "user_id": 10,
    "vendor_id": 123456,
    "source": "digikala",
    "destination": "basalam",
    "price_markup_percent": 50,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

اگر هنوز ست نشده باشد → `price_markup_percent: 0` و `rule: null`.

#### ذخیره

```http
PUT /api/products/digikala/sync-rule
Content-Type: application/json

{
  "price_markup_percent": 50
}
```

محدوده مجاز: `-99` تا `1000`  
نمونه نام‌های معادل در body: `price_markup_percent` | `priceMarkupPercent` | `markup_percent`

---

### 2) ایمپورت فروشگاه دیجی (همان اندپوینت قبلی + فیلد جدید)

```http
POST /api/products/ingest/digikala/seller/import
```

```json
{
  "url": "https://www.digikala.com/seller/5A52N/",
  "skip_existing": true,
  "speed": "fast",
  "price_markup_percent": 50
}
```

رفتار:

| حالت | رفتار |
|---|---|
| `price_markup_percent` فرستاده شود | روی این ایمپورت اعمال + برای غرفه **persist** می‌شود |
| فیلد را نفرستد | از rule ذخیره‌شده غرفه استفاده می‌کند (پیش‌فرض `0`) |

در پاسخ async/sync معمولاً `price_markup_percent` هم برمی‌گردد تا UI همان لحظه نشان دهد چه درصدی اعمال شده.

---

### 3) سینک بعدی — بدون فرستادن درصد

```http
POST /api/products/digikala/sync
Content-Type: application/json

{
  "fields": "price"
}
```

یا تک‌محصول:

```json
{ "basalam_product_id": 56649623, "fields": "price" }
```

بک‌اند خودش rule غرفه را می‌خواند. در پاسخ تک‌سینک می‌توانی این‌ها را ببینی:

```json
{
  "price_markup_percent": 50,
  "pricing": {
    "digikala_selling_toman": 100000,
    "new_basalam_price": 150000,
    "price_markup_percent": 50,
    "previous_basalam_price": 140000
  }
}
```

Listing delta sync هم همان rule را اعمال می‌کند.

---

## پیشنهاد UI

### جای کنترل

روی صفحه ایمپورت دیجی‌کالا / تنظیمات غرفه:

- لیبل: «افزایش قیمت نسبت به دیجی‌کالا (%)»
- Input عددی (مثلاً `0` تا `500`)
- توضیح کوتاه: «هر بار که سینک کنید، قیمت باسلام از روی قیمت فعلی دیجی با این درصد محاسبه می‌شود.»

### فلو پیشنهادی

1. صفحه را باز کرد → `GET /sync-rule` → مقدار فعلی را در input نشان بده
2. کاربر درصد را عوض کرد (اختیاری):
   - یا همان لحظه `PUT /sync-rule`
   - یا فقط موقع زدن ایمپورت داخل body `import` بفرست (هر دو درست است؛ PUT شفاف‌تر است)
3. ایمپورت → `price_markup_percent` را در body بفرست اگر کاربر عوض کرده
4. دکمه سینک بعدی → فقط `fields: "price"`؛ درصد را دوباره نفرست

### نمایش در لیست/جزئیات (اختیاری)

کنار قیمت: «دیجی ۱۰۰٬۰۰۰ → باسلام ۱۵۰٬۰۰۰ (+۵۰٪)»

---

## نکات مهم برای فرانت

1. درصد روی **غرفه باسلام لاگین‌شده** است، نه روی فروشنده دیجی‌کالا.
2. تغییر درصد، محصولات قبلی را فوراً عوض نمی‌کند؛ از **سینک بعدی** به بعد اعمال می‌شود (مگر دوباره import کنند).
3. `0` یعنی بدون افزایش (قیمت ۱:۱ با کف حداقل باسلام).
4. Stock جداست؛ این فیچر فقط قیمت است.

---

## Checklist فرانت

- [x] Input درصد روی صفحه ایمپورت/تنظیمات غرفه
- [x] `GET /api/products/digikala/sync-rule` برای hydrate اولیه
- [x] `PUT` یا ارسال در `import` برای ذخیره
- [x] پاس دادن `price_markup_percent` در `seller/import`
- [x] سینک دستی بدون نیاز به درصد در body
- [x] نمایش درصد اعمال‌شده در پاسخ import/sync (در صورت وجود)
