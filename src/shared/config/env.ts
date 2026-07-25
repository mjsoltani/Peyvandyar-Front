// Environment configuration
export const env = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.peyvand-yar.ir',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://api.peyvand-yar.ir',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;
