# Digikala Seller Preview — راهنمای فرانت (async)

این سند برای تیم فرانت است. بک‌اند پریویو غرفه دیجی‌کالا را **همیشه به‌صورت جاب صف‌شده** انجام می‌دهد. کاربر نباید `job_id` یا جزئیات جاب را ببیند؛ فقط لودینگ و بعد لیست/تأیید تکمیل.

**آیا سنیور است؟** بله — برای کار سنگین شبکه (جمع‌آوری تا ۱۰هزار کالا از دیجی‌کالا) الگوی **enqueue → poll → render** استاندارد است؛ مثل ایمپورت async. سقف نرم ۱۰هزار جلوی timeout و فشار بیش از حد را می‌گیرد.

---

## خلاصه جریان UX

1. کاربر URL غرفه را می‌زند و «پریویو» را می‌زند.
2. UI لودینگ نشان می‌دهد: مثلاً «در حال آماده‌سازی لیست غرفه…».
3. فرانت در پس‌زمینه وضعیت جاب را پول می‌کند.
4. وقتی جاب `completed` شد:
   - پیام موفقیت: مثلاً «۱۰٬۰۰۰ کالا آماده شد» (یا همان `fetched_count`).
   - جدول از `preview` (حداکثر حدود ۱۰۰۰ ردیف برای نمایش).
   - برای ایمپورت بعدی از `product_ids` استفاده شود (تا سقف ۱۰هزار).

---

## Base URL

- Production: `https://api.peyvand-yar.ir`
- Auth: همان هدر توکنی که بقیهٔ APIهای محافظت‌شده استفاده می‌کنند (`X-Encrypted-Token` / مطابق قرارداد فعلی پروژه).

---

## مرحله ۱ — شروع پریویو

### Request

```http
POST /api/products/ingest/digikala/seller
Content-Type: application/json
```

Body نمونه:

```json
{
  "url": "https://www.digikala.com/seller/5A52N/",
  "preview_limit": 15000,
  "only_marketable": true
}
```

نکته‌ها:

- `preview_limit` / `limit` اگر بیشتر از ۱۰٬۰۰۰ باشد **ارور نمی‌دهد**؛ بک‌اند روی **۱۰٬۰۰۰** soft-cap می‌کند.
- `only_marketable` پیش‌فرض منطقی: `true`.

### Response موفق (فوری)

```json
{
  "success": true,
  "mode": "async",
  "message": "پریویو غرفه 5A52N صف شد (درخواست 15000 → سقف 10000). …",
  "summary": "…",
  "job_id": "d541c2f2-294e-44ef-8e32-13c11a2696ff",
  "status": "pending",
  "note": "Use GET /api/jobs/:jobId/status — when completed, results.preview + results.product_ids are ready.",
  "status_url": "/api/jobs/d541c2f2-294e-44ef-8e32-13c11a2696ff/status",
  "seller_code": "5A52N",
  "seller_url": "https://www.digikala.com/seller/5A52N/",
  "booth_total": 20603,
  "requested_limit": 15000,
  "effective_limit": 10000,
  "preview_request_capped": true,
  "only_marketable": true
}
```

### کار فرانت در این لحظه

| فیلد | استفاده |
|------|---------|
| `mode === "async"` | وارد مسیر لودینگ + poll شو (دیگر انتظار `preview` در همین پاسخ را نداشته باش) |
| `job_id` | فقط state داخلی؛ به کاربر نشان نده |
| `status_url` | می‌توانی مستقیم برای poll استفاده کنی |
| `effective_limit` | سقف واقعی (۱۰هزار) — برای متن UI |
| `requested_limit` / `preview_request_capped` | اگر خواستی بگو «درخواستت محدود به ۱۰هزار شد» |
| `booth_total` | کل غرفه روی دیجی‌کالا (ممکن است از ۱۰هزار بیشتر باشد) |

**UI:** اسپینر / اسکلتون — هنوز جدول نساز.

---

## مرحله ۲ — Poll وضعیت تا تکمیل

### Request

```http
GET /api/jobs/{job_id}/status
```

پیشنهاد: هر **۲ تا ۳ ثانیه** یک‌بار.  
Timeout پیشنهادی UI: **۲ تا ۳ دقیقه**؛ بعد پیام «طولانی شد، دوباره تلاش کنید» و دکمهٔ Retry (که دوباره از مرحله ۱ شروع کند).

### وضعیت‌ها

| `job.status` | معنی | UI |
|--------------|------|-----|
| `pending` | در صف | لودینگ |
| `processing` | در حال جمع‌آوری از دیجی‌کالا | لودینگ (+ اختیاری: «در حال دریافت…») |
| `completed` | تمام | لودینگ را بردار → نتایج را نشان بده |
| `failed` | خطا | پیام خطا از `job.error` |

تا `completed` یا `failed`، همان GET را تکرار کن. بعد از terminal state، poll را قطع کن.

---

## مرحله ۳ — وقتی `completed` شد چه نشان بدهی

نتیجه معمولاً اینجاست:

- `job.results` (آبجکت)

فیلدهای مهم برای UI:

| فیلد | معنی برای فرانت |
|------|------------------|
| `results.fetched_count` | چند کالا واقعاً جمع شده (هدف تا ۱۰هزار) |
| `results.preview_count` | چندتا داخل آرایهٔ نمایش است |
| `results.preview` | ردیف‌های جدول (حداکثر حدود **۱۰۰۰**) |
| `results.product_ids` | لیست idها تا سقف جمع‌آوری‌شده (برای ایمپورت / انتخاب همه) |
| `results.booth_total` | کل غرفه دیجی‌کالا |
| `results.effective_limit` | سقف ۱۰هزار |
| `results.summary` / `results.message` | متن آماده برای بنر/توضیح |
| `results.preview_display_limit` | سقف نمایش (مثلاً ۱۰۰۰) |

### پیشنهاد متن کاربر

- اگر `fetched_count` نزدیک/برابر `effective_limit` است:  
  **«۱۰٬۰۰۰ کالا آماده شد.»**
- اگر کمتر است (غرفه کوچک‌تر یا فیلتر marketable):  
  **«{fetched_count} کالا آماده شد.»**
- زیرش اختیاری:  
  **«نمایش {preview_count} کالا در لیست — برای ایمپورت از همهٔ idهای آماده‌شده استفاده می‌شود.»**

### نمایش جدول

- منبع ردیف‌ها: **`results.preview`** فقط.
- «انتخاب همه برای ایمپورت»: از **`results.product_ids`** استفاده کن، نه فقط از ردیف‌های صفحه.

هر آیتم `preview` معمولاً شامل چیزهایی شبیه:

- `digikala_product_id`
- `digikala_variant_id`
- `title`
- `image_url`
- `price_toman`
- `stock`
- `status`
- `url`

(اگر فیلدی نبود، UI را مقاوم نگه دارید.)

---

## مرحله ۴ — ایمپورت (جدا از پریویو)

بعد از اینکه کاربر انتخاب کرد یا «همهٔ آماده‌شده» را زد:

```http
POST /api/products/ingest/digikala/seller/import
```

با `product_ids` گرفته‌شده از جاب پریویو (و بقیهٔ فیلدهای لازم ایمپورت طبق قرارداد فعلی).

اگر ایمپورت هم `mode: async` + `job_id` برگرداند، همان الگوی poll روی `GET /api/jobs/{import_job_id}/status` تکرار می‌شود.

---

## چک‌لیست پیاده‌سازی فرانت

- [ ] اگر `POST` پریویو `mode: "async"` داد → مسیر poll، نه render فوری
- [ ] لودینگ تا `completed` / `failed`
- [ ] `job_id` را در UI خام نشان نده
- [ ] روی `completed` از `results.preview` جدول بساز
- [ ] پیام تکمیل بر اساس `fetched_count` / سقف ۱۰هزار
- [ ] ایمپورت از `product_ids` نه فقط ردیف‌های نمایش‌داده‌شده
- [ ] قطع poll بعد از وضعیت نهایی + timeout UI
- [ ] Retry از اول با `POST` جدید

---

## رفتارهایی که عمدی است

1. **Soft-cap ۱۰هزار:** درخواست ۲۰۰هزار هم ارور نمی‌دهد؛ `effective_limit: 10000` و `preview_request_capped: true`.
2. **صف و fairness:** چند کاربر همزمان دیجی‌کالا را یک‌جا نمی‌کوبند؛ ممکن است کمی در صف بمانند (`pending`).
3. **نمایش ≠ همهٔ idها:** جدول سبک (~۱۰۰۰)، مجموعهٔ کامل برای ایمپورت در `product_ids`.

---

## نمونهٔ مینیمال منطق (شبه‌کد — پیاده‌سازی با شما)

```
onPreviewClick(url):
  showLoading("در حال آماده‌سازی لیست غرفه…")
  res = POST /seller { url, preview_limit, only_marketable }
  if res.mode != "async": handle legacy/sync if ever returned
  jobId = res.job_id

  loop every 2–3s until timeout:
    st = GET /api/jobs/{jobId}/status
    if st.job.status == "completed":
      hideLoading()
      showSuccess(st.job.results.fetched_count + " کالا آماده شد")
      renderTable(st.job.results.preview)
      storeProductIds(st.job.results.product_ids)
      break
    if st.job.status == "failed":
      hideLoading()
      showError(st.job.error)
      break
```

---

## تماس / قرارداد

- Endpoint شروع: `POST /api/products/ingest/digikala/seller`
- Endpoint وضعیت: `GET /api/jobs/:jobId/status`
- سقف پریویو: **۱۰٬۰۰۰**
- سقف ردیف نمایش در `preview`: حدود **۱٬۰۰۰**
