# پیاده‌سازی درگاه پرداخت - مستندات فنی

## نمای کلی

این پروژه از درگاه پرداخت **باسلام** برای پردازش تراکنش‌های مالی استفاده می‌کند. فرآیند پرداخت در دو مرحله اصلی انجام می‌شود:

1. **ایجاد پرداخت** (`/api/payment/create`)
2. **تایید پرداخت** (`/api/payment/verify`)

---

## ساختار فایل‌ها

```
src/
├── lib/
│   └── api.ts                          # توابع API شامل paymentApi
├── app/
│   └── payment/
│       ├── callback/
│       │   └── page.tsx                # صفحه قدیمی (redirect به result)
│       └── result/
│           └── page.tsx                # صفحه نتیجه پرداخت (اصلی)
```

---

## API Functions

### 1. `paymentApi.createPayment()`

ایجاد پیش‌تراکنش پرداخت و دریافت لینک پرداخت.

**استفاده:**
```typescript
import { paymentApi } from "@/lib/api";

const response = await paymentApi.createPayment({
  amount: 500000,        // مبلغ به ریال (500,000 ریال = 50,000 تومان)
  description: "خرید اشتراک ماهانه",
  callback_url: "https://peyvandyar.amintvk.ir/payment/result" // اختیاری
});

if (response.success && response.pay_url) {
  // انتقال کاربر به درگاه پرداخت
  window.location.href = response.pay_url;
}
```

**Response:**
```typescript
{
  success: boolean;
  hash_id?: string;           // شناسه یکتای تراکنش
  pay_url?: string;           // لینک درگاه پرداخت
  reference_id?: string;      // شماره مرجع
  expired_at?: string;        // زمان انقضا
  amount?: number;            // مبلغ اصلی (ریال)
  total_amount?: number;      // مبلغ کل با کارمزد (ریال)
  error?: string;
  message?: string;
}
```

---

### 2. `paymentApi.verifyPayment()`

تایید نهایی پرداخت بعد از بازگشت کاربر از درگاه.

**استفاده:**
```typescript
const response = await paymentApi.verifyPayment(hashId);

if (response.success && response.status === "success") {
  // پرداخت موفق - فعال‌سازی اشتراک
  console.log("پرداخت موفق:", response.amount);
} else {
  // پرداخت ناموفق
  console.error("خطا:", response.message);
}
```

**Response:**
```typescript
{
  success: boolean;
  status?: "success" | "failed" | "pending";
  hash_id?: string;
  amount?: number;            // مبلغ اصلی (ریال)
  total_amount?: number;      // مبلغ کل با کارمزد (ریال)
  paid_at?: string;           // زمان پرداخت (ISO 8601)
  message?: string;
  error?: string;
}
```

---

## صفحات

### `/payment/result` (صفحه اصلی)

صفحه نتیجه پرداخت که بعد از بازگشت کاربر از درگاه نمایش داده می‌شود.

**URL Parameters:**
- `hash_id` (required): شناسه تراکنش
- `status` (optional): وضعیت اولیه از URL (فقط برای UX)

**فلوچارت:**
```
1. دریافت hash_id از URL
2. نمایش loading
3. فراخوانی paymentApi.verifyPayment(hash_id)
4. نمایش نتیجه بر اساس response.status:
   - success → دکمه "ورود به داشبورد"
   - failed → دکمه "تلاش مجدد"
   - pending → پیام "در انتظار تایید"
```

**ویژگی‌ها:**
- ✅ استفاده از Design System (Card, Button)
- ✅ انیمیشن با framer-motion
- ✅ نمایش جزئیات تراکنش (مبلغ، زمان، شناسه)
- ✅ دکمه‌های عملیاتی بر اساس وضعیت
- ✅ لینک پشتیبانی برای خطاها
- ✅ Dark mode support

---

### `/payment/callback` (Deprecated)

این صفحه فقط برای backward compatibility نگه داشته شده و کاربر را به `/payment/result` redirect می‌کند.

**⚠️ توجه:** از این صفحه در کدهای جدید استفاده نکنید.

---

## نکات امنیتی

### 🔒 هرگز به URL اعتماد نکنید!

```typescript
// ❌ اشتباه - اعتماد به status از URL
const urlStatus = searchParams.get("status");
if (urlStatus === "success") {
  activateSubscription(); // خطرناک!
}

// ✅ درست - تایید از سرور
const response = await paymentApi.verifyPayment(hashId);
if (response.success && response.status === "success") {
  activateSubscription(); // امن
}
```

### 🔐 احراز هویت

تمام درخواست‌های API نیاز به `X-Encrypted-Token` دارند که توسط `apiRequest()` به صورت خودکار اضافه می‌شود.

---

## مثال کامل: فرآیند خرید اشتراک

```typescript
// 1. کاربر روی دکمه "خرید" کلیک می‌کند
async function handlePurchase() {
  try {
    const response = await paymentApi.createPayment({
      amount: 500000, // 50,000 تومان
      description: "خرید اشتراک ماهانه"
    });

    if (response.success && response.pay_url) {
      // 2. انتقال به درگاه پرداخت
      window.location.href = response.pay_url;
    } else {
      alert(response.error || "خطا در ایجاد پرداخت");
    }
  } catch (error) {
    console.error(error);
    alert("خطا در ارتباط با سرور");
  }
}

// 3. کاربر پرداخت می‌کند
// 4. باسلام → بکند (callback)
// 5. بکند → redirect به /payment/result?status=success&hash_id=abc123

// 6. صفحه /payment/result به صورت خودکار verify می‌زند
useEffect(() => {
  const hashId = searchParams.get("hash_id");
  const response = await paymentApi.verifyPayment(hashId);
  
  if (response.status === "success") {
    // 7. نمایش پیام موفقیت + فعال‌سازی اشتراک
    setStatus("success");
  }
}, []);
```

---

## تبدیل واحد پول

**⚠️ مهم:** API با **ریال** کار می‌کند، اما UI با **تومان**.

```typescript
// ارسال به API (تومان → ریال)
const amountInRial = amountInToman * 10;

// نمایش در UI (ریال → تومان)
const amountInToman = amountInRial / 10;
```

**مثال:**
```typescript
// کاربر می‌خواهد 50,000 تومان پرداخت کند
const userInput = 50000; // تومان

// ارسال به API
await paymentApi.createPayment({
  amount: userInput * 10 // 500,000 ریال
});

// نمایش در UI
<div>{(response.amount / 10).toLocaleString("fa-IR")} تومان</div>
```

---

## خطاها و Troubleshooting

### خطای "اطلاعات پرداخت ناقص است"
- **علت:** `hash_id` در URL وجود ندارد
- **راه‌حل:** بررسی کنید که بکند به درستی redirect می‌کند

### خطای "خطا در تایید پرداخت"
- **علت:** مشکل در ارتباط با API یا توکن نامعتبر
- **راه‌حل:** بررسی console برای جزئیات بیشتر

### پرداخت موفق اما اشتراک فعال نشد
- **علت:** بکند ممکن است subscription را فعال نکرده باشد
- **راه‌حل:** تماس با پشتیبانی با ارائه `hash_id`

---

## چک‌لیست تست

- [ ] ایجاد پرداخت با مبلغ‌های مختلف
- [ ] پرداخت موفق → نمایش صفحه success
- [ ] پرداخت ناموفق → نمایش صفحه failed + دکمه retry
- [ ] بررسی تبدیل صحیح ریال/تومان
- [ ] تست در حالت dark mode
- [ ] تست redirect از /payment/callback به /payment/result
- [ ] بررسی نمایش صحیح زمان پرداخت (فارسی)
- [ ] تست لینک پشتیبانی

---

## منابع

- [راهنمای فرانت‌اند](./PAYMENT_FRONTEND_GUIDE.md)
- [API Endpoints](./API-ENDPOINTS.json)
- [Design System Rules](./.kiro/steering/design-system.md)
