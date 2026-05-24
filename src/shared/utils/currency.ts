// Currency conversion utilities

/**
 * Convert Toman to Rial (multiply by 10)
 */
export function tomanToRial(toman: number): number {
  return toman * 10;
}

/**
 * Convert Rial to Toman (divide by 10)
 */
export function rialToToman(rial: number): number {
  return Math.floor(rial / 10);
}

/**
 * Format price in Toman with thousand separators
 */
export function formatToman(toman: number): string {
  return toman.toLocaleString('fa-IR');
}

/**
 * Format price in Rial with thousand separators
 */
export function formatRial(rial: number): string {
  return rial.toLocaleString('fa-IR');
}
