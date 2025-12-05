# راهنمای مدیریت خطاهای API

## تغییرات انجام شده

### 1. کلاس ApiError سفارشی (`src/lib/api.ts`)
یک کلاس خطای سفارشی برای مدیریت بهتر خطاهای API ایجاد شد که شامل:
- پیغام خطا
- کد وضعیت HTTP
- مشخص کردن خطاهای احراز هویت (401/403)

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isAuthError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 2. کامپوننت‌های مدیریت خطا (`src/components/dashboard/api-error-boundary.tsx`)

دو کامپوننت جدید برای نمایش خطاها:

#### `ApiErrorDisplay`
نمایش پیغام خطا با امکان تلاش مجدد:
- حالت عادی: نمایش کامل با آیکون و دکمه
- حالت فشرده (compact): نمایش کوچک‌تر برای استفاده در بخش‌های کوچک

#### `ApiSectionWrapper`
یک wrapper برای بخش‌های مختلف که:
- در حالت loading: نمایش اسپینر
- در حالت خطا: نمایش پیغام خطا
- در حالت موفق: نمایش محتوا

### 3. جداسازی State در صفحات

#### صفحه داشبورد (`src/app/dashboard/page.tsx`)
State ها به صورت جداگانه برای هر بخش:
```typescript
// اطلاعات کاربر
const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
const [userLoading, setUserLoading] = useState(true);
const [userError, setUserError] = useState<Error | null>(null);

// آمار محصولات
const [stats, setStats] = useState<DashboardStats>({...});
const [statsLoading, setStatsLoading] = useState(true);
const [statsError, setStatsError] = useState<Error | null>(null);
```

هر بخش به صورت مستقل fetch و error handling دارد:
- `fetchUserInfo()`: دریافت اطلاعات کاربر
- `fetchStats()`: دریافت آمار محصولات

### 4. استفاده از ApiSectionWrapper

```tsx
<ApiSectionWrapper
  error={userError}
  isLoading={userLoading}
  onRetry={fetchUserInfo}
  errorTitle="خطا در دریافت اطلاعات کاربر"
  compact={true}
>
  {/* محتوای بخش */}
</ApiSectionWrapper>
```

## مزایا

### ✅ عدم خرابی کل صفحه
اگر یک API خطا بده، فقط اون بخش خطا نشون میده و بقیه بخش‌ها کار میکنن

### ✅ پیغام‌های خطای واضح
برای خطاهای 401/403 پیغام مناسب فارسی نمایش داده میشه:
> "متاسفانه به خاطر مشکل پیش آمده نمی‌توانید وارد شوید. لطفا مجددا تلاش بفرمایید."

### ✅ امکان تلاش مجدد
هر بخش دکمه "تلاش مجدد" داره که فقط اون بخش رو دوباره fetch میکنه

### ✅ تجربه کاربری بهتر
کاربر میتونه با بخش‌های سالم کار کنه حتی اگر بعضی API ها مشکل داشته باشن

## نحوه استفاده در صفحات جدید

1. State های جداگانه برای هر بخش تعریف کنید:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);
```

2. تابع fetch با try/catch:
```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await api.getData();
    setData(response.data);
  } catch (err: any) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

3. استفاده از ApiSectionWrapper:
```tsx
<ApiSectionWrapper
  error={error}
  isLoading={loading}
  onRetry={fetchData}
  errorTitle="عنوان خطا"
>
  {/* محتوا */}
</ApiSectionWrapper>
```

## مثال کامل

```tsx
"use client";

import { useState, useEffect } from "react";
import { ApiSectionWrapper } from "@/components/dashboard/api-error-boundary";
import { myApi } from "@/lib/api";

export default function MyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await myApi.getData();
      setData(response.data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <ApiSectionWrapper
        error={error}
        isLoading={loading}
        onRetry={fetchData}
        errorTitle="خطا در دریافت داده‌ها"
      >
        {/* نمایش داده‌ها */}
        <div>{data?.title}</div>
      </ApiSectionWrapper>
    </div>
  );
}
```

## نکات مهم

- همیشه از try/catch در توابع fetch استفاده کنید
- خطاها رو به صورت Error object ذخیره کنید نه string
- برای هر بخش مستقل از صفحه، state های جداگانه تعریف کنید
- از compact={true} برای بخش‌های کوچک استفاده کنید
