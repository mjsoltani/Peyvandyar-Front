# راهنمای درگاه پرداخت باسلام - تیم فرانت‌اند

## پلن‌های موجود

| plan_id | نام | مبلغ | مدت |
|---------|-----|------|-----|
| `monthly` | اشتراک ماهانه | 300,000 تومان | 30 روز |
| `biweekly` | اشتراک دو هفته‌ای | 200,000 تومان | 15 روز |

---

## فلو کامل

```
۱. کاربر روی "خرید" کلیک می‌کنه و پلن رو انتخاب می‌کنه
۲. فرانت → POST /api/payment/create با plan_id → بکند
۳. بکند → pay_url برمی‌گردونه
۴. فرانت → کاربر رو به pay_url redirect می‌کنه
۵. کاربر پرداخت می‌کنه → باسلام → بکند (https://peyvandyar.amintvk.ir/api/payment/callback)
۶. بکند وضعیت رو ذخیره می‌کنه و اشتراک رو extend می‌کنه
۷. بکند → redirect به /payment/result?status=...&hash_id=...
۸. فرانت → GET /api/payment/verify برای تایید نهایی
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
  "plan_id": "monthly",
  "callback_url": "https://peyvandyar.amintvk.ir/api/payment/callback"
}
```

**نکات مهم:** 
- `plan_id` اجباری است و باید یکی از مقادیر `monthly` یا `biweekly` باشد
- `callback_url` اختیاری است. اگر ارسال نشود، بکند از URL پیش‌فرض استفاده می‌کند
- **مبلغ را از فرانت نفرستید** — بکند خودش بر اساس `plan_id` تعیین می‌کند

> مبلغ به ریال — ۳۰۰,۰۰۰ تومان = ۳,۰۰۰,۰۰۰ ریال

Response:
```json
{
  "success": true,
  "hash_id": "abc123",
  "pay_url": "https://apps.basalam.com/pay/abc123",
  "reference_id": "ORDER-xxx",
  "plan_id": "monthly",
  "expired_at": "2026-05-15T12:33:00Z",
  "amount": 3000000,
  "total_amount": 3450000
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

**فلو:**
1. باسلام → `https://peyvandyar.amintvk.ir/api/payment/callback` (بکند)
2. بکند پرداخت رو verify می‌کنه
3. بکند اشتراک کاربر رو extend می‌کنه (اگر موفق بود)
4. بکند کاربر رو به فرانت redirect می‌کنه: `/payment/result?status=...&hash_id=...`

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
  "reference_id": "ORDER-xxx",
  "amount": 3000000,
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
  // نمایش پیام موفقیت + اشتراک فعال شده
} else {
  // نمایش پیام خطا + دکمه تلاش مجدد
}
```

---

## نمونه کد ایجاد پرداخت

```typescript
import { paymentApi } from "@/lib/api";

// انتخاب پلن توسط کاربر
const selectedPlan = "monthly"; // یا "biweekly"

// ایجاد پرداخت
const response = await paymentApi.createPayment({
  plan_id: selectedPlan,
});

if (response.success && response.pay_url) {
  // redirect به درگاه پرداخت
  window.location.href = response.pay_url;
} else {
  // نمایش خطا
  alert(response.error || "خطا در ایجاد پرداخت");
}
```

---

## نکات مهم

- هرگز بر اساس `status` توی URL تصمیم نگیر — فقط جواب `/api/payment/verify` معتبره
- `hash_id` رو نگه دار برای پیگیری
- اگه `expired_at` گذشته بود، باید دوباره `/api/payment/create` بزنی
- بعد از verify موفق، اشتراک کاربر اتوماتیک extend میشه
- اگه کاربر اشتراک فعال داشته باشه، مدت جدید از انتهای اشتراک فعلی اضافه میشه

---

## پلن‌ها در کد

```typescript
// در api.ts
export const paymentApi = {
  plans: {
    monthly: {
      id: "monthly",
      name: "اشتراک ماهانه",
      price: 300000, // تومان
      duration: 30, // روز
    },
    biweekly: {
      id: "biweekly",
      name: "اشتراک دو هفته‌ای",
      price: 200000, // تومان
      duration: 15, // روز
    },
  },
  // ...
};
```
