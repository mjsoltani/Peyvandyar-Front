# خلاصه رفع مشکل تصاویر اضافی

## مشکل
فقط تصویر اصلی کپی می‌شد، تصاویر اضافی (`photos` array) کپی نمی‌شدند.

## راه حل

### تغییرات Frontend (انجام شده ✅)

1. **`src/lib/api.ts`**: تابع `copyProductFromBasalam` حالا تمام داده‌های محصول را می‌فرستد
2. **`src/app/dashboard/copy-product/basalam/page.tsx`**: هنگام کپی، `productData` کامل ارسال می‌شود

### تغییرات Backend (باید انجام شود ⏳)

Backend باید:
1. `product_data` را از body دریافت کند
2. آرایه `photos` را پردازش کند
3. تمام تصاویر را ذخیره کند

## درخواست جدید

```json
POST /api/product/6768422/copy

Body:
{
  "product_data": {
    "id": 6768422,
    "title": "...",
    "photo": { "original": "https://..." },
    "photos": [
      { "original": "https://..." },
      { "original": "https://..." }
    ]
  }
}
```

## کد نمونه Backend (Python)

```python
@app.post("/api/product/{product_id}/copy")
async def copy_product(product_id: str, request: Request):
    body = await request.json()
    product_data = body.get("product_data")
    
    if product_data:
        # استفاده از داده‌های ارسالی
        main_photo = product_data.get("photo")
        photos = product_data.get("photos", [])
        
        # ذخیره تصویر اصلی
        if main_photo:
            save_image(main_photo["original"], is_main=True)
        
        # ذخیره تصاویر اضافی
        for photo in photos:
            save_image(photo["original"], is_main=False)
```

## نتیجه

✅ Frontend: تمام تصاویر را می‌فرستد  
⏳ Backend: باید تمام تصاویر را ذخیره کند

جزئیات بیشتر در فایل `BASALAM_PHOTOS_FIX.md`
