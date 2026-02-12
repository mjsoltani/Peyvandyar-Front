# 🐛 باگ: تصاویر اضافی کپی نمیشن

## مشکل
```json
// Response فعلی
{
  "new_product": {
    "photo": {...},    // ✅ کپی میشه
    "photos": []       // ❌ خالیه!
  }
}
```

## علت
Backend داره `photos` array رو از `product_data` نادیده میگیره.

## راه حل

### قبل:
```python
photo = product_data.get("photo")  # فقط تصویر اصلی
```

### بعد:
```python
photo = product_data.get("photo")
photos = product_data.get("photos", [])  # ← این خط رو اضافه کن

# حالا photos رو هم ذخیره کن
for idx, photo in enumerate(photos):
    add_product_photo(new_product_id, photo["original"])
```

## تست
```bash
# محصولی که 5 تا عکس داره
curl -X POST "https://peyvandyar.amintvk.ir/api/product/25269714/copy"

# Response باید photos پر باشه:
{
  "new_product": {
    "photos": [
      {"original": "https://..."},
      {"original": "https://..."},
      ...
    ]
  }
}
```

## جزئیات بیشتر
فایل `BACKEND_URGENT_FIX_PHOTOS.md` رو ببین.
