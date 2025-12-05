# فرآیند کپی محصول از باسلام

## فلوچارت دو مرحله‌ای

```
کاربر لینک را وارد می‌کند
         ↓
استخراج product_id از URL
         ↓
GET /api/product/{product_id}
(با X-Encrypted-Token)
         ↓
نمایش پیش‌نمایش محصول
         ↓
کاربر تایید می‌کند
         ↓
POST /api/product/{product_id}/copy
(با X-Encrypted-Token)
         ↓
محصول کپی شد ✅
```

## مرحله 1: دریافت اطلاعات محصول

### API Call
```typescript
GET /api/product/{product_id}
```

### کد
```typescript
const handleFetchProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // استخراج product_id
  const productId = extractProductId(productUrl);
  
  // دریافت اطلاعات
  const response = await productsApi.getProductFromBasalam(productId);
  
  if (response.success) {
    setProductData(response.data);
    setExtractedProductId(productId);
  }
};
```

### Response مورد انتظار
```json
{
  "success": true,
  "data": {
    "id": 22303639,
    "title": "نام محصول",
    "primary_price": 1500000,
    "inventory": 10,
    "photo": {
      "original": "https://...",
      "lg": "https://...",
      "md": "https://...",
      "sm": "https://...",
      "xs": "https://..."
    }
  }
}
```

## مرحله 2: کپی محصول (بعد از تایید)

### API Call
```typescript
POST /api/product/{product_id}/copy
```

### کد
```typescript
const handleConfirmCopy = async () => {
  const response = await productsApi.copyProductFromBasalam(extractedProductId);
  
  if (response.success) {
    setSuccess(true);
    // پاکسازی فرم
    setProductUrl("");
    setProductData(null);
  }
};
```

### نکته مهم
توکن به صورت خودکار از localStorage خوانده شده و در header `X-Encrypted-Token` ارسال می‌شود:
```typescript
// در apiRequest تابع
const token = getAuthToken();
headers.set("X-Encrypted-Token", token);
```

## UI Components

### 1. فرم ورود URL (مرحله 1)
```tsx
<form onSubmit={handleFetchProduct}>
  <input
    type="text"
    value={productUrl}
    placeholder="https://basalam.com/product/..."
  />
  <button type="submit">
    دریافت اطلاعات محصول
  </button>
</form>
```

### 2. پیش‌نمایش محصول (مرحله 2)
```tsx
{productData && (
  <div className="product-preview">
    {/* تصویر محصول */}
    <img src={productData.photo.md} alt={productData.title} />
    
    {/* اطلاعات محصول */}
    <div>
      <p>عنوان: {productData.title}</p>
      <p>قیمت: {formatPrice(productData.primary_price)}</p>
      <p>موجودی: {productData.inventory}</p>
      <p>شناسه: {extractedProductId}</p>
    </div>
    
    {/* دکمه‌های عملیات */}
    <button onClick={handleCancel}>لغو</button>
    <button onClick={handleConfirmCopy}>تایید و کپی محصول</button>
  </div>
)}
```

## State Management

```typescript
// URL ورودی کاربر
const [productUrl, setProductUrl] = useState("");

// داده‌های محصول دریافت شده
const [productData, setProductData] = useState<any>(null);

// product_id استخراج شده
const [extractedProductId, setExtractedProductId] = useState<string | null>(null);

// وضعیت‌های loading
const [isLoading, setIsLoading] = useState(false);      // مرحله 1
const [isCopying, setIsCopying] = useState(false);      // مرحله 2

// پیغام‌ها
const [error, setError] = useState("");
const [success, setSuccess] = useState(false);
```

## توابع اصلی

### extractProductId
استخراج product_id از URL

### handleFetchProduct
دریافت اطلاعات محصول (GET)

### handleConfirmCopy
کپی محصول بعد از تایید (POST)

### handleCancel
لغو و بازگشت به فرم

### formatPrice
تبدیل ریال به تومان و فرمت فارسی

## مدیریت خطا

```typescript
// خطای URL نامعتبر
if (!productUrl.includes("basalam.com")) {
  setError("لینک وارد شده معتبر نیست");
}

// خطای عدم یافتن product_id
if (!productId) {
  setError("شناسه محصول در لینک یافت نشد");
}

// خطای API
catch (err: any) {
  setError(err.message || "خطا در دریافت اطلاعات");
}
```

## تجربه کاربری

### مرحله 1: ورود URL
- کاربر URL را وارد می‌کند
- دکمه "دریافت اطلاعات محصول" کلیک می‌شود
- Loading state نمایش داده می‌شود
- اطلاعات محصول دریافت می‌شود

### مرحله 2: بررسی و تایید
- پیش‌نمایش محصول با تصویر نمایش داده می‌شود
- کاربر اطلاعات را بررسی می‌کند
- دو گزینه: "لغو" یا "تایید و کپی محصول"
- در صورت تایید، محصول کپی می‌شود

### بعد از کپی موفق
- پیغام موفقیت نمایش داده می‌شود
- فرم پاک می‌شود
- کاربر می‌تواند محصول دیگری را کپی کند

## API Endpoints

### GET /api/product/{product_id}
دریافت اطلاعات محصول برای پیش‌نمایش

**Headers:**
```
X-Encrypted-Token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 22303639,
    "title": "...",
    "primary_price": 1500000,
    "inventory": 10,
    "photo": {...}
  }
}
```

### POST /api/product/{product_id}/copy
کپی محصول به فروشگاه

**Headers:**
```
X-Encrypted-Token: {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Product copied successfully",
  "data": {
    "id": 12345,
    "copied_from": 22303639
  }
}
```

## نکات مهم

1. **دو مرحله جداگانه**: GET برای پیش‌نمایش، POST برای کپی
2. **تایید کاربر**: کاربر باید محصول را ببیند و تایید کند
3. **Loading States**: دو state جداگانه برای هر مرحله
4. **پاکسازی**: بعد از کپی موفق، فرم پاک می‌شود
5. **لغو**: کاربر می‌تواند در مرحله 2 لغو کند و به مرحله 1 برگردد
