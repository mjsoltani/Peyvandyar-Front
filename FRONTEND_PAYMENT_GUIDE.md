# راهنمای پرداخت برای فرانت‌اند

## پلن‌های موجود

| plan_id | مبلغ | مدت |
|---------|------|-----|
| `monthly` | 300,000 تومان | 30 روز |
| `biweekly` | 200,000 تومان | 15 روز |

---

## فلوی پرداخت

### مرحله ۱ — ساخت پرداخت

```http
POST /api/payment/create
X-Encrypted-Token: {token}
Content-Type: application/json

{
  "plan_id": "monthly",
  "callback_url": "https://peyvandyar.amintvk.ir/api/payment/callback"
}
```

**نکته مهم:** `callback_url` باید آدرس بکند باشه، نه فرانت.

**پاسخ:**
```json
{
  "success": true,
  "hash_id": "...",
  "pay_url": "https://apps.basalam.com/pay/...",
  "reference_id": "ORDER-...",
  "plan_id": "monthly",
  "amount": 3000000,
  "total_amount": 3450000
}
```

### مرحله ۲ — ریدایرکت کاربر

کاربر رو به `pay_url` ریدایرکت کن.

### مرحله ۳ — بازگشت کاربر

بعد از پرداخت، بکند کاربر رو به این آدرس ریدایرکت می‌کنه:

```
https://peyvand-yar.ir/payment/result?status=success&hash_id=xxx
https://peyvand-yar.ir/payment/result?status=failed&hash_id=xxx
```

### مرحله ۴ — بررسی وضعیت نهایی

```http
GET /api/payment/verify?hash_id={hash_id}
X-Encrypted-Token: {token}
```

**پاسخ موفق:**
```json
{
  "success": true,
  "status": "success",
  "hash_id": "...",
  "reference_id": "ORDER-...",
  "amount": 3000000,
  "paid_at": "2026-05-29T..."
}
```

---

## نکات مهم

- مبلغ رو از فرانت نفرست — بکند خودش بر اساس `plan_id` تعیین می‌کنه
- بعد از verify موفق، اشتراک کاربر اتوماتیک extend میشه
- اگه کاربر اشتراک فعال داشته باشه، مدت جدید از انتهای اشتراک فعلی اضافه میشه
