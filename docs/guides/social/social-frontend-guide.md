# راهنمای فرانت — انتشار سوشیال در پیوندیار

## خلاصه برای UI

فروشنده می‌تواند محصول غرفه باسلام را به کانال/صفحه سوشیال (ایتا، بله، …) منتشر کند.

جریان کلی:

1. یک‌بار **اتصال پلتفرم** را تنظیم می‌کند (`setup`)
2. وضعیت اتصال را می‌بیند (`status`)
3. روی محصول دکمه **انتشار** می‌زند (`publish` با `productId`)
4. لاگ‌ها و گزارش را می‌بیند (`logs` / `reports/summary`)

فرانت فقط با APIهای **پیوندیار** کار می‌کند. مستقیم به سرویس سوشیال (`/api/v1/publish/...`) درخواست نزنید.

همه endpointها نیاز به هدر احراز هویت دارند:

```http
X-Encrypted-Token: <token>
Content-Type: application/json
```

---



## فلو پیشنهادی UI

```text
۱) صفحه تنظیمات سوشیال
   اگر status = 404 / NOT_CONFIGURED → فرم Setup
   اگر status = 200 → نمایش وضعیت + امکان ویرایش Setup

۲) صفحه محصول / لیست محصولات
   دکمه «انتشار در سوشیال»
   → اگر NOT_CONFIGURED: هدایت به Setup
   → وگرنه POST /api/social/publish با productId
   → toast موفقیت / خطا

۳) صفحه لاگ / گزارش (اختیاری ولی پیشنهادی)
   GET /api/social/logs
   GET /api/social/reports/summary
```

---



## پلتفرم‌های پشتیبانی‌شده


| مقدار API (`platform`) | نمایش UI   |
| ---------------------- | ---------- |
| `eitaa`                | ایتا       |
| `bale`                 | بله        |
| `telegram`             | تلگرام     |
| `rubika`               | روبیکا     |
| `instagram`            | اینستاگرام |


> هر غرفه در یک لحظه **یک پلتفرم** فعال دارد. با `setup` دوباره می‌توان پلتفرم را عوض کرد.

---



## ۱) وضعیت اتصال

`GET /api/social/status`

### پاسخ موفق `200`

```json
{
  "success": true,
  "platform": "eitaa",
  "template": "{price} تومان\n\n{title}\n{description}",
  "isActive": true,
  "customerId": 1151,
  "updatedAt": "2026-08-03T12:00:00.000Z"
}
```


| فیلد         | کاربرد UI                                                      |
| ------------ | -------------------------------------------------------------- |
| `platform`   | پلتفرم فعلی                                                    |
| `template`   | قالب پیش‌فرض کپشن                                              |
| `isActive`   | فعال/غیرفعال                                                   |
| `customerId` | شناسه داخلی سوشیال (نمایش اختیاری؛ برای کاربر نهایی لازم نیست) |
| `updatedAt`  | آخرین به‌روزرسانی تنظیمات                                      |




### اگر هنوز setup نشده `404`

```json
{
  "success": false,
  "code": "NOT_CONFIGURED",
  "error": "هنوز اتصال سوشیال برای این غرفه تنظیم نشده است"
}
```

UI باید فرم Setup را نشان دهد، نه صفحه خطا.

---



## ۲) اتصال / ویرایش پلتفرم (Setup)

`PUT /api/social/setup`

برای اولین اتصال و همچنین تغییر پلتفرم/توکن/قالب.

```json
{
  "platform": "eitaa",
  "botToken": "YOUR_BOT_TOKEN",
  "chatId": "@mychannel",
  "template": "{title}\n{description}\nقیمت: {price} تومان"
}
```


| فیلد       | الزامی | توضیح                                                         |
| ---------- | ------ | ------------------------------------------------------------- |
| `platform` | بله    | یکی از: `eitaa`, `bale`, `telegram`, `rubika`, `instagram`    |
| `botToken` | بله    | توکن ربات/اتصال پلتفرم                                        |
| `chatId`   | بله    | آیدی کانال/چت مقصد (مثلاً `@mychannel` یا عددی)               |
| `template` | خیر    | قالب کپشن؛ placeholderها: `{title}` `{description}` `{price}` |
| `extra`    | خیر    | فیلدهای اضافه مخصوص پلتفرم (object)                           |




### پاسخ موفق

همان شکل `status` با `success: true`.

### نکات UI Setup

1. Select پلتفرم با لیبل فارسی + value انگلیسی بالا
2. اینپوت `botToken` از نوع password (با دکمه نمایش)
3. اینپوت `chatId`
4. Textarea برای `template` + پیش‌نمایش زنده کپشن با داده‌ی نمونه
5. دکمه ذخیره → `PUT /api/social/setup`
6. بعد از موفقیت → دوباره `GET /api/social/status`



### پیش‌نمایش template پیشنهادی

نمونه پیش‌فرض بک‌اند:

```text
{price} تومان

{title}
{description}
```

در UI می‌توانید با مقادیر فیک پر کنید:

```text
1250000 تومان

کفش اسپرت مردانه
سایزبندی ۴۰ تا ۴۵، ارسال رایگان
```

---



## ۳) انتشار محصول

`POST /api/social/publish`

فرانت فقط `productId` محصول باسلام را می‌فرستد. بک‌اند خودش عکس/عنوان/قیمت را از باسلام می‌گیرد و به سرویس سوشیال می‌فرستد.

```json
{
  "productId": "50355963"
}
```

اختیاری — فقط برای همین یک انتشار، template را override کن:

```json
{
  "productId": "50355963",
  "template": "{title}\nقیمت: {price} تومان"
}
```


| فیلد        | الزامی | توضیح                                                   |
| ----------- | ------ | ------------------------------------------------------- |
| `productId` | بله    | شناسه محصول باسلام                                      |
| `template`  | خیر    | اگر نباشد از template ذخیره‌شده در setup استفاده می‌شود |




### کجا دکمه بگذارید؟

- صفحه جزئیات محصول: دکمه اصلی «انتشار در شبکه های اجتماعی»
- لیست محصولات: اکشن روی هر ردیف
- قبل از کلیک: اگر `status` برابر `NOT_CONFIGURED` بود، کاربر را به Setup ببرید



### رفتار دکمه

```text
کلیک «انتشار»
  → اگر NOT_CONFIGURED: redirect / modal به Setup
  → وگرنه confirm کوتاه (اختیاری)
  → loading روی دکمه
  → POST /api/social/publish
  → toast نتیجه
```



### خطاهای مهم publish


| وضعیت / کد               | معنی UI                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `400` + `NOT_CONFIGURED` | هنوز اتصال تنظیم نشده → ببر Setup                          |
| `400` بدون setup         | `productId` خالی / محصول عکس ندارد                         |
| `401`                    | لاگین مجدد                                                 |
| `4xx/5xx` دیگر           | متن `error` را نشان بده؛ اگر `details` بود در dev نشان بده |


نمونه پیام‌های بک‌اند:

- `productId الزامی است`
- `محصول عکسی برای انتشار ندارد`
- `ابتدا باید اتصال سوشیال را با PUT /api/social/setup تنظیم کنید`
- `انتشار در سوشیال ناموفق بود`

---



## ۴) لاگ انتشارها

`GET /api/social/logs`

Query params اختیاری:


| Param      | مثال                 | توضیح        |
| ---------- | -------------------- | ------------ |
| `platform` | `eitaa`              | فیلتر پلتفرم |
| `status`   | `success` / `failed` | وضعیت        |
| `from`     | تاریخ                | از           |
| `to`       | تاریخ                | تا           |
| `page`     | `1`                  | صفحه         |
| `limit`    | `20`                 | تعداد        |


مثال:

```http
GET /api/social/logs?status=failed&page=1&limit=20
```

اگر setup نشده باشد → `404` با `NOT_CONFIGURED`.

### UI پیشنهادی

جدول:

- زمان
- پلتفرم
- وضعیت (موفق / ناموفق)
- پیام خطا (اگر failed)
- مدت‌زمان (اگر در پاسخ باشد)

فیلتر بالای جدول: status + platform + بازه تاریخ.

---



## ۵) گزارش خلاصه

`GET /api/social/reports/summary`

Query params اختیاری:


| Param     | مقادیر             | توضیح     |
| --------- | ------------------ | --------- |
| `groupBy` | `platform` / `day` | گروه‌بندی |
| `from`    | تاریخ              | از        |
| `to`      | تاریخ              | تا        |


مثال:

```http
GET /api/social/reports/summary?groupBy=platform
```



### UI پیشنهادی

- کارت‌ها: کل انتشار / موفق / ناموفق
- چارت ساده بر اساس `groupBy=day` یا جدول بر اساس `platform`

اگر setup نشده → `404` / `NOT_CONFIGURED`.

---



## mapping دکمه → API (کپی برای فرانت)


| اکشن UI               | درخواست                                                    |
| --------------------- | ---------------------------------------------------------- |
| ورود به صفحه سوشیال   | `GET /api/social/status`                                   |
| ذخیره اتصال           | `PUT /api/social/setup`                                    |
| انتشار محصول          | `POST /api/social/publish` body: `{ productId }`           |
| انتشار با قالب سفارشی | `POST /api/social/publish` body: `{ productId, template }` |
| لیست لاگ              | `GET /api/social/logs?...`                                 |
| خلاصه گزارش           | `GET /api/social/reports/summary?...`                      |


نمونه publish:

```js
await fetch('/api/social/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Encrypted-Token': token
  },
  body: JSON.stringify({ productId: String(product.id) })
});
```

---



## صفحات پیشنهادی فرانت



### ۱) تنظیمات سوشیال

- لود `status`
- حالت خالی → فرم Setup
- حالت متصل → کارت وضعیت (`platform`, تاریخ آپدیت، وضعیت فعال) + دکمه «ویرایش اتصال»
- ویرایش = همان فرم Setup با مقادیر فعلی (به‌جز `botToken` که خالی بماند مگر کاربر عوض کند)



### ۲) انتشار از محصول

- دکمه «انتشار در سوشیال»
- اگر متصل نبود → CTA به Setup
- اگر متصل بود → publish مستقیم + toast



### ۳) تاریخچه انتشار

- جدول logs
- فیلتر status/platform
- لینک به گزارش summary

---



## Stateهای UI


| State                   | رفتار                          |
| ----------------------- | ------------------------------ |
| `loadingStatus`         | اسکلتون صفحه تنظیمات           |
| `notConfigured`         | فرم Setup / empty state        |
| `configured`            | نمایش وضعیت + امکان publish    |
| `savingSetup`           | disable فرم + spinner          |
| `publishing(productId)` | spinner روی همان دکمه          |
| `loadingLogs`           | اسکلتون جدول لاگ               |
| `error`                 | toast / banner با `error` سرور |


---



## خطاهای رایج


| وضعیت                    | کجا                 | معنی پیشنهادی UI                                           |
| ------------------------ | ------------------- | ---------------------------------------------------------- |
| `401`                    | همه                 | توکن نامعتبر / لاگین مجدد                                  |
| `400`                    | setup               | `platform` نامعتبر یا `botToken`/`chatId` خالی             |
| `400` + `NOT_CONFIGURED` | publish             | اول Setup را کامل کن                                       |
| `404` + `NOT_CONFIGURED` | status/logs/summary | هنوز متصل نشده                                             |
| `502` / `5xx`            | setup/publish       | سرویس سوشیال یا آپستریم مشکل دارد؛ متن `error` را نشان بده |


---



## نکات مهم برای فرانت

1. فرانت **مستقیم** به `localhost:3000/api/v1/publish/:platform` یا دامنه سوشیال درخواست نزند.
2. فقط `productId` برای publish کافی است؛ عکس/قیمت/عنوان را خود بک‌اند می‌سازد.
3. محصول بدون عکس publish نمی‌شود — قبل از دکمه، اگر عکس نداشت disable + توضیح بدهید.
4. `botToken` را بعد از setup دوباره از API نخواهید؛ در `status` برنمی‌گردد.
5. یک غرفه = یک پلتفرم فعال؛ برای عوض کردن دوباره Setup بزنید.
6. Placeholderهای template فقط همین‌ها هستند: `{title}` `{description}` `{price}`

