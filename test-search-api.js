#!/usr/bin/env node

/**
 * تست API جستجوی محصولات
 * 
 * این اسکریپت endpoint جستجو را تست می‌کند
 * 
 * استفاده:
 * node test-search-api.js YOUR_TOKEN
 * 
 * مثال:
 * node test-search-api.js "a1b2c3d4e5f6:9f8e7d6c5b4a3210..."
 */

const API_BASE_URL = "https://peyvandyar.amintvk.ir/api";

// رنگ‌ها برای خروجی
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSearchAPI(token) {
  if (!token) {
    log('❌ خطا: توکن ارسال نشده است', 'red');
    log('استفاده: node test-search-api.js YOUR_TOKEN', 'yellow');
    process.exit(1);
  }

  log('\n🔍 شروع تست API جستجوی محصولات\n', 'cyan');
  log('━'.repeat(60), 'blue');

  const tests = [
    {
      name: 'تست 1: دریافت محصولات بدون جستجو (رفتار عادی)',
      url: `${API_BASE_URL}/products?page=1&per_page=5`,
      expectedFields: ['success', 'pagination', 'data'],
    },
    {
      name: 'تست 2: جستجو با کلمه "روکش"',
      url: `${API_BASE_URL}/products?page=1&per_page=5&search=روکش`,
      expectedFields: ['success', 'pagination', 'data'],
      checkSearch: true,
    },
    {
      name: 'تست 3: جستجو با کلمه انگلیسی',
      url: `${API_BASE_URL}/products?page=1&per_page=5&search=test`,
      expectedFields: ['success', 'pagination', 'data'],
      checkSearch: true,
    },
    {
      name: 'تست 4: جستجو با عبارت خالی',
      url: `${API_BASE_URL}/products?page=1&per_page=5&search=`,
      expectedFields: ['success', 'pagination', 'data'],
    },
    {
      name: 'تست 5: جستجو با کلمه‌ای که نتیجه ندارد',
      url: `${API_BASE_URL}/products?page=1&per_page=5&search=xyz123notfound999`,
      expectedFields: ['success', 'pagination', 'data'],
      expectEmpty: true,
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    log(`\n📝 ${test.name}`, 'yellow');
    log(`   URL: ${test.url}`, 'blue');

    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'X-Encrypted-Token': token,
        },
      });

      log(`   Status: ${response.status}`, response.ok ? 'green' : 'red');

      if (!response.ok) {
        const errorText = await response.text();
        log(`   ❌ خطا: ${errorText}`, 'red');
        failedTests++;
        continue;
      }

      const data = await response.json();

      // چک کردن فیلدهای مورد انتظار
      let testPassed = true;
      for (const field of test.expectedFields) {
        if (!(field in data)) {
          log(`   ❌ فیلد "${field}" وجود ندارد`, 'red');
          testPassed = false;
        }
      }

      if (testPassed) {
        log(`   ✅ فیلدهای مورد انتظار موجود است`, 'green');
      }

      // نمایش اطلاعات pagination
      if (data.pagination) {
        log(`   📊 Pagination:`, 'cyan');
        log(`      - صفحه فعلی: ${data.pagination.current_page || data.pagination.page || 'N/A'}`, 'cyan');
        log(`      - تعداد در صفحه: ${data.pagination.per_page || 'N/A'}`, 'cyan');
        log(`      - تعداد کل: ${data.pagination.total || data.pagination.total_count || 'N/A'}`, 'cyan');
        log(`      - تعداد صفحات: ${data.pagination.last_page || data.pagination.total_page || 'N/A'}`, 'cyan');
      }

      // نمایش تعداد محصولات
      const products = data.data?.data || data.data || [];
      log(`   📦 تعداد محصولات: ${products.length}`, 'cyan');

      // چک کردن نتایج خالی
      if (test.expectEmpty) {
        if (products.length === 0) {
          log(`   ✅ نتیجه خالی است (مطابق انتظار)`, 'green');
        } else {
          log(`   ⚠️  انتظار نتیجه خالی بود اما ${products.length} محصول یافت شد`, 'yellow');
        }
      }

      // نمایش نمونه محصولات
      if (products.length > 0) {
        log(`   📋 نمونه محصولات:`, 'cyan');
        products.slice(0, 2).forEach((product, index) => {
          log(`      ${index + 1}. ${product.title || product.name || 'بدون عنوان'}`, 'cyan');
          if (product.sku) {
            log(`         SKU: ${product.sku}`, 'cyan');
          }
        });
      }

      if (testPassed) {
        passedTests++;
        log(`   ✅ تست موفق`, 'green');
      } else {
        failedTests++;
      }

    } catch (error) {
      log(`   ❌ خطا: ${error.message}`, 'red');
      failedTests++;
    }

    log('   ' + '─'.repeat(58), 'blue');
  }

  // خلاصه نتایج
  log('\n' + '━'.repeat(60), 'blue');
  log('\n📊 خلاصه نتایج:', 'cyan');
  log(`   ✅ تست‌های موفق: ${passedTests}`, 'green');
  log(`   ❌ تست‌های ناموفق: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`   📈 درصد موفقیت: ${Math.round((passedTests / tests.length) * 100)}%`, 'cyan');
  
  if (failedTests === 0) {
    log('\n🎉 همه تست‌ها با موفقیت انجام شد!', 'green');
  } else {
    log('\n⚠️  برخی تست‌ها ناموفق بودند. لطفا خطاها را بررسی کنید.', 'yellow');
  }
  
  log('\n' + '━'.repeat(60), 'blue');
}

// دریافت توکن از command line
const token = process.argv[2];

// اجرای تست
testSearchAPI(token).catch(error => {
  log(`\n❌ خطای کلی: ${error.message}`, 'red');
  process.exit(1);
});
