# ساختار Response محصول

## GET /api/product/{product_id}

### Response کامل با Variants

```json
{
  "success": true,
  "product_id": "26771208",
  "data": {
    "id": 26771208,
    "title": "مانتو کتی ژاکارد نخ کوکدوزی",
    "primary_price": 35300000,
    "inventory": 42,
    "sku": "SKU-12345",
    "unit_type": {
      "name": "عدد"
    },
    "status": {
      "name": "در دسترس"
    },
    "photo": {
      "original": "https://...",
      "lg": "https://...",
      "md": "https://...",
      "sm": "https://...",
      "xs": "https://..."
    },
    "variants": [
      {
        "id": 10686835,
        "title": "سایز M - رنگ قرمز",
        "primary_price": 7350000,
        "inventory": 10,
        "sku": "SKU-M-RED"
      },
      {
        "id": 10686836,
        "title": "سایز L - رنگ آبی",
        "primary_price": 7350000,
        "inventory": 5,
        "sku": "SKU-L-BLUE"
      }
    ]
  }
}
```

## نمایش در UI

### اطلاعات اصلی محصول
- عنوان
- قیمت پایه (تبدیل به تومان)
- موجودی
- SKU
- واحد (unit_type)
- وضعیت (status)
- شناسه محصول

### تنوع‌ها (Variants)
برای هر variant:
- عنوان
- قیمت (تبدیل به تومان)
- موجودی
- SKU

### خلاصه
- نام محصول
- تعداد تنوع‌ها
- پیغام تایید
