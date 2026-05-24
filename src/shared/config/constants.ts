// Application constants
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const AUTH_CONFIG = {
  COOKIE_NAME: 'peyvandyar_token',
  TOKEN_EXPIRY_DAYS: 7,
  SESSION_KEY: 'peyvandyar_admin_session',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/dashboard/products',
  BULK_EDIT: '/dashboard/bulk-edit',
  COPY_PRODUCT: '/dashboard/copy-product',
  SUBSCRIPTION: '/subscription',
  PAYMENT_CALLBACK: '/payment/callback',
  ADMIN: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_PENDING: '/dashboard/admin/pending',
} as const;

export const BASALAM_SSO_URL = 
  'https://basalam.com/accounts/sso?client_id=1119&scope=vendor.profile.read%20vendor.product.write%20customer.profile.read&redirect_uri=https://peyvandyar.amintvk.ir/api/webhook/oauth&state=amin';
