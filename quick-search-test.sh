#!/bin/bash

# تست سریع API جستجو
# استفاده: ./quick-search-test.sh YOUR_TOKEN

API_BASE_URL="https://peyvandyar.amintvk.ir/api"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "❌ خطا: توکن ارسال نشده است"
    echo "استفاده: ./quick-search-test.sh YOUR_TOKEN"
    exit 1
fi

echo ""
echo "🔍 تست سریع API جستجو"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# تست 1: بدون جستجو
echo "📝 تست 1: دریافت محصولات بدون جستجو"
curl -s -X GET "${API_BASE_URL}/products?page=1&per_page=3" \
  -H "Accept: */*" \
  -H "X-Encrypted-Token: ${TOKEN}" | jq -r '
    if .success then
      "✅ موفق - تعداد محصولات: \(.data.data | length)"
    else
      "❌ خطا: \(.message // .error // "نامشخص")"
    end
  '

echo ""

# تست 2: با جستجو
echo "📝 تست 2: جستجو با کلمه 'روکش'"
curl -s -X GET "${API_BASE_URL}/products?page=1&per_page=3&search=روکش" \
  -H "Accept: */*" \
  -H "X-Encrypted-Token: ${TOKEN}" | jq -r '
    if .success then
      "✅ موفق - تعداد نتایج: \(.pagination.total // "نامشخص") - نمایش: \(.data.data | length)"
    else
      "❌ خطا: \(.message // .error // "نامشخص")"
    end
  '

echo ""

# تست 3: جستجوی بدون نتیجه
echo "📝 تست 3: جستجو با کلمه‌ای که نتیجه ندارد"
curl -s -X GET "${API_BASE_URL}/products?page=1&per_page=3&search=xyz999notfound" \
  -H "Accept: */*" \
  -H "X-Encrypted-Token: ${TOKEN}" | jq -r '
    if .success then
      if (.data.data | length) == 0 then
        "✅ موفق - نتیجه خالی (مطابق انتظار)"
      else
        "⚠️  انتظار نتیجه خالی بود اما \(.data.data | length) محصول یافت شد"
      end
    else
      "❌ خطا: \(.message // .error // "نامشخص")"
    end
  '

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ تست‌ها تمام شد"
echo ""
