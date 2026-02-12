# تسک Backend: اضافه کردن قابلیت جستجو به API محصولات

## 📋 خلاصه تسک
اضافه کردن پارامتر `search` به endpoint محصولات برای جستجوی سمت سرور

---

## 🎯 هدف
کاربران باید بتوانند در لیست محصولات جستجو کنند. فعلاً API فقط pagination دارد و قابلیت search ندارد.

---

## 📍 Endpoint مورد نظر

```
GET /api/products
```

---

## 🔧 تغییرات مورد نیاز

### 1. اضافه کردن Query Parameter جدید

**قبل:**
```
GET /api/products?page=1&per_page=10
```

**بعد:**
```
GET /api/products?page=1&per_page=10&search=روکش
```

### 2. پارامترهای Query

| پارامتر | نوع | الزامی | پیش‌فرض | توضیحات |
|---------|-----|--------|---------|---------|
| `page` | integer | خیر | 1 | شماره صفحه |
| `per_page` | integer | خیر | 10 | تعداد محصول در هر صفحه |
| `search` | string | خیر | null | عبارت جستجو |

---

## 💻 پیاده‌سازی (Python/FastAPI)

### کد نمونه:

```python
from fastapi import Query
from sqlalchemy import or_
from math import ceil

@app.get("/api/products")
async def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: str = Query(None, min_length=1, max_length=200),
    token: str = Header(None, alias="X-Encrypted-Token")
):
    """
    دریافت لیست محصولات با قابلیت جستجو
    
    Args:
        page: شماره صفحه (پیش‌فرض: 1)
        per_page: تعداد محصول در هر صفحه (پیش‌فرض: 10، حداکثر: 100)
        search: عبارت جستجو (اختیاری)
        token: توکن احراز هویت
    
    Returns:
        لیست محصولات با pagination
    """
    
    # احراز هویت
    user = await verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Query پایه
    query = db.query(Product).filter(Product.vendor_id == user.vendor_id)
    
    # اعمال فیلتر جستجو (اگر وجود داشت)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_term),           # جستجو در عنوان
                Product.description.ilike(search_term),     # جستجو در توضیحات
                Product.sku.ilike(search_term)              # جستجو در SKU
            )
        )
    
    # محاسبه تعداد کل (بعد از اعمال فیلتر)
    total = query.count()
    
    # محاسبه تعداد صفحات
    last_page = ceil(total / per_page) if total > 0 else 1
    
    # اعمال pagination
    offset = (page - 1) * per_page
    products = query.offset(offset).limit(per_page).all()
    
    # تبدیل به dict
    products_data = [
        {
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "primary_price": p.primary_price,
            "inventory": p.inventory,
            "status": {
                "name": p.status_name,
                "value": p.status_value
            },
            "photo": p.photo,
            "description": p.description,
            "sku": p.sku
        }
        for p in products
    ]
    
    return {
        "success": True,
        "vendor_id": user.vendor_id,
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total": total,
            "last_page": last_page
        },
        "data": {
            "data": products_data
        }
    }
```

---

## 📊 مثال‌های Request/Response

### مثال 1: بدون جستجو (رفتار فعلی)

**Request:**
```http
GET /api/products?page=1&per_page=10
Headers:
  X-Encrypted-Token: a1b2c3d4e5f6:9f8e7d6c5b4a3210...
```

**Response:**
```json
{
  "success": true,
  "vendor_id": 1105867,
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 150,
    "last_page": 15
  },
  "data": {
    "data": [
      {
        "id": 27722241,
        "title": "روکش صندلی پراید",
        "price": 2367000,
        "primary_price": 2630000,
        "inventory": 10,
        "status": {
          "name": "در دسترس",
          "value": 2976
        },
        "photo": {...},
        "description": "روکش صندلی با کیفیت عالی",
        "sku": "PRIDE-001"
      }
    ]
  }
}
```

### مثال 2: با جستجو

**Request:**
```http
GET /api/products?page=1&per_page=10&search=روکش
Headers:
  X-Encrypted-Token: a1b2c3d4e5f6:9f8e7d6c5b4a3210...
```

**Response:**
```json
{
  "success": true,
  "vendor_id": 1105867,
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 23,
    "last_page": 3
  },
  "data": {
    "data": [
      {
        "id": 27722241,
        "title": "روکش صندلی پراید",
        "price": 2367000,
        ...
      },
      {
        "id": 27722242,
        "title": "روکش صندلی سمند",
        "price": 2500000,
        ...
      }
    ]
  }
}
```

### مثال 3: جستجو بدون نتیجه

**Request:**
```http
GET /api/products?page=1&per_page=10&search=xyz123notfound
```

**Response:**
```json
{
  "success": true,
  "vendor_id": 1105867,
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 0,
    "last_page": 1
  },
  "data": {
    "data": []
  }
}
```

---

## ✅ Acceptance Criteria (معیارهای پذیرش)

- [ ] پارامتر `search` به endpoint اضافه شده
- [ ] جستجو در فیلدهای `title`, `description`, `sku` انجام می‌شود
- [ ] جستجو case-insensitive است (حروف بزرگ/کوچک مهم نیست)
- [ ] جستجو با حروف فارسی کار می‌کند
- [ ] pagination بعد از اعمال فیلتر جستجو درست کار می‌کند
- [ ] `total` و `last_page` بر اساس نتایج فیلتر شده محاسبه می‌شود
- [ ] اگر `search` خالی یا null باشد، همه محصولات برگردانده می‌شود
- [ ] Performance برای 10,000+ محصول قابل قبول است (< 500ms)
- [ ] API-ENDPOINTS.json آپدیت شده

---

## 🔍 فیلدهای جستجو

جستجو باید در این فیلدها انجام شود:

1. **title** (عنوان محصول) - اولویت بالا
2. **description** (توضیحات محصول) - اولویت متوسط
3. **sku** (کد محصول) - اولویت متوسط

### نکته مهم:
از `ILIKE` در PostgreSQL یا `LIKE` با `LOWER()` در MySQL استفاده کنید تا جستجو case-insensitive باشد.

---

## 🚀 Performance Considerations

### 1. اضافه کردن Index

برای بهبود سرعت جستجو، این indexها را اضافه کنید:

```sql
-- PostgreSQL
CREATE INDEX idx_products_title ON products USING gin(to_tsvector('simple', title));
CREATE INDEX idx_products_description ON products USING gin(to_tsvector('simple', description));
CREATE INDEX idx_products_sku ON products(sku);

-- یا برای MySQL
CREATE FULLTEXT INDEX idx_products_title ON products(title);
CREATE FULLTEXT INDEX idx_products_description ON products(description);
CREATE INDEX idx_products_sku ON products(sku);
```

### 2. Limit طول جستجو

```python
search: str = Query(None, min_length=1, max_length=200)
```

### 3. Caching (اختیاری)

برای جستجوهای پرتکرار می‌توانید از Redis استفاده کنید:

```python
cache_key = f"products:search:{vendor_id}:{search}:{page}:{per_page}"
cached_result = redis.get(cache_key)
if cached_result:
    return json.loads(cached_result)
```

---

## 🧪 تست‌های مورد نیاز

### 1. تست جستجوی ساده
```bash
curl -X GET "http://localhost:8000/api/products?search=روکش" \
  -H "X-Encrypted-Token: YOUR_TOKEN"
```

### 2. تست جستجو با pagination
```bash
curl -X GET "http://localhost:8000/api/products?search=روکش&page=2&per_page=5" \
  -H "X-Encrypted-Token: YOUR_TOKEN"
```

### 3. تست جستجوی خالی
```bash
curl -X GET "http://localhost:8000/api/products?search=" \
  -H "X-Encrypted-Token: YOUR_TOKEN"
```

### 4. تست بدون search parameter
```bash
curl -X GET "http://localhost:8000/api/products?page=1&per_page=10" \
  -H "X-Encrypted-Token: YOUR_TOKEN"
```

### 5. تست case-insensitive
```bash
# این دو باید نتیجه یکسان بدهند:
curl -X GET "http://localhost:8000/api/products?search=روکش"
curl -X GET "http://localhost:8000/api/products?search=روکش"
```

---

## 📝 آپدیت مستندات

بعد از پیاده‌سازی، فایل `API-ENDPOINTS.json` را آپدیت کنید:

```json
{
  "name": "Get Products",
  "method": "GET",
  "path": "/api/products",
  "auth_required": true,
  "description": "دریافت لیست محصولات با صفحه‌بندی و جستجو",
  "request": {
    "headers": {
      "X-Encrypted-Token": "a1b2c3d4e5f6:9f8e7d6c5b4a3210..."
    },
    "query_params": {
      "page": 1,
      "per_page": 10,
      "search": "روکش"
    }
  },
  "response_example": {
    "success": true,
    "vendor_id": 1105867,
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 23,
      "last_page": 3
    },
    "data": {
      "data": [...]
    }
  }
}
```

---

## ⏱️ تخمین زمان

- **پیاده‌سازی اصلی**: 1-2 ساعت
- **اضافه کردن Index**: 30 دقیقه
- **تست**: 1 ساعت
- **مستندات**: 30 دقیقه

**جمع کل**: 3-4 ساعت

---

## 🐛 مشکلات احتمالی و راه‌حل

### مشکل 1: جستجوی فارسی کار نمی‌کند
**راه‌حل**: مطمئن شوید database encoding روی UTF-8 است

```sql
ALTER DATABASE your_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### مشکل 2: جستجو خیلی کند است
**راه‌حل**: Index اضافه کنید (بخش Performance را ببینید)

### مشکل 3: Special characters مشکل ایجاد می‌کنند
**راه‌حل**: Input را sanitize کنید

```python
import re

def sanitize_search(search: str) -> str:
    # حذف کاراکترهای خطرناک
    search = re.sub(r'[^\w\s\u0600-\u06FF-]', '', search)
    return search.strip()
```

---

## 📞 سوالات؟

اگر سوالی داشتید یا نیاز به توضیحات بیشتر بود، با تیم Frontend در تماس باشید.

---

## ✨ نکات اضافی (Nice to Have)

این موارد الزامی نیستند اما خوب است اضافه شوند:

1. **Highlight نتایج جستجو**: برگرداندن موقعیت کلمه جستجو شده
2. **Search suggestions**: پیشنهاد کلمات مشابه
3. **Search analytics**: ذخیره جستجوهای پرتکرار
4. **Fuzzy search**: جستجوی تقریبی (برای typo ها)

---

**تاریخ ایجاد**: 2026-02-09  
**اولویت**: 🔴 High  
**تخمین**: 3-4 ساعت  
**وابستگی**: ندارد
