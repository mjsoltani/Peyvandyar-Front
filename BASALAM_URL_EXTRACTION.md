# استخراج Product ID از URL های باسلام

## تابع extractProductId

این تابع product_id را از انواع مختلف URL های باسلام استخراج می‌کند.

## الگوهای پشتیبانی شده

### 1. فرمت کوتاه با /p/
```
https://basalam.com/p/22303639?utm_source=share&utm_medium=copy
```
**Product ID:** `22303639`

### 2. فرمت با نام فروشگاه
```
https://basalam.com/helmet/product/11347802
```
**Product ID:** `11347802`

### 3. فرمت ساده
```
https://basalam.com/product/12345
```
**Product ID:** `12345`

## پیاده‌سازی

```typescript
function extractProductId(url: string): string | null {
  try {
    url = url.trim();
    
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
  } catch (error) {
    console.error("Error extracting product ID:", error);
    return null;
  }
}
```

## نحوه استفاده

```typescript
const productId = extractProductId(userInputUrl);

if (!productId) {
  setError("شناسه محصول در لینک یافت نشد");
  return;
}

// ارسال به API
const response = await productsApi.copyProductFromUrl(productId);
```

## API Endpoint

```
POST /api/product/{product_id}
```

### Request
```typescript
await productsApi.copyProductFromUrl("22303639");
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 22303639,
    "title": "نام محصول",
    ...
  }
}
```

## مثال‌های تست

| URL | Product ID | وضعیت |
|-----|-----------|-------|
| `https://basalam.com/p/22303639` | `22303639` | ✅ |
| `https://basalam.com/p/22303639?utm_source=share` | `22303639` | ✅ |
| `https://basalam.com/helmet/product/11347802` | `11347802` | ✅ |
| `https://basalam.com/product/12345` | `12345` | ✅ |
| `https://basalam.com/shop/helmet` | `null` | ❌ |
| `https://example.com/product/123` | `null` | ❌ |

## مدیریت خطا

```typescript
// بررسی وجود basalam.com
if (!productUrl.includes("basalam.com")) {
  setError("لینک وارد شده معتبر نیست");
  return;
}

// بررسی استخراج product_id
const productId = extractProductId(productUrl);
if (!productId) {
  setError("شناسه محصول در لینک یافت نشد");
  return;
}
```

## ویژگی‌های امنیتی

1. **Trim کردن ورودی**: فضاهای خالی حذف می‌شوند
2. **Try-Catch**: خطاها handle می‌شوند
3. **Validation**: فقط عدد استخراج می‌شود (`\d+`)
4. **Domain Check**: فقط basalam.com پذیرفته می‌شود

## نکات مهم

- تابع فقط عدد (product_id) را برمی‌گرداند
- Query parameters نادیده گرفته می‌شوند
- نام فروشگاه در URL اهمیتی ندارد
- اگر product_id پیدا نشد، `null` برمی‌گرداند
