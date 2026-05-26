# راهنمای کپی محصول از باسلام

## نمای کلی

این ویژگی به کاربران اجازه می‌دهد محصولات را از باسلام کپی کنند و **قبل از کپی، فیلدها را ویرایش کنند**.

---

## فرآیند کپی محصول

### مرحله 1️⃣: دریافت اطلاعات محصول

1. کاربر لینک محصول باسلام را وارد می‌کند
2. سیستم `product_id` را از URL استخراج می‌کند
3. درخواست به `GET /api/product/{product_id}` ارسال می‌شود
4. اطلاعات محصول (شامل تصاویر، تنوع‌ها، قیمت‌ها) دریافت می‌شود

### مرحله 2️⃣: نمایش و ویرایش

کاربر می‌تواند:
- **حالت مشاهده**: فقط اطلاعات را ببیند
- **حالت ویرایش**: فیلدها را تغییر دهد

#### فیلدهای قابل ویرایش:

**محصول اصلی:**
- ✏️ عنوان محصول
- ✏️ قیمت پایه (تومان)
- ✏️ قیمت فروش (تومان)
- ✏️ موجودی

**تنوع‌ها (Variants):**
- ✏️ قیمت پایه هر تنوع (تومان)
- ✏️ قیمت فروش هر تنوع (تومان)
- ✏️ موجودی هر تنوع

### مرحله 3️⃣: تایید و کپی

1. کاربر روی "تایید و کپی محصول" کلیک می‌کند
2. داده‌های **ویرایش شده** به بکند ارسال می‌شوند
3. بکند محصول را با اطلاعات جدید ایجاد می‌کند

---

## نحوه استفاده

### 1. ورود به صفحه کپی محصول

```
/dashboard/copy-product/basalam
```

### 2. وارد کردن لینک محصول

**فرمت‌های معتبر:**
```
https://basalam.com/helmet/product/11347802
https://basalam.com/p/22303639?utm_source=share
https://basalam.com/product/12345
```

### 3. دریافت اطلاعات

کلیک روی "دریافت اطلاعات محصول"

### 4. ویرایش فیلدها (اختیاری)

1. کلیک روی دکمه "ویرایش فیلدها" در header
2. فیلدهای مورد نظر را تغییر دهید
3. تغییرات به صورت خودکار در state ذخیره می‌شوند

### 5. تایید و کپی

کلیک روی "تایید و کپی محصول"

---

## جزئیات فنی

### State Management

```typescript
const [productData, setProductData] = useState<any>(null);     // داده اصلی از API
const [editedData, setEditedData] = useState<any>(null);       // داده ویرایش شده
const [isEditing, setIsEditing] = useState(false);             // حالت ویرایش
```

### تبدیل قیمت

**⚠️ مهم:** UI با **تومان** کار می‌کند، اما API با **ریال**.

```typescript
// نمایش در UI (ریال → تومان)
const displayPrice = Math.floor(priceInRial / 10);

// ارسال به API (تومان → ریال)
const apiPrice = priceInToman * 10;
```

### ویرایش فیلدها

#### فیلدهای اصلی:
```typescript
const handleFieldChange = (field: string, value: any) => {
  setEditedData((prev: any) => ({
    ...prev,
    [field]: value,
  }));
};
```

#### فیلدهای تنوع:
```typescript
const handleVariantChange = (variantIndex: number, field: string, value: any) => {
  setEditedData((prev: any) => {
    const newVariants = [...(prev.variants || [])];
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      [field]: value,
    };
    return {
      ...prev,
      variants: newVariants,
    };
  });
};
```

### ارسال به بکند

```typescript
const response = await productsApi.copyProductFromBasalam(
  extractedProductId,
  editedData  // ✅ داده‌های ویرایش شده ارسال می‌شوند
);
```

---

## API Endpoint

### کپی محصول از باسلام

**POST** `/api/product/{product_id}/copy`

**Body:**
```json
{
  "product_data": {
    "title": "عنوان ویرایش شده",
    "primary_price": 5000000,  // ریال
    "price": 4500000,          // ریال
    "inventory": 100,
    "variants": [
              {
        "id": 123,
        "primary_price": 5500000,
        "price": 5000000,
        "stock": 50
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "محصول با موفقیت کپی شد",
  "data": {
    "id": 456,
    "title": "عنوان ویرایش شده"
  }
}
```

---

## UI/UX Features

### 1. دکمه Toggle ویرایش

```tsx
<button onClick={() => setIsEditing(!isEditing)}>
  {isEditing ? "حالت مشاهده" : "ویرایش فیلدها"}
</button>
```

### 2. Input Fields در حالت ویرایش

```tsx
{isEditing ? (
  <input
    type="number"
    value={Math.floor((editedData?.price || 0) / 10)}
    onChange={(e) => handleFieldChange("price", parseInt(e.target.value) * 10)}
    className="border rounded px-3 py-2"
  />
) : (
  <span>{formatPrice(editedData?.price)} تومان</span>
)}
```

### 3. رنگ‌بندی بر اساس حالت

- **حالت مشاهده**: آبی (`bg-blue-50`)
- **حالت ویرایش**: نارنجی (`bg-orange-50`)

### 4. پیام‌های راهنما

```tsx
<div className={isEditing ? "bg-orange-50" : "bg-blue-50"}>
  {isEditing 
    ? "⚠️ حالت ویرایش فعال است - تغییرات شما ذخیره خواهد شد"
    : "این محصول با تمام تنوع‌ها کپی خواهد شد"
  }
</div>
```

---

## مثال کامل

### سناریو: کپی محصول با تغییر قیمت

1. **دریافت محصول:**
   - لینک: `https://basalam.com/p/22303639`
   - قیمت اصلی: 500,000 تومان

2. **ویرایش:**
   - کلیک روی "ویرایش فیلدها"
   - تغییر قیمت به: 450,000 تومان
   - تغییر موجودی به: 200

3. **کپی:**
   - کلیک روی "تایید و کپی محصول"
   - بکند محصول را با قیمت 4,500,000 ریال ایجاد می‌کند

---

## نکات مهم

### ✅ Do's

- همیشه قیمت‌ها را در UI به تومان نمایش دهید
- قبل از ارسال به API، قیمت‌ها را به ریال تبدیل کنید
- تغییرات را در `editedData` ذخیره کنید، نه `productData`
- validation برای فیلدهای عددی اضافه کنید

### ❌ Don'ts

- مستقیماً `productData` را تغییر ندهید
- قیمت‌ها را بدون تبدیل به API ارسال نکنید
- فیلدهای read-only (مثل category، status) را قابل ویرایش نکنید

---

## Troubleshooting

### مشکل: تغییرات ذخیره نمی‌شوند

**علت:** استفاده از `productData` به جای `editedData`

**راه‌حل:**
```typescript
// ❌ اشتباه
<input value={productData?.price} />

// ✅ درست
<input value={editedData?.price} />
```

### مشکل: قیمت‌ها اشتباه ارسال می‌شوند

**علت:** فراموش کردن تبدیل تومان به ریال

**راه‌حل:**
```typescript
// ✅ درست
onChange={(e) => handleFieldChange("price", parseInt(e.target.value) * 10)}
```

### مشکل: تنوع‌ها ویرایش نمی‌شوند

**علت:** استفاده از `handleFieldChange` به جای `handleVariantChange`

**راه‌حل:**
```typescript
// ✅ درست
onChange={(e) => handleVariantChange(idx, "price", parseInt(e.target.value) * 10)}
```

---

## چک‌لیست تست

- [ ] دریافت محصول بدون تنوع
- [ ] دریافت محصول با تنوع
- [ ] ویرایش عنوان محصول
- [ ] ویرایش قیمت محصول
- [ ] ویرایش موجودی محصول
- [ ] ویرایش قیمت تنوع‌ها
- [ ] ویرایش موجودی تنوع‌ها
- [ ] کپی بدون ویرایش
- [ ] کپی با ویرایش
- [ ] تبدیل صحیح تومان/ریال
- [ ] نمایش پیام موفقیت
- [ ] نمایش پیام خطا

---

## منابع

- [API Endpoints](./API-ENDPOINTS.json)
- [Design System Rules](./.kiro/steering/design-system.md)
- [Payment Guide](./PAYMENT_FRONTEND_GUIDE.md)
