# راهنمای درگاه پرداخت باسلام - تیم فرانت‌اند

## فلو کامل

```
۱. کاربر روی "خرید" کلیک می‌کنه
۲. فرانت → POST /api/payment/create → بکند
۳. بکند → pay_url برمی‌گردونه
۴. فرانت → کاربر رو به pay_url redirect می‌کنه
۵. کاربر پرداخت می‌کنه → باسلام → بکند (callback)
۶. بکند وضعیت رو ذخیره می‌کنه → redirect به /payment/result
۷. فرانت → GET /api/payment/verify برای تایید نهایی
```

---

## API ها

### ۱. ایجاد پرداخت
**POST** `/api/payment/create`

Headers:
```
X-Encrypted-Token: <توکن کاربر>
Content-Type: application/json
```

Body:
```json
{
  "amount": 500000,
  "description": "خرید اشتراک ماهانه"
}
```

> مبلغ به ریال — ۵۰۰۰۰۰ ریال = ۵۰۰۰۰ تومان

Response:
```json
{
  "success": true,
  "hash_id": "abc123",
  "pay_url": "https://apps.basalam.com/pay/abc123",
  "reference_id": "ORDER-xxx",
  "expired_at": "2026-05-15T12:33:00Z",
  "amount": 500000,
  "total_amount": 575000
}
```

بعد از دریافت response، کاربر رو به `pay_url` redirect کن:
```js
window.location.href = data.pay_url;
```

---

### ۲. صفحه نتیجه پرداخت
بکند بعد از callback باسلام، کاربر رو به این آدرس redirect می‌کنه:
```
https://peyvand-yar.ir/payment/result?status=success&hash_id=abc123
```

یه صفحه `/payment/result` بساز که:
- `status` و `hash_id` رو از URL بخونه
- **بلافاصله** verify بزنه (به URL اعتماد نکن)

---

### ۳. تایید پرداخت
**GET** `/api/payment/verify?hash_id=abc123`

Headers:
```
X-Encrypted-Token: <توکن کاربر>
```

Response:
```json
{
  "success": true,
  "status": "success",
  "hash_id": "abc123",
  "amount": 500000,
  "total_amount": 575000,
  "paid_at": "2026-05-15T12:30:00Z"
}
```

مقادیر `status`:
| مقدار | معنی |
|-------|------|
| `pending` | در انتظار پرداخت |
| `success` | پرداخت موفق ✅ |
| `failed` | پرداخت ناموفق ❌ |

---

## نمونه کد صفحه result

```js
// در صفحه /payment/result
const params = new URLSearchParams(window.location.search);
const hashId = params.get('hash_id');

if (!hashId) {
  // نمایش خطا
  return;
}

// verify از بکند (نه از URL)
const res = await fetch(`/api/payment/verify?hash_id=${hashId}`, {
  headers: { 'X-Encrypted-Token': userToken }
});
const data = await res.json();

if (data.status === 'success') {
  // نمایش پیام موفقیت + فعال‌سازی اشتراک در UI
} else {
  // نمایش پیام خطا + دکمه تلاش مجدد
}
```

---

## نکات مهم

- هرگز بر اساس `status` توی URL تصمیم نگیر — فقط جواب `/api/payment/verify` معتبره
- `hash_id` رو نگه دار برای پیگیری
- اگه `expired_at` گذشته بود، باید دوباره `/api/payment/create` بزنی
