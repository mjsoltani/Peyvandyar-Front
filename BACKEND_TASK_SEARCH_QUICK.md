# 🚀 تسک سریع: اضافه کردن Search به API محصولات

## چی باید بشه؟

```python
# قبل
GET /api/products?page=1&per_page=10

# بعد
GET /api/products?page=1&per_page=10&search=روکش
```

---

## کد نمونه (کپی-پیست آماده)

```python
@app.get("/api/products")
async def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: str = Query(None),  # ← این خط جدیده
    token: str = Header(None, alias="X-Encrypted-Token")
):
    user = await verify_token(token)
    
    # Query پایه
    query = db.query(Product).filter(Product.vendor_id == user.vendor_id)
    
    # ← این بخش جدیده
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_term),
                Product.description.ilike(search_term),
                Product.sku.ilike(search_term)
            )
        )
    # ← تا اینجا
    
    # بقیه کد مثل قبل
    total = query.count()
    last_page = ceil(total / per_page)
    products = query.offset((page-1)*per_page).limit(per_page).all()
    
    return {
        "success": True,
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total": total,
            "last_page": last_page
        },
        "data": {"data": products}
    }
```

---

## تست سریع

```bash
# تست 1: بدون search (باید مثل قبل کار کنه)
curl "http://localhost:8000/api/products?page=1&per_page=10" \
  -H "X-Encrypted-Token: YOUR_TOKEN"

# تست 2: با search
curl "http://localhost:8000/api/products?search=روکش" \
  -H "X-Encrypted-Token: YOUR_TOKEN"
```

---

## Index برای سرعت (اختیاری ولی توصیه میشه)

```sql
CREATE INDEX idx_products_title ON products(title);
CREATE INDEX idx_products_sku ON products(sku);
```

---

## چک لیست

- [ ] پارامتر `search` اضافه شد
- [ ] جستجو در `title`, `description`, `sku` کار می‌کنه
- [ ] با حروف فارسی کار می‌کنه
- [ ] pagination درست کار می‌کنه
- [ ] تست شد

---

**زمان**: 1-2 ساعت  
**جزئیات بیشتر**: `BACKEND_TASK_SEARCH_FEATURE.md`
