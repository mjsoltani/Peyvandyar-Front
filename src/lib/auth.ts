// Auth utilities for Peyvandyar

export const AUTH_COOKIE_NAME = "peyvandyar_token";

export const BASALAM_SSO_URL = "https://basalam.com/accounts/sso?client_id=1119&scope=vendor.product.read%20vendor.product.write%20customer.profile.read&redirect_uri=https://peyvandyar.amintvk.ir/api/webhook/oauth&state=amintvk";

/**
 * Get auth token from cookies (client-side)
 */
export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === AUTH_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

/**
 * Set auth token in cookies (client-side)
 */
export function setAuthToken(token: string, expiryDays: number = 7): void {
  if (typeof document === "undefined") return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Remove auth token from cookies (client-side)
 */
export function removeAuthToken(): void {
  if (typeof document === "undefined") return;
  
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

