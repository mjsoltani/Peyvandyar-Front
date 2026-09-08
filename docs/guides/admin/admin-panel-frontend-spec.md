# مشخصات فرانت — ادمین پنل Peyvandyar

> **مخاطب:** تیم فرانت (این فایل را مستقیم به فرانت بده)  
> **بک‌اند:** `basalam-service`  
> **Swagger:** `/api-docs` → تگ‌های `Admin Panel` و `Trial System`  
> **نسخه:** هم‌راستا با API فعلی (همه endpointها `requireSuperAdmin` مگر خلافش ذکر شده باشد)

---

## خلاصه یک‌خطی

ادمین پنل فقط برای کاربرانی با `role === "superadmin"` است. توکن همان `X-Encrypted-Token` لاگین عادی است. از `/api/user/status` نقش را بخوان؛ اگر superadmin نبود روت‌های `/admin/*` را نشان نده.

---

## ۱. صفحات پیشنهادی UI

```text
/admin
├── /admin/users                    → لیست کاربران (جستجو + فیلتر + صفحه‌بندی)
├── /admin/users/:phone             → جزئیات کاربر + اشتراک + فعال/غیرفعال
├── /admin/tools/digikala-sync      → سینک گروهی دیجی‌کالا (یک کاربر یا همه)
├── /admin/tools/archive-vendor     → غیرفعال‌کردن محصولات یک غرفه باسلام
└── /admin/tools/trial-cleanup      → پاکسازی trialهای منقضی (اختیاری)
```

| صفحه | اولویت |
|---|---|
| Users list + detail | **P0 — ضروری** |
| Subscription actions | **P0** |
| Digikala admin sync | P1 |
| Archive vendor | P1 |
| Trial cleanup | P2 |

---

## ۲. احراز هویت و گیت دسترسی

### هدر الزامی

```http
X-Encrypted-Token: <encrypted_token>
Content-Type: application/json
```

### تشخیص superadmin (قبل از رندر ادمین)

```http
GET /api/user/status
X-Encrypted-Token: <token>
```

```json
{
  "success": true,
  "user": {
    "id": 12,
    "phone_number": "09123456789",
    "is_active": true,
    "role": "superadmin",
    "vendor_id": 1563824,
    "vendor_title": "فروشگاه نمونه"
  }
}
```

| شرط | اکشن UI |
|---|---|
| `role !== "superadmin"` | redirect / 403 |
| `is_active === false` | حساب غیرفعال |
| HTTP `401` | لاگین دوباره |
| HTTP `403` روی API ادمین | «دسترسی ندارید» |

> ⚠️ `GET /api/me` فیلد `role` ندارد. برای گیت ادمین حتماً از `/api/user/status` استفاده کن.

> نقش superadmin فقط از سمت سرور با CLI ست می‌شود (`node set-superadmin.js <phone>`). فرانت API تغییر نقش ندارد.

---

## ۳. مدل داده

### کاربر در لیست/جزئیات ادمین

| فیلد | نوع | توضیح |
|---|---|---|
| `id` | number | شناسه داخلی |
| `phone_number` | string | کلید اصلی برای pathها |
| `username` | string \| null | |
| `basalam_user_id` | number \| null | |
| `basalam_vendor_id` | number \| null | آیدی غرفه باسلام |
| `vendor_title` | string \| null | نام غرفه |
| `role` | `"vendor"` \| `"superadmin"` | |
| `is_active` | boolean | |
| `subscription_type` | string | جدول پایین |
| `expires_at` | ISO string \| null | |
| `utm_data` | string \| null | |
| `last_activity_at` | ISO \| null | |
| `created_at` / `updated_at` | ISO | |
| `token_count` | number | تعداد توکن فعال |
| `last_token_used` | ISO \| null | |

### انواع اشتراک

| مقدار | لیبل پیشنهادی UI | مدت نسبی (`POST /api/trial/extend`) |
|---|---|---|
| `trial` | آزمایشی | همیشه `now + 3` روز |
| `free` | رایگان | بدون انقضا (`null`) |
| `monthly` | ماهانه | `now + 30` روز — مبلغ پلن: ۳٬۰۰۰٬۰۰۰ |
| `biweekly` | دو هفته‌ای | `now + 15` روز — مبلغ پلن: ۲٬۰۰۰٬۰۰۰ |
| `premium` | ویژه | `now + days` (پارامتر body، پیش‌فرض ۳) |

### آبجکت `subscription` (در detail و بعد از آپدیت)

```json
{
  "status": "monthly",
  "subscription_type": "monthly",
  "access_level": "full",
  "can_use_api": true,
  "is_active": true,
  "expires_at": "2026-12-31T20:30:00.000Z",
  "is_expired": false,
  "remaining": { "days": 30, "hours": 720, "milliseconds": 2592000000 },
  "display": {
    "status_text": "اشتراک ماهانه",
    "remaining_text": "30 روز باقی مانده"
  }
}
```

از `subscription.display.*` برای badge متن آماده استفاده کن.

---

## ۴. API — مدیریت کاربران (P0)

Base: همان origin بک‌اند.

### ۴.۱ لیست کاربران

```http
GET /api/admin/users?page=1&per_page=30&q=0912&is_active=true&subscription_type=monthly
```

| Query | پیش‌فرض | توضیح |
|---|---|---|
| `page` | `1` | |
| `per_page` | `30` | حداکثر ۱۰۰ |
| `q` | — | phone / username / vendor_title / basalam ids |
| `is_active` | — | `true` \| `false` |
| `subscription_type` | — | یکی از انواع اشتراک |

**200:**

```json
{
  "success": true,
  "pagination": { "page": 1, "per_page": 30, "total": 150, "total_pages": 5 },
  "users": [ { "...AdminUser..." } ]
}
```

Sort سرور: `created_at DESC` (قابل تغییر از فرانت نیست).

### ۴.۲ جزئیات کاربر

```http
GET /api/admin/users/{phone_number}
```

**200:** `{ success, user, subscription }`  
**404:** `{ success: false, error: "User not found" }`

### ۴.۳ فعال / غیرفعال

ترجیح UI: یک toggle که یکی از این‌ها را بزند.

```http
PATCH /api/admin/users/update-status
{ "phone_number": "09123456789", "is_active": false }
```

یا:

```http
POST /api/admin/users/activate
{ "phone_number": "09123456789" }

POST /api/admin/users/deactivate
{ "phone_number": "09123456789" }
```

**200:**

```json
{
  "success": true,
  "message": "User deactivated successfully",
  "user": { "phone_number": "09123456789", "is_active": false }
}
```

قبل از deactivate حتماً confirm dialog.

### ۴.۴ set مستقیم نوع اشتراک / تاریخ انقضا

برای تاریخ **دلخواه** (date picker):

```http
PATCH /api/admin/users/{phone_number}/subscription
{
  "subscription_type": "monthly",
  "expires_at": "2026-12-31T20:30:00.000Z"
}
```

| Body | الزامی؟ |
|---|---|
| `subscription_type` | حداقل یکی از دو فیلد |
| `expires_at` | ISO datetime یا `null` |

### ۴.۵ تمدید نسبی (از الان + N روز)

```http
POST /api/trial/extend
{
  "phoneNumber": "09123456789",
  "subscriptionType": "monthly",
  "days": 30
}
```

| فیلد | الزامی | توضیح |
|---|---|---|
| `phoneNumber` | ✅ | camelCase |
| `subscriptionType` | ❌ (پیش‌فرض `trial`) | |
| `days` | ❌ (پیش‌فرض `3`) | عمدتاً برای `premium` |

همه حالت‌ها `is_active = true` می‌کنند.

**پیشنهاد دکمه‌های shortcut در UI جزئیات:**

| دکمه | Body |
|---|---|
| +۳ روز trial | `{ phoneNumber, subscriptionType: "trial" }` |
| +۳۰ روز ماهانه | `{ phoneNumber, subscriptionType: "monthly" }` |
| +۱۵ روز دو هفته | `{ phoneNumber, subscriptionType: "biweekly" }` |
| Premium N روز | `{ phoneNumber, subscriptionType: "premium", days: N }` |
| رایگان | `{ phoneNumber, subscriptionType: "free" }` |

---

## ۵. API — ابزارهای ادمین (P1)

### ۵.۱ سینک دیجی‌کالا (ادمین)

فروشنده عادی فقط لینک‌های خودش را سینک می‌کند. ادمین می‌تواند **یک user_id** یا **همه کاربران دارای لینک** را سینک کند.

```http
POST /api/admin/digikala/sync
{}
```

یا:

```http
POST /api/admin/digikala/sync
{ "user_id": 12, "fields": "all" }
```

| Body | توضیح |
|---|---|
| `user_id` | اختیاری — اگر نباشد، همه کاربران با لینک Digikala |
| `fields` | `"price"` \| `"stock"` \| `"all"` یا آرایه `["price","stock"]` — پیش‌فرض `"price"` |

**200 نمونه:**

```json
{
  "success": true,
  "message": "Admin Digikala sync finished for all users with links",
  "fields": ["price"],
  "users_total": 3,
  "users_synced": 2,
  "users_failed": 1,
  "users": [
    {
      "user_id": 12,
      "vendor_id": "1563824",
      "success": true,
      "total": 40,
      "updated": 10,
      "unchanged": 28,
      "failed": 2,
      "results": []
    },
    {
      "user_id": 15,
      "success": false,
      "error": "No approved Basalam token for this user"
    }
  ]
}
```

**UI پیشنهادی:**

1. انتخاب: «همه» / «یک کاربر» (input `user_id` از جزئیات کاربر)
2. انتخاب فیلدها: قیمت / موجودی / هر دو
3. دکمه اجرا + loading طولانی (ممکن است چند دقیقه طول بکشد)
4. جدول نتیجه per-user با badge موفق/ناموفق

> این endpoint همگام (sync) است؛ poll لازم نیست مگر بعداً async شود.

### ۵.۲ غیرفعال‌کردن (unpublish) همه محصولات یک غرفه

وضعیت هدف روی باسلام: **۳۷۹۰ = منتشر نشده**. آرشیو واقعی ۲۹۷۷ از API باسلام قابل نوشتن نیست.

```http
POST /api/admin/products/archive-vendor
{
  "vendor_id": "1563824",
  "only_published": true
}
```

| Body | الزامی | توضیح |
|---|---|---|
| `vendor_id` | ✅ | آیدی غرفه باسلام (`basalam_vendor_id`) |
| `vendor_token` | ❌ | اگر توکن در DB نباشد، encrypted یا raw بده |
| `only_published` | ❌ (پیش‌فرض `true`) | فقط محصولات published (۲۹۷۶) |

**پاسخ‌ها:**

| وضعیت | معنی UI |
|---|---|
| `202` + `job_id` | صف Redis (غرفه بزرگ >۵۰۰۰) → poll وضعیت job |
| `202` + `basalam_job_ids` | جاب‌های باسلام ساخته شد |
| `400` | محصولی برای غیرفعال‌کردن نبود / ورودی بد |
| `404` | توکن غرفه پیدا نشد |

**نمونه صف Redis:**

```json
{
  "success": true,
  "vendor_id": "1563824",
  "total_products_found": 12000,
  "job_id": "uuid-...",
  "status": "pending",
  "only_published": true,
  "target_status": 3790,
  "note": "Poll GET /api/jobs/:jobId/status"
}
```

**Poll پیشرفت:**

```http
GET /api/jobs/{jobId}/status
X-Encrypted-Token: <superadmin_token>
```

روی `progress.products_submitted` و `status` (`pending` → `processing` → `completed` / `failed`) تمرکز کن. توکن‌ها در این پاسخ redact می‌شوند.

**لیست جاب‌های باسلام برای همان غرفه:**

```http
GET /api/admin/products/archive-vendor/{vendorId}/jobs?page=1&per_page=30
```

Query اختیاری: `vendor_token`

**UI پیشنهادی:**

1. فرم: `vendor_id` (+ optional token) + چک‌باکس «فقط منتشرشده‌ها»
2. Confirm قوی («همه محصولات این غرفه غیرفعال می‌شوند»)
3. اگر `job_id` آمد → progress bar با polling هر ۲–۳ ثانیه
4. لینک به لیست batch jobs باسلام برای همان vendor

### ۵.۳ پاکسازی trial منقضی (اختیاری)

```http
POST /api/trial/cleanup
```

**200:**

```json
{
  "success": true,
  "message": "Trial cleanup completed",
  "deactivated_users": 5,
  "timestamp": "2026-09-07T10:00:00.000Z"
}
```

کاربرانی که اشتراک‌شان منقضی شده را `is_active=false` می‌کند. دکمه در صفحه Tools با confirm کافی است.

---

## ۶. چیزهایی که در ادمین پنل نیاور (یا با احتیاط)

| موضوع | وضعیت |
|---|---|
| تغییر `role` به superadmin | فقط CLI — API نیست |
| Delete user | endpoint ندارد |
| Sort سفارشی لیست | ندارد |
| `GET /api/users/:phone/status` | بدون auth — در پنل استفاده نکن؛ از `/api/admin/*` استفاده کن |
| `POST /api/payment/manual-approve` | وجود دارد ولی **`requireSuperAdmin` نیست**؛ فعلاً داخل پنل نگذار مگر بک‌اند گیت کند |

---

## ۷. خطاهای مشترک

| HTTP | معنی | UI |
|---|---|---|
| `400` | ورودی ناقص/نامعتبر | نمایش `error` |
| `401` | توکن نیست/باطل | لاگین |
| `403` | superadmin نیست | صفحه عدم دسترسی |
| `404` | کاربر/توکن/جاب پیدا نشد | empty / toast |
| `502` / `503` / `504` | باسلام بالا نیست | retry |

فرمت معمول:

```json
{ "success": false, "error": "..." }
```

---

## ۸. TypeScript پیشنهادی

```typescript
type UserRole = 'vendor' | 'superadmin';
type SubscriptionType = 'trial' | 'free' | 'monthly' | 'biweekly' | 'premium';

interface AdminUser {
  id: number;
  phone_number: string;
  username: string | null;
  basalam_user_id: number | null;
  basalam_vendor_id: number | null;
  vendor_title: string | null;
  role: UserRole;
  is_active: boolean;
  subscription_type: SubscriptionType;
  expires_at: string | null;
  utm_data: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  token_count: number;
  last_token_used: string | null;
}

interface SubscriptionStatus {
  status: string;
  subscription_type: SubscriptionType;
  access_level: 'full' | 'limited' | 'none';
  can_use_api: boolean;
  is_active: boolean;
  expires_at: string | null;
  is_expired: boolean;
  remaining: { days: number; hours: number; milliseconds: number };
  display: { status_text: string; remaining_text: string };
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
```

---

## ۹. Helper فرانت (کپی‌کردنی)

```typescript
const API_BASE = import.meta.env.VITE_API_URL;

function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Encrypted-Token': getEncryptedToken(),
      ...options.headers,
    },
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || res.statusText);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }
    return data;
  });
}

export const adminApi = {
  meStatus: () => adminFetch('/api/user/status'),

  listUsers: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') q.set(k, String(v));
    });
    return adminFetch(`/api/admin/users?${q}`);
  },

  getUser: (phone: string) =>
    adminFetch(`/api/admin/users/${encodeURIComponent(phone)}`),

  setActive: (phone_number: string, is_active: boolean) =>
    adminFetch('/api/admin/users/update-status', {
      method: 'PATCH',
      body: JSON.stringify({ phone_number, is_active }),
    }),

  updateSubscription: (
    phone: string,
    body: { subscription_type?: SubscriptionType; expires_at?: string | null }
  ) =>
    adminFetch(`/api/admin/users/${encodeURIComponent(phone)}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  extendSubscription: (body: {
    phoneNumber: string;
    subscriptionType?: SubscriptionType;
    days?: number;
  }) =>
    adminFetch('/api/trial/extend', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  digikalaSync: (body: { user_id?: number; fields?: string | string[] } = {}) =>
    adminFetch('/api/admin/digikala/sync', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  archiveVendor: (body: {
    vendor_id: string;
    vendor_token?: string;
    only_published?: boolean;
  }) =>
    adminFetch('/api/admin/products/archive-vendor', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  archiveJobs: (vendorId: string, page = 1, per_page = 30) =>
    adminFetch(
      `/api/admin/products/archive-vendor/${encodeURIComponent(vendorId)}/jobs?page=${page}&per_page=${per_page}`
    ),

  jobStatus: (jobId: string) =>
    adminFetch(`/api/jobs/${encodeURIComponent(jobId)}/status`),

  trialCleanup: () =>
    adminFetch('/api/trial/cleanup', { method: 'POST' }),
};
```

---

## ۱۰. چک‌لیست پیاده‌سازی فرانت

**دسترسی**
- [ ] Guard با `GET /api/user/status` و `role === 'superadmin'`
- [ ] هدر `X-Encrypted-Token` روی همه درخواست‌ها
- [ ] هندل `401` / `403`

**کاربران (P0)**
- [ ] جدول لیست + debounce جستجو (~۳۰۰ms) + فیلتر `is_active` / `subscription_type`
- [ ] Pagination از `pagination.total_pages`
- [ ] صفحه جزئیات
- [ ] Toggle فعال/غیرفعال + confirm
- [ ] فرم set اشتراک/تاریخ (`PATCH .../subscription`)
- [ ] Shortcutهای تمدید نسبی (`POST /api/trial/extend`)
- [ ] تاریخ شمسی فقط در نمایش UI
- [ ] Badge: فعال سبز / غیرفعال قرمز / منقضی نارنجی

**ابزارها (P1)**
- [ ] صفحه Digikala sync با نتیجه per-user
- [ ] صفحه Archive vendor + confirm + polling `job_id`
- [ ] (اختیاری) دکمه trial cleanup

**کیفیت**
- [ ] Loading / empty / error / toast
- [ ] بعد از هر mutation، detail یا list را refresh کن

---

## ۱۱. نقشه سریع endpointها

| کار | Method | Path |
|---|---|---|
| چک نقش | GET | `/api/user/status` |
| لیست کاربران | GET | `/api/admin/users` |
| جزئیات | GET | `/api/admin/users/:phone` |
| وضعیت فعال | PATCH | `/api/admin/users/update-status` |
| فعال | POST | `/api/admin/users/activate` |
| غیرفعال | POST | `/api/admin/users/deactivate` |
| set اشتراک/تاریخ | PATCH | `/api/admin/users/:phone/subscription` |
| تمدید نسبی | POST | `/api/trial/extend` |
| پاکسازی trial | POST | `/api/trial/cleanup` |
| سینک دیجی‌کالا ادمین | POST | `/api/admin/digikala/sync` |
| آرشیو/آن‌پابلیش غرفه | POST | `/api/admin/products/archive-vendor` |
| جاب‌های باسلام غرفه | GET | `/api/admin/products/archive-vendor/:vendorId/jobs` |
| وضعیت جاب Redis | GET | `/api/jobs/:jobId/status` |

---

## ۱۲. تماس / منبع حقیقت

- Swagger زنده: `/api-docs` (تگ `Admin Panel`)
- اگر قرارداد API عوض شد، همین فایل را با بک‌اند sync کن
