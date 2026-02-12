# 🚨 تسک فوری: رفع مشکل عدم کپی تصاویر اضافی

## ❌ مشکل فعلی

وقتی محصولی از باسلام کپی میشه، فقط تصویر اصلی کپی میشه و `photos` array خالی برمیگرده:

```json
{
  "success": true,
  "new_product": {
    "photo": { ... },  // ✅ این کپی میشه
    "photos": []       // ❌ این خالیه!
  }
}
```

---

## 📊 داده‌های ارسالی از Frontend

Frontend داره این داده رو می‌فرسته:

```http
POST /api/product/25269714/copy
Content-Type: application/json
X-Encrypted-Token: ...

Body:
{
  "product_data": {
    "id": 25269714,
    "title": "کولر پرتابل...",
    "photo": {
      "id": 247751779,
      "original": "https://statics.basalam.com/.../image1.jpg",
      "xs": "...",
      "sm": "...",
      "md": "...",
      "lg": "..."
    },
    "photos": [
      {
        "id": 251842486,
        "original": "https://statics.basalam.com/.../image2.jpg",
        "xs": "...",
        "sm": "...",
        "md": "...",
        "lg": "..."
      },
      {
        "id": 251842492,
        "original": "https://statics.basalam.com/.../image3.jpg",
        ...
      },
      {
        "id": 246268431,
        "original": "https://statics.basalam.com/.../image4.jpg",
        ...
      }
    ],
    "variants": [...],
    ...
  }
}
```

---

## 🔧 کد Backend فعلی (حدس)

احتمالاً کد فعلی Backend اینطوریه:

```python
@app.post("/api/product/{product_id}/copy")
async def copy_product(product_id: str, request: Request):
    body = await request.json()
    product_data = body.get("product_data")
    
    # دریافت اطلاعات محصول
    if product_data:
        title = product_data.get("title")
        price = product_data.get("price")
        photo = product_data.get("photo")  # ✅ این رو میگیره
        # photos = product_data.get("photos", [])  # ❌ این خط نیست!
    
    # ساخت محصول جدید
    new_product = create_product(
        title=title,
        price=price,
        photo_url=photo["original"]  # ✅ فقط تصویر اصلی
    )
    
    # ❌ تصاویر اضافی ذخیره نمیشن!
    
    return {
        "success": True,
        "new_product": new_product
    }
```

---

## ✅ راه حل: کد اصلاح شده

```python
@app.post("/api/product/{product_id}/copy")
async def copy_product(product_id: str, request: Request):
    body = await request.json()
    product_data = body.get("product_data")
    
    if not product_data:
        raise HTTPException(status_code=400, detail="product_data is required")
    
    # دریافت اطلاعات
    title = product_data.get("title")
    price = product_data.get("price")
    main_photo = product_data.get("photo")
    additional_photos = product_data.get("photos", [])  # ← این خط رو اضافه کن
    
    # ساخت محصول جدید
    new_product = create_product(
        title=title,
        price=price,
        photo_url=main_photo["original"] if main_photo else None
    )
    
    # ← این بخش رو اضافه کن
    # ذخیره تصاویر اضافی
    if additional_photos and len(additional_photos) > 0:
        for idx, photo in enumerate(additional_photos):
            try:
                # دانلود و ذخیره تصویر
                photo_url = photo.get("original")
                if photo_url:
                    # فراخوانی API باسلام برای اضافه کردن تصویر
                    add_product_photo(
                        product_id=new_product["id"],
                        photo_url=photo_url,
                        order=idx + 1
                    )
            except Exception as e:
                print(f"Error adding photo {idx}: {e}")
                # ادامه بده حتی اگر یک تصویر خطا داد
                continue
    
    # دریافت محصول با تصاویر جدید
    updated_product = get_product_details(new_product["id"])
    
    return {
        "success": True,
        "message": f"Product copied with {len(additional_photos)} additional photos",
        "new_product": updated_product,
        "photos_added": len(additional_photos)
    }
```

---

## 🔌 تابع کمکی: اضافه کردن تصویر به محصول

```python
async def add_product_photo(product_id: int, photo_url: str, order: int = 0):
    """
    اضافه کردن تصویر به محصول از طریق API باسلام
    """
    # دانلود تصویر از URL
    async with httpx.AsyncClient() as client:
        response = await client.get(photo_url)
        if response.status_code != 200:
            raise Exception(f"Failed to download image: {response.status_code}")
        
        image_data = response.content
    
    # آپلود تصویر به باسلام
    files = {
        'photo': ('image.jpg', image_data, 'image/jpeg')
    }
    
    basalam_response = await basalam_api_call(
        method="POST",
        endpoint=f"/api/v2/products/{product_id}/photos",
        files=files
    )
    
    return basalam_response
```

---

## 📝 مثال کامل با Error Handling

```python
@app.post("/api/product/{product_id}/copy")
async def copy_product(product_id: str, request: Request):
    try:
        body = await request.json()
        product_data = body.get("product_data")
        
        if not product_data:
            raise HTTPException(status_code=400, detail="product_data is required")
        
        # استخراج اطلاعات
        title = product_data.get("title")
        price = product_data.get("price")
        main_photo = product_data.get("photo")
        additional_photos = product_data.get("photos", [])
        
        print(f"Copying product: {title}")
        print(f"Main photo: {main_photo.get('original') if main_photo else 'None'}")
        print(f"Additional photos: {len(additional_photos)}")
        
        # ساخت محصول
        new_product = await create_product_in_basalam(
            title=title,
            price=price,
            photo_url=main_photo["original"] if main_photo else None,
            description=product_data.get("description"),
            inventory=product_data.get("inventory"),
            # ... سایر فیلدها
        )
        
        new_product_id = new_product["id"]
        photos_added = 0
        photos_failed = 0
        
        # اضافه کردن تصاویر اضافی
        if additional_photos:
            for idx, photo in enumerate(additional_photos):
                try:
                    photo_url = photo.get("original")
                    if not photo_url:
                        continue
                    
                    print(f"Adding photo {idx + 1}/{len(additional_photos)}: {photo_url}")
                    
                    await add_product_photo(
                        product_id=new_product_id,
                        photo_url=photo_url,
                        order=idx + 1
                    )
                    
                    photos_added += 1
                    
                except Exception as e:
                    print(f"Failed to add photo {idx}: {str(e)}")
                    photos_failed += 1
                    continue
        
        # دریافت محصول نهایی با تمام تصاویر
        final_product = await get_product_from_basalam(new_product_id)
        
        return {
            "success": True,
            "message": f"Product copied successfully with {photos_added} photos",
            "original_product_id": product_id,
            "new_product": final_product,
            "stats": {
                "photos_added": photos_added,
                "photos_failed": photos_failed,
                "total_photos": len(additional_photos)
            }
        }
        
    except Exception as e:
        print(f"Error copying product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🧪 تست

### تست 1: محصول با 3 تصویر اضافی

```bash
curl -X POST "https://peyvandyar.amintvk.ir/api/product/25269714/copy" \
  -H "X-Encrypted-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_data": {
      "title": "Test Product",
      "photo": {"original": "https://..."},
      "photos": [
        {"original": "https://..."},
        {"original": "https://..."},
        {"original": "https://..."}
      ]
    }
  }'
```

**Response مورد انتظار:**
```json
{
  "success": true,
  "message": "Product copied successfully with 3 photos",
  "new_product": {
    "id": 37570551,
    "photos": [
      {"original": "https://..."},
      {"original": "https://..."},
      {"original": "https://..."}
    ]
  },
  "stats": {
    "photos_added": 3,
    "photos_failed": 0,
    "total_photos": 3
  }
}
```

---

## ✅ Checklist

- [ ] دریافت `photos` array از `product_data`
- [ ] Loop روی هر تصویر در array
- [ ] دانلود هر تصویر از URL باسلام
- [ ] آپلود تصویر به محصول جدید
- [ ] Error handling برای تصاویری که fail میشن
- [ ] برگرداندن محصول نهایی با تمام تصاویر
- [ ] لاگ کردن تعداد تصاویر موفق/ناموفق

---

## 🔍 Debug

برای debug کردن، این لاگ‌ها رو اضافه کن:

```python
print(f"[DEBUG] product_data keys: {product_data.keys()}")
print(f"[DEBUG] photos in product_data: {len(product_data.get('photos', []))}")
print(f"[DEBUG] First photo URL: {product_data.get('photos', [{}])[0].get('original', 'N/A')}")
```

---

## ⏱️ تخمین زمان

- **پیاده‌سازی**: 2-3 ساعت
- **تست**: 1 ساعت
- **جمع**: 3-4 ساعت

---

## 📞 نکته مهم

اگر API باسلام محدودیت rate limit داره، باید:
1. بین هر آپلود تصویر یک delay بذاری (مثلاً 500ms)
2. از async/await استفاده کنی برای بهینه‌سازی

```python
import asyncio

for idx, photo in enumerate(additional_photos):
    await add_product_photo(...)
    await asyncio.sleep(0.5)  # 500ms delay
```

---

**اولویت**: 🔴 Critical  
**تاریخ**: 2026-02-09  
**مشکل**: تصاویر اضافی کپی نمیشن
