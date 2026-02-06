# رفع مشکل ارسال تصاویر اضافی در کپی محصول از باسلام

## مشکل

وقتی محصولی از باسلام کپی می‌شد، فقط تصویر اصلی (`photo`) ارسال می‌شد و تصاویر اضافی (`photos` array) ارسال نمی‌شدند.

## ساختار داده دریافتی از باسلام

```json
{
  "success": true,
  "product_id": "6768422",
  "data": {
    "id": 6768422,
    "title": "روکش صندلی سمند...",
    "price": 23670000,
    "photo": {
      "id": 246268435,
      "original": "https://statics.basalam.com/.../image1.jpg",
      "xs": "https://...",
      "sm": "https://...",
      "md": "https://...",
      "lg": "https://..."
    },
    "photos": [
      {
        "id": 251842486,
        "original": "https://statics.basalam.com/.../image2.jpg",
        "xs": "https://...",
        "sm": "https://...",
        "md": "https://...",
        "lg": "https://..."
      },
      {
        "id": 251842492,
        "original": "https://statics.basalam.com/.../image3.jpg",
        ...
      }
    ]
  }
}
```

## راه حل پیاده شده (Frontend)

### 1. تغییر در `src/lib/api.ts`

```typescript
copyProductFromBasalam: async (productId: string | number, productData?: any) => {
  // اگر productData ارسال شده، آن را در body قرار بده
  const body = productData ? JSON.stringify({ product_data: productData }) : undefined;
  return apiRequest<any>(`/product/${productId}/copy`, { 
    method: "POST",
    body
  });
}
```

**تغییرات:**
- پارامتر `productData` اضافه شد (optional)
- اگر `productData` ارسال شود، در body با کلید `product_data` قرار می‌گیرد

### 2. تغییر در `src/app/dashboard/copy-product/basalam/page.tsx`

```typescript
const handleConfirmCopy = async () => {
  if (!extractedProductId || !productData) return;

  // کپی محصول با ارسال تمام داده‌ها (شامل تصاویر اضافی)
  const response = await productsApi.copyProductFromBasalam(extractedProductId, productData);
  
  // ...
};
```

**تغییرات:**
- چک کردن `productData` در شرط
- ارسال `productData` به تابع `copyProductFromBasalam`

## درخواست POST جدید

### قبل از تغییر
```http
POST /api/product/6768422/copy
Headers:
  X-Encrypted-Token: {token}
  Content-Type: application/json

Body: (empty)
```

### بعد از تغییر
```http
POST /api/product/6768422/copy
Headers:
  X-Encrypted-Token: {token}
  Content-Type: application/json

Body:
{
  "product_data": {
    "id": 6768422,
    "title": "روکش صندلی سمند...",
    "price": 23670000,
    "photo": { ... },
    "photos": [
      { "id": 251842486, "original": "https://...", ... },
      { "id": 251842492, "original": "https://...", ... }
    ],
    "variants": [ ... ],
    "description": "...",
    ...
  }
}
```

## تغییرات مورد نیاز در Backend

Backend باید تغییرات زیر را اعمال کند:

### 1. دریافت `product_data` از body

```python
@app.post("/api/product/{product_id}/copy")
async def copy_product_from_basalam(product_id: str, request: Request):
    body = await request.json()
    product_data = body.get("product_data")
    
    # اگر product_data ارسال شده، از آن استفاده کن
    if product_data:
        # استفاده مستقیم از داده‌های ارسالی
        photos = product_data.get("photos", [])
        main_photo = product_data.get("photo")
    else:
        # روش قبلی: دریافت از API باسلام
        product_data = await fetch_from_basalam(product_id)
        photos = product_data.get("photos", [])
        main_photo = product_data.get("photo")
```

### 2. ذخیره تمام تصاویر

```python
# ذخیره تصویر اصلی
if main_photo:
    save_product_image(product_id, main_photo, is_main=True)

# ذخیره تصاویر اضافی
for idx, photo in enumerate(photos):
    save_product_image(product_id, photo, is_main=False, order=idx)
```

### 3. مثال کامل

```python
async def save_product_with_images(product_data: dict, target_vendor_id: str):
    """
    ذخیره محصول با تمام تصاویر
    """
    # ذخیره اطلاعات اصلی محصول
    product = {
        "title": product_data.get("title"),
        "price": product_data.get("price"),
        "primary_price": product_data.get("primary_price"),
        "inventory": product_data.get("inventory"),
        "description": product_data.get("description"),
        # ...
    }
    
    # ایجاد محصول در دیتابیس
    new_product_id = await create_product(product, target_vendor_id)
    
    # ذخیره تصویر اصلی
    main_photo = product_data.get("photo")
    if main_photo:
        await save_image(
            product_id=new_product_id,
            image_url=main_photo.get("original"),
            is_main=True,
            order=0
        )
    
    # ذخیره تصاویر اضافی
    photos = product_data.get("photos", [])
    for idx, photo in enumerate(photos):
        await save_image(
            product_id=new_product_id,
            image_url=photo.get("original"),
            is_main=False,
            order=idx + 1
        )
    
    # ذخیره variants (اگر وجود دارد)
    variants = product_data.get("variants", [])
    for variant in variants:
        await save_variant(new_product_id, variant)
    
    return new_product_id
```

## نکات مهم برای Backend

1. **Backward Compatibility**: اگر `product_data` در body نباشد، از روش قبلی (دریافت از API باسلام) استفاده کن
2. **Validation**: داده‌های دریافتی را validate کن
3. **Image Download**: تصاویر را از URL های باسلام دانلود و در سرور خودت ذخیره کن
4. **Error Handling**: اگر دانلود تصویری ناموفق بود، آن را skip کن و ادامه بده
5. **Transaction**: از transaction استفاده کن تا در صورت خطا، rollback شود

## تست

### تست Frontend
```bash
# در browser console
1. به صفحه کپی محصول برو
2. لینک محصول باسلام را وارد کن
3. در Network tab، درخواست POST را بررسی کن
4. باید body شامل product_data باشد
```

### تست Backend
```python
# تست با curl
curl -X POST "https://peyvandyar.amintvk.ir/api/product/6768422/copy" \
  -H "X-Encrypted-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_data": {
      "id": 6768422,
      "title": "Test Product",
      "photo": {"original": "https://..."},
      "photos": [
        {"original": "https://..."},
        {"original": "https://..."}
      ]
    }
  }'
```

## چک لیست

- [x] Frontend: اضافه کردن پارامتر `productData` به `copyProductFromBasalam`
- [x] Frontend: ارسال `productData` در `handleConfirmCopy`
- [ ] Backend: دریافت `product_data` از request body
- [ ] Backend: ذخیره تصویر اصلی (`photo`)
- [ ] Backend: ذخیره تصاویر اضافی (`photos` array)
- [ ] Backend: حفظ backward compatibility
- [ ] Backend: اضافه کردن error handling
- [ ] Test: تست کامل فرآیند کپی محصول

## مزایای این راه حل

1. **کاهش درخواست‌های API**: دیگر نیازی نیست backend دوباره از باسلام بگیرد
2. **سرعت بیشتر**: داده‌ها از قبل در frontend موجود است
3. **اطمینان از یکسان بودن**: دقیقاً همان داده‌ای که کاربر دید، ذخیره می‌شود
4. **Backward Compatible**: اگر frontend قدیمی باشد، backend همچنان کار می‌کند

## مثال Response موفق

```json
{
  "success": true,
  "message": "محصول با موفقیت کپی شد",
  "data": {
    "id": 12345,
    "copied_from": 6768422,
    "title": "روکش صندلی سمند...",
    "images_count": 5,
    "main_image": "https://your-server.com/images/12345_main.jpg",
    "additional_images": [
      "https://your-server.com/images/12345_1.jpg",
      "https://your-server.com/images/12345_2.jpg",
      "https://your-server.com/images/12345_3.jpg",
      "https://your-server.com/images/12345_4.jpg"
    ]
  }
}
```
