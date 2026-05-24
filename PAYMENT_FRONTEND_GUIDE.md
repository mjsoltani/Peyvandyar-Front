# راهنمای درگاه پرداخت باسلام - فرانت‌اند

## فلو کلی

```
فرانت → POST /api/payment/create → بکند → باسلام
باسلام → pay_url → بکند → فرانت → redirect کاربر
کاربر پرداخت می‌کنه → باسلام → callback بکند → فرانت
```

---

## مرحله ۱ - ایجاد پیش‌تراکنش

**Endpoint:** `POST /api/payment/create`

**Headers:**
```
X-Encrypted-Token: <توکن کاربر>
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 500000,
  "description": "خرید اشتراک ماهانه"
}
```

> مبلغ به **ریال** است — ۵۰۰۰۰۰ ریال = ۵۰۰۰۰ تومان

**Response موفق:**
```json
{
  "success": true,
  "hash_id": "a1b2c3d4e5f6",
  "pay_url": "https://apps.basalam.com/pay/a1b2c3d4e5f6",
  "reference_id": "ORDER-1716000000000-AB12C",
  "expired_at": "2026-05-15T12:33:00Z",
  "amount": 500000,
  "total_amount": 505000
}
```

**کار فرانت:** کاربر را به `pay_url` redirect کن.

```js
const res = await fetch('/api/payment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Encrypted-Token': userToken
  },
  body: JSON.stringify({ amount: 500000, description: 'خرید اشتراک ماهانه' })
});

const data = await res.json();
if (data.success) {
  window.location.href = data.pay_url; // redirect به درگاه
}
```

---

## مرحله ۲ - بعد از پرداخت (Callback)

باسلام کاربر را به این آدرس برمی‌گرداند:

```
https://peyvandyar.amintvk.ir/api/payment/callback?status=success&hash_id=a1b2c3d4e5f6
```

بکند این callback را دریافت می‌کند و نتیجه را برمی‌گرداند.

**پارامترهای callback:**

| پارامتر | مقدار احتمالی | توضیح |
|---------|--------------|-------|
| status | `success` | پرداخت موفق |
| status | `failed` | پرداخت ناموفق |
| status | `unverified` | وضعیت نامشخص |
| hash_id | string | شناسه تراکنش |

> **مهم:** بعد از دریافت `status=success`، بکند باید تراکنش را verify کند. فرانت نباید صرفاً بر اساس status اشتراک را فعال نشان دهد.

---

## نکات مهم

- `X-Encrypted-Token` را هرگز در localStorage ذخیره نکن — از httpOnly cookie استفاده کن
- `amount` همیشه به ریال است
- `expired_at` را نگه دار — اگه لینک منقضی شد باید دوباره create کنی
- `hash_id` را ذخیره کن برای پیگیری تراکنش
