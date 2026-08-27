# فرانت: UX ایمپورت سنگین دیجی‌کالا (بدون اسپینر ابدی)

سند پیاده‌سازی برای تیم فرانت. مشکل فعلی: برای ~۱۰هزار محصول، UI روی «در حال ایمپورت...» می‌ماند و صفحه قفل می‌شود؛ در حالی که بک‌اند جاب را async صف کرده و progress می‌دهد.

## مشکل فعلی

1. `POST .../seller/import` برای تعداد زیاد سریع `job_id` برمی‌گرداند (`mode: "async"`)
2. فرانت هی `GET /api/jobs/{jobId}/status` را poll می‌کند
3. تا `completed` نشود، یک نوار/اسپینر تمام‌صفحه می‌چرخد
4. برای ۱۰k کالا (با آپلود عکس و محدودیت باسلام) این کار ممکن است **ساعت‌ها** طول بکشد → حس گیر کردن

## هدف UX

**صف را قبول کن؛ صفحه را آزاد کن.**

- اسپینر blocking تمام‌صفحه نگذار
- بلافاصله بعد از گرفتن `job_id` یک **پنل پیشرفت غیرمسدودکننده** نشان بده
- کاربر بتواند صفحه را ترک کند / کار دیگر بکند
- پیشرفت واقعی: `۳۴۲ / ۹۸۹۸` + درصد
- پایان: موفق / ناموفق، نه فقط چرخش ابدی

---

## فلو API (همین الان)

### 1) شروع ایمپورت

```http
POST /api/products/ingest/digikala/seller/import
```

اگر تعداد > ۵ باشد معمولاً:

```json
{
  "success": true,
  "mode": "async",
  "job_id": "uuid-...",
  "status": "pending",
  "note": "Use GET /api/jobs/:jobId/status to check progress",
  "booth_total": 27606,
  "price_markup_percent": 50
}
```

اگر `mode: "sync"` بود (تعداد کم): همان پاسخ را تمام‌شده در نظر بگیر؛ نیازی به poll نیست.

### 2) وضعیت جاب

```http
GET /api/jobs/{jobId}/status
```

پاسخ مهم داخل `job`:

| فیلد | معنی |
|---|---|
| `job.status` | `pending` \| `processing` \| `completed` \| `failed` |
| `job.type` | برای این فلو: `digikala_seller_import` |
| `job.progress` | رشته مثل `"342/9898"` یا `"fetching-catalog"` |
| `job.progress_done` | عدد انجام‌شده (اگر progress به شکل `n/m` باشد) |
| `job.progress_total` | کل |
| `job.progress_percent` | درصد ۰–۱۰۰ |
| `job.current_product` | dkp فعلی (اختیاری) |
| `job.catalog_count` | تعداد کاتالوگ بعد از آماده‌سازی |
| `job.results` | بعد از `completed` |
| `summary` | خلاصه بعد از اتمام (successful_imports / failed_imports) |

نمونه حین پردازش:

```json
{
  "success": true,
  "job": {
    "id": "...",
    "type": "digikala_seller_import",
    "status": "processing",
    "progress": "342/9898",
    "progress_done": 342,
    "progress_total": 9898,
    "progress_percent": 3.5,
    "current_product": "20917759",
    "catalog_count": "9898"
  }
}
```

نمونه اتمام:

```json
{
  "success": true,
  "job": {
    "status": "completed",
    "results": {
      "products_requested": 9898,
      "products_imported": 9700,
      "products_failed": 198,
      "price_markup_percent": 50
    }
  },
  "summary": {
    "job_type": "Digikala Seller Import",
    "successful_imports": 9700,
    "failed_imports": 198,
    "success_rate": "98.1%"
  }
}
```

---

## رفتار پیشنهادی UI (الزامی)

### وقتی `mode === "async"` گرفتی

1. **اسپینر بزرگ پایین صفحه را فوراً ببند**
2. یک **Job Card / Status Bar** ثابت نشان بده (مثلاً پایین یا کنار صفحه)، غیرمسدودکننده
3. متن‌ها:
   - شروع: «ایمپورت در پس‌زمینه شروع شد»
   - در حال جمع کاتالوگ: اگر `progress === "fetching-catalog"` → «در حال آماده‌سازی لیست کالا…»
   - در حال ایمپورت: «ایمپورت ۳۴۲ از ۹۸۹۸» + progress bar
4. Poll هر **۲–۳ ثانیه** (نه زیرتر از ۱ ثانیه)
5. وقتی `status === completed` یا `failed` → poll را قطع کن و نتیجه نهایی را نشان بده
6. دکمه «بستن» روی کارت؛ جاب در بک‌اند ادامه دارد حتی اگر کارت را ببندد
7. (پیشنهادی) `job_id` را در `localStorage` نگه دار تا با رفرش صفحه هم کارت برگردد

### وقتی `mode === "sync"`

همان پاسخ نهایی را نشان بده؛ نیازی به status bar طولانی نیست.

### چیزهایی که نکن

- کل صفحه را تا اتمام ۱۰k قفل نکن
- فقط متن «لطفاً صبر کنید» بدون عدد نگذار
- اگر progress چند دقیقه روی `0/N` ماند، پیام بده: «در صف / در حال آپلود عکس — ممکن است طول بکشد» نه اینکه گیر کرده فرض شود

---

## کامپوننت پیشنهادی: `ImportJobStatusBar`

Props پیشنهادی:

- `jobId: string`
- `onDone?: (summary) => void`
- `onDismiss?: () => void`

State داخلی:

- `status`, `done`, `total`, `percent`, `phase` (`queued` | `fetching` | `importing` | `done` | `error`)

رندر:

```
┌─────────────────────────────────────────────┐
│ ایمپورت دیجی‌کالا                    [بستن] │
│ ████░░░░░░░░░░░░░░░░  3.5%                  │
│ ۳۴۲ / ۹۸۹۸  · در حال ایمپورت…               │
└─────────────────────────────────────────────┘
```

پایان موفق:

```
✅ تمام شد — ۹۷۰۰ موفق، ۱۹۸ ناموفق
```

پایان خطا:

```
❌ ایمپورت متوقف شد — جزئیات را در لاگ/پیام نشان بده
```

---

## Pseudocode فرانت

```ts
async function startSellerImport(body) {
  const res = await api.post('/api/products/ingest/digikala/seller/import', body);

  if (res.mode === 'sync') {
    showFinalResult(res);
    return;
  }

  // async
  hideBlockingSpinner();
  openJobStatusBar(res.job_id);
  localStorage.setItem('digikala_import_job_id', res.job_id);
  pollJob(res.job_id);
}

async function pollJob(jobId) {
  const tick = async () => {
    const { job, summary } = await api.get(`/api/jobs/${jobId}/status`);

    if (job.progress === 'fetching-catalog') {
      updateBar({ phase: 'fetching' });
    } else if (typeof job.progress_done === 'number') {
      updateBar({
        phase: 'importing',
        done: job.progress_done,
        total: job.progress_total,
        percent: job.progress_percent
      });
    } else if (typeof job.progress === 'string' && job.progress.includes('/')) {
      const [done, total] = job.progress.split('/').map(Number);
      updateBar({ phase: 'importing', done, total, percent: (done / total) * 100 });
    }

    if (job.status === 'completed') {
      updateBar({ phase: 'done', summary });
      localStorage.removeItem('digikala_import_job_id');
      return;
    }
    if (job.status === 'failed') {
      updateBar({ phase: 'error', error: job.error || 'failed' });
      localStorage.removeItem('digikala_import_job_id');
      return;
    }

    setTimeout(tick, 2500);
  };

  tick();
}

// on page load
const saved = localStorage.getItem('digikala_import_job_id');
if (saved) openJobStatusBar(saved), pollJob(saved);
```

---

## Checklist فرانت

- [ ] اگر `mode === "async"` → بدون blocking spinner ادامه بده
- [ ] Status bar با `progress_done / progress_total` یا parse از `progress`
- [ ] Poll هر ~۲.۵s تا `completed` / `failed`
- [ ] Persist `job_id` برای رفرش صفحه
- [ ] پیام جدا برای `fetching-catalog`
- [ ] نتیجه نهایی: موفق / ناموفق از `summary`
- [ ] کاربر بتواند کارت را ببندد بدون کنسل شدن جاب بک‌اند

---

## نکته بک‌اند

برای ایمپورت دیجی، progress به صورت `"n/m"` نوشته می‌شود و در status به صورت فیلدهای کمکی `progress_done` / `progress_total` / `progress_percent` هم در دسترس است. اگر فقط `progress` را دیدی و JSON نبود، همان رشته را split کن.
