// Persian number and text utilities
const PERSIAN_NUMBERS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert Persian numbers to English
 */
export function toEnglishNumber(str: string): string {
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(PERSIAN_NUMBERS[i], 'g'), ENGLISH_NUMBERS[i]);
  }
  return result;
}

/**
 * Convert English numbers to Persian
 */
export function toPersianNumber(str: string | number): string {
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(ENGLISH_NUMBERS[i], 'g'), PERSIAN_NUMBERS[i]);
  }
  return result;
}

/**
 * Parse Persian price string to number
 * Example: "۱۹۹,۰۰۰" → 199000
 */
export function parsePersianPrice(price: string): number {
  const englishPrice = toEnglishNumber(price);
  const cleanPrice = englishPrice.replace(/,/g, '');
  const parsed = parseInt(cleanPrice, 10);
  
  if (isNaN(parsed)) {
    throw new Error(`Invalid price format: ${price}`);
  }
  
  return parsed;
}

/**
 * Format number with Persian digits and thousand separators
 * Example: 199000 → "۱۹۹,۰۰۰"
 */
export function formatPersianPrice(price: number): string {
  const formatted = price.toLocaleString('en-US');
  return toPersianNumber(formatted);
}
