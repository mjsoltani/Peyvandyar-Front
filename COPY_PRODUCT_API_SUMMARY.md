# خلاصه API های کپی محصول

## 1. کپی محصول از باسلام (دو مرحله‌ای)

### مرحله 1: دریافت اطلاعات محصول
```http
GET /api/product/{product_id}
```

**Headers:**
```
X-Encrypted-Token: {encrypted_token}
```

**مثال:**
```typescript
const response = await productsApi.getProductFromBasalam("22303639");
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 22303639,
    "title": "نام محصول",
    "primary_price": 15000000,
    "inventory": 10,
    "photo": {
      "original": "https://...",
      "lg": "https://...",
      "md": "https://...",
      "sm": "https://...",
      "xs": "https://..."
    },
    "sku": "SKU123",
    "unit_type": {
      "name": "عدد"
    },
    "status": {
      "name": "در دسترس"
    }
  }
}
```

### مرحله 2: کپی محصول (بعد از تایید کاربر)
```http
POST /api/product/{product_id}/copy
```

**Headers:**
```
X-Encrypted-Token: {encrypted_token}
```

**مثال:**
```typescript
const response = await productsApi.copyProductFromBasalam("22303639");
```

**Response:**
```json
{
  "success": true,
  "message": "Product copied successfully",
  "data": {
    "id": 12345,
    "copied_from": 22303639,
    "title": "نام محصول"
  }
}
```

---

## 2. کپی محصول داخلی (از همان فروشگاه)

```http
POST /api/products/{product_id}/copy
```

**Headers:**
```
X-Encrypted-Token: {encrypted_token}
```

**مثال:**
```typescript
const response = await productsApi.copyProduct(12345);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 67890,
    "title": "کپی از: نام محصول"
  }
}
```

---

## تفاوت‌های کلیدی

| ویژگی | کپی از باسلام | کپی داخلی |
|-------|---------------|-----------|
| Endpoint | `/api/product/{id}/copy` | `/api/products/{id}/copy` |
| مرحله اول | GET برای پیش‌نمایش | - |
| تایید کاربر | ✅ نیاز دارد | ❌ مستقیم |
| منبع | محصول باسلام | محصول فروشگاه خودی |

---

## نحوه استفاده در کد

### کپی از باسلام (دو مرحله)

```typescript
// مرحله 1: دریافت اطلاعات
const productData = await productsApi.getProductFromBasalam(productId);

// نمایش به کاربر و دریافت تایید
if (userConfirmed) {
  // مرحله 2: کپی محصول
  const result = await productsApi.copyProductFromBasalam(productId);
}
```

### کپی داخلی (یک مرحله)

```typescript
// مستقیم کپی می‌شود
const result = await productsApi.copyProduct(productId);
```

---

## Authentication

همه API ها نیاز به توکن دارند که به صورت خودکار از localStorage خوانده شده و در header ارسال می‌شود:

```typescript
// در api.ts
const token = getAuthToken();
headers.set("X-Encrypted-Token", token);
```

---

## Error Handling

```typescript
try {
  const response = await productsApi.copyProductFromBasalam(productId);
  
  if (response.success) {
    // موفق
  } else {
    // خطا از سمت سرور
    setError(response.message || "خطا در کپی محصول");
  }
} catch (error: any) {
  // خطای شبکه یا 401/403
  setError(error.message || "خطا در ارتباط با سرور");
}
```

---

## استخراج Product ID از URL

```typescript
function extractProductId(url: string): string | null {
  const patterns = [
    /basalam\.com\/p\/(\d+)/,                    // /p/22303639
    /basalam\.com\/[^/]+\/product\/(\d+)/,       // /helmet/product/11347802
    /basalam\.com\/product\/(\d+)/,              // /product/12345
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}
```

**مثال‌ها:**
- `https://basalam.com/p/22303639?utm_source=share` → `22303639`
- `https://basalam.com/helmet/product/11347802` → `11347802`
- `https://basalam.com/product/12345` → `12345`

---

## نکات مهم

1. **توکن الزامی است**: همه API ها نیاز به `X-Encrypted-Token` دارند
2. **دو endpoint متفاوت**: `/api/product/` برای باسلام، `/api/products/` برای داخلی
3. **تایید کاربر**: فقط برای کپی از باسلام نیاز است
4. **قیمت**: در response به ریال است، باید به تومان تبدیل شود (تقسیم بر 10)
5. **تصویر**: چند سایز مختلف در دسترس است (original, lg, md, sm, xs)
