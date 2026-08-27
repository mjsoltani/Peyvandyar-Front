# راهنمای Deploy - Peyvandyar Frontend

## مشکلات رایج و راه‌حل‌ها

### 1. خطای `@next/swc-darwin-arm64` در سرور Linux

**علت:**
- این پکیج مخصوص macOS با چیپ Apple Silicon است
- سرورهای Linux نمی‌توانند این پکیج را نصب کنند

**راه‌حل:**
✅ این پکیج در `optionalDependencies` قرار دارد و نصب آن اجباری نیست.

اگر همچنان مشکل دارید:
```bash
# حذف node_modules و نصب مجدد
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## Build در سرور

### روش 1: استفاده از Docker (توصیه می‌شود)

```bash
# Build image
docker build -t peyvandyar-frontend .

# Run container
docker run -p 3000:3000 peyvandyar-frontend
```

**مزایا:**
- ✅ محیط یکسان در همه جا
- ✅ مشکلات dependency حل می‌شود
- ✅ سریع‌تر و قابل اطمینان‌تر

---

### روش 2: Build مستقیم روی سرور

```bash
# 1. نصب dependencies
npm ci --legacy-peer-deps --omit=optional

# 2. Build
npm run build

# 3. Start production server
npm start
```

**نکات مهم:**
- از `npm ci` به جای `npm install` استفاده کنید (سریع‌تر و قابل اطمینان‌تر)
- از flag `--omit=optional` برای skip کردن optional dependencies استفاده کنید
- حداقل 512MB RAM برای build نیاز است

---

## متغیرهای محیطی (Environment Variables)

فایل `.env.production` بسازید:

```bash
# Node environment
NODE_ENV=production

# API Base URL
NEXT_PUBLIC_API_URL=https://peyvandyar.amintvk.ir/api

# Build optimization
NODE_OPTIONS=--max-old-space-size=512
```

---

## بهینه‌سازی Build

### 1. فعال کردن Standalone Output

در `next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone', // ✅ فعال است
  // ...
};
```

این باعث می‌شود فقط فایل‌های ضروری در build نهایی قرار بگیرند.

---

### 2. کاهش حجم Image در Docker

Dockerfile فعلی از **multi-stage build** استفاده می‌کند:
- Stage 1 (builder): نصب dependencies + build
- Stage 2 (runner): فقط فایل‌های production

**حجم نهایی:** ~150-200MB (به جای 1GB+)

---

## Troubleshooting

### خطا: "Cannot find module '@next/swc-linux-x64-gnu'"

**راه‌حل:**
```bash
# نصب مجدد Next.js
npm install next@latest --legacy-peer-deps
```

Next.js به صورت خودکار SWC مناسب برای platform شما را دانلود می‌کند.

---

### خطا: "JavaScript heap out of memory"

**راه‌حل:**
```bash
# افزایش memory برای Node.js
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build
```

یا در `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=1024' next build"
  }
}
```

---

### خطا: "ENOSPC: System limit for number of file watchers reached"

**راه‌حل (Linux):**
```bash
# افزایش تعداد file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## CI/CD Pipeline

### مثال: GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps --omit=optional
      
      - name: Build
        run: npm run build
        env:
          NODE_OPTIONS: --max-old-space-size=1024
      
      - name: Deploy
        run: |
          # Deploy commands here
```

---

## Health Check

بعد از deploy، این موارد را بررسی کنید:

```bash
# 1. چک کردن سرور
curl http://localhost:3000

# 2. چک کردن API
curl http://localhost:3000/api/health

# 3. چک کردن logs
docker logs peyvandyar-frontend

# یا
pm2 logs peyvandyar-frontend
```

---

## Performance Monitoring

### 1. استفاده از PM2 (برای non-Docker deployments)

```bash
# نصب PM2
npm install -g pm2

# Start با PM2
pm2 start npm --name "peyvandyar-frontend" -- start

# مانیتورینگ
pm2 monit

# Logs
pm2 logs peyvandyar-frontend

# Restart
pm2 restart peyvandyar-frontend
```

---

### 2. استفاده از Docker Compose

فایل `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## چک‌لیست Deploy

- [ ] متغیرهای محیطی تنظیم شده‌اند
- [ ] `npm ci --legacy-peer-deps` بدون خطا اجرا می‌شود
- [ ] `npm run build` موفق است
- [ ] Port 3000 در دسترس است
- [ ] Health check پاس می‌شود
- [ ] Logs بررسی شده‌اند
- [ ] SSL/HTTPS فعال است (در production)
- [ ] Firewall تنظیم شده است

---

## پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های سرور را بررسی کنید
2. مشکل را در GitHub Issues گزارش دهید
3. با تیم DevOps تماس بگیرید: [@mjsoltani2001](https://t.me/mjsoltani2001)
