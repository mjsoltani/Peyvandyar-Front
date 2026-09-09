# Plans & Pricing API — برای تیم فرانت

بک‌اند منبع حقیقت قیمت و مدت اشتراک است. **قیمت را در فرانت hard-code نکنید.**

واحد پول در API: **ریال (IRR)**.  
برای نمایش تومان: `amount_toman` را استفاده کنید یا `amount / 10`.

مقادیر فعلی seed (قابل تغییر از ادمین):

| plan_id | مدت | مبلغ seed |
|---------|-----|-----------|
| `biweekly` | ۱۵ روز | ۲٬۰۰۰٬۰۰۰ ریال (= ۲۰۰٬۰۰۰ تومان) |
| `monthly` | ۳۰ روز | ۳٬۰۰۰٬۰۰۰ ریال (= ۳۰۰٬۰۰۰ تومان) |

---

## جریان پیشنهادی فرانت

```
1) GET /api/plans          → کارت‌های قیمت در صفحه خرید
2) کاربر پلن را انتخاب می‌کند
3) POST /api/payment/create { plan_id }  → فقط plan_id بفرستید (نه amount)
4) redirect به pay_url
```

ادمین:

```
GET  /api/admin/plans
PATCH /api/admin/plans/:plan_id   { amount?, duration_days?, label?, is_active?, sort_order? }
```

---

## ۱) کاتالوگ عمومی (صفحه خرید)

```http
GET /api/plans
```

بدون لاگین.

### پاسخ `200`

```json
{
  "success": true,
  "currency": "IRR",
  "note": "amount is in Rials (ریال). amount_toman = amount / 10 for display.",
  "plans": [
    {
      "id": "biweekly",
      "label": "دو هفته‌ای",
      "duration_days": 15,
      "amount": 2000000,
      "amount_toman": 200000,
      "currency": "IRR",
      "is_active": true
    },
    {
      "id": "monthly",
      "label": "ماهانه",
      "duration_days": 30,
      "amount": 3000000,
      "amount_toman": 300000,
      "currency": "IRR",
      "is_active": true
    }
  ]
}
```

فقط پلن‌های `is_active: true` برمی‌گردند. UI را از این آرایه بسازید.

---

## ۲) ساخت پرداخت

```http
POST /api/payment/create
x-encrypted-token: <token>
Content-Type: application/json

{
  "plan_id": "monthly"
}
```

### مهم
- **`amount` نفرستید** — سرور مبلغ را از DB می‌خواند و به درگاه می‌دهد.
- اگر `plan_id` نامعتبر یا غیرفعال باشد → `400` با `code: "INVALID_PLAN"`.

### پاسخ موفق (خلاصه)

```json
{
  "success": true,
  "hash_id": "...",
  "pay_url": "https://apps.basalam.com/pay/...",
  "reference_id": "ORDER-...",
  "plan_id": "monthly",
  "duration_days": 30,
  "amount": 3000000,
  "total_amount": 3000000,
  "expired_at": "..."
}
```

کاربر را به `pay_url` بفرستید.

---

## ۳) پنل ادمین — لیست پلن‌ها

```http
GET /api/admin/plans
x-encrypted-token: <superadmin token>
```

همه پلن‌ها (حتی غیرفعال) + `sort_order` و timestamps.

---

## ۴) پنل ادمین — تغییر قیمت / مدت

```http
PATCH /api/admin/plans/{plan_id}
x-encrypted-token: <superadmin token>
Content-Type: application/json
```

### مثال: قیمت ماهانه → ۳۵۰ هزار تومان

```json
{
  "amount": 3500000
}
```

(`۳۵۰۰۰۰ تومان` = `۳۵۰۰۰۰۰ ریال`)

### مثال: تغییر هم‌زمان قیمت و مدت

```json
{
  "label": "ماهانه ویژه",
  "amount": 3500000,
  "duration_days": 30,
  "is_active": true,
  "sort_order": 20
}
```

### فیلدهای قابل ویرایش

| فیلد | نوع | توضیح |
|------|-----|--------|
| `label` | string | عنوان نمایشی |
| `duration_days` | int > 0 | تعداد روز بعد از پرداخت موفق |
| `amount` | int > 0 | **ریال** |
| `is_active` | boolean | اگر `false`، از `/api/plans` و خرید حذف می‌شود |
| `sort_order` | int | ترتیب نمایش |

`plan_id` قابل تغییر نیست (`monthly` / `biweekly` ثابت می‌مانند).

### پاسخ `200`

```json
{
  "success": true,
  "message": "Plan updated successfully",
  "plan": {
    "id": "monthly",
    "label": "ماهانه",
    "duration_days": 30,
    "amount": 3500000,
    "amount_toman": 350000,
    "currency": "IRR",
    "is_active": true,
    "sort_order": 20,
    "updated_at": "..."
  }
}
```

---

## قرارداد مهم (برای UX ادمین)

اگر ادمین وسط چک‌اوت قیمت را عوض کند:

- سفارش‌های **قبلاً ساخته‌شده** با مبلغ و مدت **اسنپ‌شات‌شده** همان لحظهٔ ساخت پرداخت تسویه می‌شوند.
- سفارش‌های **جدید** قیمت جدید را می‌گیرند.

یعنی کاربر چیزی که موقع زدن «پرداخت» دیده را می‌گیرد؛ کاتالوگ زنده فقط برای خریدهای بعدی است.

---

## نمونه کد فرانت

```ts
type Plan = {
  id: string;
  label: string;
  duration_days: number;
  amount: number;
  amount_toman: number;
  is_active: boolean;
};

export async function fetchPlans(apiBase: string): Promise<Plan[]> {
  const res = await fetch(`${apiBase}/api/plans`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to load plans');
  return data.plans;
}

export async function startPayment(apiBase: string, token: string, planId: string) {
  const res = await fetch(`${apiBase}/api/payment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-encrypted-token': token,
    },
    body: JSON.stringify({ plan_id: planId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Payment create failed');
  }
  return data; // { pay_url, ... }
}

export async function adminUpdatePlan(
  apiBase: string,
  token: string,
  planId: string,
  patch: Partial<{
    label: string;
    duration_days: number;
    amount: number;
    is_active: boolean;
    sort_order: number;
  }>
) {
  const res = await fetch(`${apiBase}/api/admin/plans/${planId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-encrypted-token': token,
    },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Plan update failed');
  }
  return data.plan;
}
```

---

## چک‌لیست فرانت

- [ ] صفحه خرید از `GET /api/plans` پر شود (نه ثابت ۲۰۰/۳۰۰)
- [ ] `POST /api/payment/create` فقط `plan_id` بفرستد
- [ ] در پنل ادمین فرم ویرایش مبلغ (ریال یا تومان با تبدیل ×۱۰) + مدت
- [ ] بعد از ذخیره ادمین، لیست پلن‌ها را refresh کنید
- [ ] پلن‌های `is_active: false` در UI خرید نشان داده نشوند (از API عمومی هم نمی‌آیند)

---

## مرتبط

- مدیریت اشتراک یک کاربر خاص (نه قیمت کاتالوگ): `docs/admin-subscription-api.md`
- تصمیم معماری: `docs/adr/0001-db-backed-subscription-plans.md`
