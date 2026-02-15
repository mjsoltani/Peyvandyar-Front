# راهنمای تست API جستجوی محصولات

این فایل‌ها برای تست قابلیت جستجو در API محصولات ساخته شده‌اند.

## 📁 فایل‌های موجود

1. **test-search-api.js** - تست کامل با Node.js
2. **quick-search-test.sh** - تست سریع با Bash/curl
3. این فایل راهنما

---

## 🚀 روش استفاده

### روش 1: تست کامل با Node.js (پیشنهادی)

این روش تست‌های کامل‌تری انجام می‌دهد و خروجی رنگی و خوانا دارد.

```bash
# اجرای تست
node test-search-api.js "YOUR_TOKEN_HERE"
```

**مثال:**
```bash
node test-search-api.js "a1b2c3d4e5f6:9f8e7d6c5b4a3210..."
```

**خروجی نمونه:**
```
🔍 شروع تست API جستجوی محصولات

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 تست 1: دریافت محصولات بدون جستجو (رفتار عادی)
   URL: https://peyvandyar.amintvk.ir/api/products?page=1&per_page=5
   Status: 200
   ✅ فیلدهای مورد انتظار موجود است
   📊 Pagination:
      - صفحه فعلی: 1
      - تعداد در صفحه: 5
      - تعداد کل: 150
      - تعداد صفحات: 30
   📦 تعداد محصولات: 5
   ✅ تست موفق
```

---

### روش 2: تست سریع با Bash

این روش سریع‌تر است و نیاز به Node.js ندارد (فقط curl و jq).

```bash
# اجرای مجوز
chmod +x quick-search-test.sh

# اجرای تست
./quick-search-test.sh "YOUR_TOKEN_HERE"
```

**نیازمندی‌ها:**
- `curl` (معمولاً از قبل نصب است)
- `jq` (برای parse کردن JSON)

**نصب jq:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

---

### روش 3: تست دستی با curl

اگر می‌خواهید خودتان دستی تست کنید:

```bash
# تست بدون جستجو
curl -X GET "https://peyvandyar.amintvk.ir/api/products?page=1&per_page=5" \
  -H "Accept: */*" \
  -H "X-Encrypted-Token: YOUR_TOKEN" | jq

# تست با جستجو
curl -X GET "https://peyvandyar.amintvk.ir/api/products?page=1&per_page=5&search=روکش" \
  -H "Accept: */*" \
  -H "X-Encrypted-Token: YOUR_TOKEN" | jq

# تست جستجوی خالی
curl -X GET "https://peyvandyar.amintvk.ir/api/products?page=1&per_page=5&search=xyz999" \
  -H "Accept: */*" \
  -H "X-Encrypted-Token: YOUR_TOKEN" | jq
```

---

## 🔑 دریافت توکن

برای تست نیاز به توکن احراز هویت دارید. توکن را می‌توانید از:

1. **Browser DevTools**: 
   - وارد داشبورد شوید
   - F12 را بزنید
   - به تب Application/Storage بروید
   - در Cookies یا LocalStorage دنبال `auth_token` بگردید

2. **از کد Frontend**:
   ```javascript
   // در console مرورگر
   localStorage.getItem('auth_token')
   ```

---

## 📊 تست‌های انجام شده

اسکریپت‌ها این موارد را تست می‌کنند:

### ✅ تست 1: دریافت عادی محصولات
- بدون پارامتر search
- باید همه محصولات را برگرداند
- pagination باید کار کند

### ✅ تست 2: جستجو با کلمه فارسی
- جستجو با کلمه "روکش"
- باید محصولات مرتبط را برگرداند
- total باید کمتر از تعداد کل محصولات باشد

### ✅ تست 3: جستجو با کلمه انگلیسی
- جستجو با کلمه "test"
- باید case-insensitive باشد

### ✅ تست 4: جستجو با عبارت خالی
- search parameter خالی
- باید مثل حالت عادی همه محصولات را برگرداند

### ✅ تست 5: جستجو بدون نتیجه
- جستجو با کلمه‌ای که وجود ندارد
- باید آرایه خالی برگرداند
- total باید 0 باشد

---

## 🐛 عیب‌یابی

### خطا: "Authentication required"
- توکن شما منقضی شده یا نامعتبر است
- دوباره وارد سیستم شوید و توکن جدید بگیرید

### خطا: "command not found: jq"
- jq نصب نیست
- از دستورات بالا برای نصب استفاده کنید
- یا از روش Node.js استفاده کنید

### خطا: "permission denied"
- فایل bash قابل اجرا نیست
- اجرا کنید: `chmod +x quick-search-test.sh`

### Response خالی یا خطا 500
- احتمالاً backend مشکل دارد
- با تیم backend تماس بگیرید
- لاگ‌های سرور را چک کنید

---

## 📝 نتیجه‌گیری

بعد از اجرای تست‌ها:

### ✅ اگر همه تست‌ها موفق بودند:
- قابلیت search به درستی پیاده‌سازی شده
- می‌توانید در frontend استفاده کنید
- API-ENDPOINTS.json را آپدیت کنید

### ❌ اگر تست‌ها ناموفق بودند:
- خطاها را به تیم backend گزارش دهید
- این فایل را به همراه خروجی خطا ارسال کنید
- منتظر fix بمانید

---

## 🔗 منابع مرتبط

- [BACKEND_TASK_SEARCH_FEATURE.md](./BACKEND_TASK_SEARCH_FEATURE.md) - مستندات کامل تسک
- [API-ENDPOINTS.json](./API-ENDPOINTS.json) - لیست تمام endpointها

---

**تاریخ ایجاد**: 2026-02-15  
**نسخه**: 1.0.0
