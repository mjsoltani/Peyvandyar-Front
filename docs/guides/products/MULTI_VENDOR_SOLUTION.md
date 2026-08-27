# راه‌حل مدیریت چند غرفه‌ای در پیوندیار

## مشکل
- SSO باسلام فقط اطلاعات یک غرفه را برمی‌گرداند
- کاربران ممکن است صاحب چند غرفه باشند
- پیوندیار باید بتواند تمام غرفه‌های یک کاربر را نمایش دهد

## راه‌حل

### مرحله 1: دریافت لیست غرفه‌های کاربر از API باسلام

بعد از لاگین موفق، از `GET /v1/users/me` باسلام استفاده کنید:

```typescript
// دریافت اطلاعات کاربر شامل لیست غرفه‌ها
const response = await fetch('https://api.basalam.com/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${basalam_access_token}`
  }
});

const userData = await response.json();
// userData.vendor شامل لیست غرفه‌های کاربر است
```

پاسخ شامل این فیلدها است:
- `vendor`: اطلاعات غرفه‌های کاربر (ممکن است آرایه یا شیء واحد باشد)

### مرحله 2: ذخیره تمام غرفه‌ها در دیتابیس پیوندیار

در بکند، بعد از OAuth callback:

```python
# دریافت اطلاعات کاربر از باسلام
basalam_user = await get_basalam_user(access_token)

# ذخیره یا به‌روزرسانی کاربر در دیتابیس
user = await upsert_user(
    basalam_user_id=basalam_user['id'],
    username=basalam_user.get('username'),
    mobile=basalam_user.get('mobile'),
    # ... سایر فیلدها
)

# ذخیره تمام غرفه‌های کاربر
vendors_data = basalam_user.get('vendor', [])
if not isinstance(vendors_data, list):
    vendors_data = [vendors_data]  # اگر یک غرفه است، به آرایه تبدیل کن

for vendor_data in vendors_data:
    await upsert_vendor(
        user_id=user.id,
        basalam_vendor_id=vendor_data['id'],
        vendor_title=vendor_data['title'],
        vendor_identifier=vendor_data.get('identifier'),
        # ... سایر فیلدها
    )
```

### مرحله 3: ایجاد API برای دریافت لیست غرفه‌های کاربر

```python
@router.get("/api/user/vendors")
async def get_user_vendors(current_user: User = Depends(get_current_user)):
    """
    دریافت لیست تمام غرفه‌های متعلق به کاربر فعلی
    """
    vendors = await db.vendors.find_many(
        where={"user_id": current_user.id},
        select={
            "id": True,
            "basalam_vendor_id": True,
            "vendor_title": True,
            "vendor_identifier": True,
            "is_active": True,
        }
    )
    
    return {
        "success": True,
        "vendors": vendors
    }
```

### مرحله 4: به‌روزرسانی فرانت‌اند

#### 4.1. اضافه کردن صفحه انتخاب غرفه

```typescript
// src/app/dashboard/select-vendor/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/lib/api";

interface Vendor {
  id: number;
  basalam_vendor_id: number;
  vendor_title: string;
  vendor_identifier?: string;
  is_active: boolean;
}

export default function SelectVendorPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await userApi.getVendors();
        if (res.success && res.vendors) {
          setVendors(res.vendors);
          
          // اگر فقط یک غرفه داره، مستقیم انتخابش کن
          if (res.vendors.length === 1) {
            selectVendor(res.vendors[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const selectVendor = (vendor: Vendor) => {
    // ذخیره غرفه انتخاب شده
    localStorage.setItem("selected_vendor_id", vendor.basalam_vendor_id.toString());
    localStorage.setItem("selected_vendor_title", vendor.vendor_title);
    
    // هدایت به داشبورد
    router.push("/dashboard");
  };

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen p-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">انتخاب غرفه</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            onClick={() => selectVendor(vendor)}
            className="p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-orange-500 transition-colors text-right"
          >
            <h3 className="text-lg font-bold mb-2">{vendor.vendor_title}</h3>
            {vendor.vendor_identifier && (
              <p className="text-sm text-slate-500">@{vendor.vendor_identifier}</p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              شناسه: {vendor.basalam_vendor_id}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### 4.2. به‌روزرسانی callback برای هدایت به صفحه انتخاب غرفه

در `src/app/auth/callback/page.tsx`، بعد از ذخیره توکن:

```typescript
// بعد از ذخیره توکن
setAuthToken(finalToken);

// چک کنید کاربر چند غرفه دارد
const profileRes = await fetch('https://peyvandyar.amintvk.ir/api/user/profile', {
  headers: { 'Authorization': `Bearer ${finalToken}` }
});
const profile = await profileRes.json();

if (profile.vendors && profile.vendors.length > 1) {
  // اگر چند غرفه دارد، به صفحه انتخاب غرفه هدایت کن
  router.push("/dashboard/select-vendor");
} else {
  // اگر یک غرفه دارد، مستقیم به داشبورد برو
  router.push("/dashboard");
}
```

#### 4.3. به‌روزرسانی sync-stores برای استفاده از غرفه انتخاب شده

```typescript
// در sync-stores/page.tsx
const selectedVendorId = localStorage.getItem("selected_vendor_id");

useEffect(() => {
  const fetchData = async () => {
    // استفاده از selectedVendorId به جای vendor_id از پروفایل
    const childrenRes = await syncBoothsApi.getChildren(
      Number(selectedVendorId)
    );
    // ...
  };

  fetchData();
}, [selectedVendorId]);
```

### مرحله 5: اضافه کردن امکان تغییر غرفه فعال

```typescript
// در DashboardLayout یا Sidebar، اضافه کنید:
const VendorSwitcher = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentVendor, setCurrentVendor] = useState<string | null>(null);

  useEffect(() => {
    setCurrentVendor(localStorage.getItem("selected_vendor_title"));
  }, []);

  return (
    <div className="mb-4">
      <button
        onClick={() => router.push("/dashboard/select-vendor")}
        className="w-full p-3 bg-slate-100 rounded-xl text-right"
      >
        <p className="text-xs text-slate-500">غرفه فعال</p>
        <p className="font-bold">{currentVendor || "انتخاب غرفه"}</p>
      </button>
    </div>
  );
};
```

## جمع‌بندی

با این راه‌حل:
1. ✅ تمام غرفه‌های کاربر از باسلام دریافت می‌شود
2. ✅ کاربر می‌تواند غرفه مبدأ را انتخاب کند
3. ✅ کاربر می‌تواند بین غرفه‌هایش سوئیچ کند
4. ✅ هر غرفه می‌تواند غرفه‌های فرزند مختص به خود را داشته باشد
5. ✅ UX بهبود می‌یابد (کاربران با یک غرفه مستقیم وارد داشبورد می‌شوند)

## نکات مهم

1. **Scope OAuth**: مطمئن شوید scope شما شامل `vendor.profile.read` است (که الان هست ✓)
2. **Token Refresh**: توکن‌های باسلام expire می‌شوند، باید refresh token flow داشته باشید
3. **Cache**: لیست غرفه‌ها را کش کنید و فقط در زمان لاگین یا refresh به‌روزرسانی کنید
4. **Security**: مطمئن شوید کاربر فقط به غرفه‌های خودش دسترسی دارد
