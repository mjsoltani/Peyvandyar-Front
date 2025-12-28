# قابلیت Multi-Marketplace در کپی محصول

## ویژگی‌های جدید

### 1. انتخاب چند فروشگاه
کاربر می‌تواند محصول را به چندین فروشگاه همزمان کپی کند:
- نمایش لیست تمام فروشگاه‌های موجود
- امکان انتخاب/لغو انتخاب هر فروشگاه
- دکمه "انتخاب همه" / "لغو انتخاب همه"
- نمایش تعداد فروشگاه‌های انتخاب شده

### 2. نمایش اطلاعات فروشگاه‌ها
هر فروشگاه شامل:
- نام فروشگاه (vendor_title)
- نام کاربری (username)
- شناسه فروشگاه (vendor_id)
- آیکون فروشگاه

### 3. فرآیند کپی
```typescript
// برای هر فروشگاه انتخاب شده:
1. دریافت توکن فروشگاه از adminApi.getAuthToken()
2. کپی محصول با استفاده از توکن مربوطه
3. ذخیره نتیجه (موفق/ناموفق)
```

### 4. نمایش نتایج
پس از کپی، نتیجه برای هر فروشگاه نمایش داده می‌شود:
- ✅ موفق: نمایش شناسه محصول جدید
- ❌ ناموفق: نمایش پیغام خطا
- آمار کلی: تعداد موفق و ناموفق

## رابط کاربری

### بخش انتخاب فروشگاه‌ها
```tsx
<motion.button
  onClick={() => toggleMarketplace(marketplace.vendor_id)}
  className={selectedMarketplaces.includes(marketplace.vendor_id)
    ? "border-orange-500 bg-orange-50"
    : "border-slate-200 bg-white"
  }
>
  {/* محتوای فروشگاه */}
</motion.button>
```

### دکمه کپی
```tsx
<button
  onClick={handleCopy}
  disabled={isCopying || selectedMarketplaces.length === 0}
>
  کپی به {selectedMarketplaces.length} فروشگاه
</button>
```

### نمایش نتایج
```tsx
{copyResults.map((result) => (
  <div className={result.success ? "bg-green-50" : "bg-red-50"}>
    {result.marketplace}
    {result.success && <p>شناسه: {result.productId}</p>}
    {!result.success && <p>خطا: {result.error}</p>}
  </div>
))}
```

## State Management

```typescript
// لیست فروشگاه‌ها
const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);

// فروشگاه‌های انتخاب شده
const [selectedMarketplaces, setSelectedMarketplaces] = useState<number[]>([]);

// نتایج کپی
const [copyResults, setCopyResults] = useState<CopyResult[]>([]);

// وضعیت بارگذاری
const [isLoadingMarketplaces, setIsLoadingMarketplaces] = useState(true);
const [isCopying, setIsCopying] = useState(false);
```

## Interface ها

```typescript
interface Marketplace {
  username: string;
  vendor_id: number;
  vendor_title: string;
  basalam_user_id: number;
}

interface CopyResult {
  marketplace: string;
  vendor_id: number;
  success: boolean;
  productId?: number;
  error?: string;
}
```

## توابع اصلی

### loadMarketplaces
```typescript
const loadMarketplaces = async () => {
  const response = await adminApi.getAllUsers();
  setMarketplaces(response.users);
};
```

### toggleMarketplace
```typescript
const toggleMarketplace = (vendorId: number) => {
  setSelectedMarketplaces(prev =>
    prev.includes(vendorId)
      ? prev.filter(id => id !== vendorId)
      : [...prev, vendorId]
  );
};
```

### handleCopy
```typescript
const handleCopy = async () => {
  const results: CopyResult[] = [];
  
  for (const vendorId of selectedMarketplaces) {
    try {
      // دریافت توکن
      const tokenResponse = await adminApi.getAuthToken(username);
      
      // کپی محصول
      const response = await productsApi.copyProduct(productId);
      
      results.push({
        marketplace: vendor_title,
        vendor_id: vendorId,
        success: true,
        productId: response.data?.id,
      });
    } catch (error) {
      results.push({
        marketplace: vendor_title,
        vendor_id: vendorId,
        success: false,
        error: error.message,
      });
    }
  }
  
  setCopyResults(results);
};
```

## انیمیشن‌ها

### ورود نتایج
```typescript
<AnimatePresence>
  {copyResults.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* نتایج */}
    </motion.div>
  )}
</AnimatePresence>
```

### نمایش تک تک نتایج
```typescript
{copyResults.map((result, idx) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: idx * 0.1 }}
  >
    {/* نتیجه */}
  </motion.div>
))}
```

## نکات مهم

1. **بارگذاری فروشگاه‌ها**: در useEffect اولیه انجام می‌شود
2. **اعتبارسنجی**: قبل از کپی، چک می‌شود که حداقل یک فروشگاه انتخاب شده باشد
3. **مدیریت خطا**: هر فروشگاه به صورت مستقل handle می‌شود و خطای یکی باعث توقف بقیه نمی‌شود
4. **نمایش پیشرفت**: در حین کپی، تعداد فروشگاه‌ها نمایش داده می‌شود
5. **نتایج جامع**: موفقیت و شکست هر فروشگاه به صورت جداگانه نمایش داده می‌شود

## TODO: بهبودهای آینده

- [ ] افزودن progress bar برای نمایش پیشرفت کپی
- [ ] امکان کپی با تنظیمات مختلف برای هر فروشگاه
- [ ] ذخیره تنظیمات پیش‌فرض فروشگاه‌ها
- [ ] فیلتر و جستجو در لیست فروشگاه‌ها
- [ ] دسته‌بندی فروشگاه‌ها
- [ ] امکان ویرایش محصول قبل از کپی
- [ ] کپی دسته‌ای چند محصول به چند فروشگاه
 