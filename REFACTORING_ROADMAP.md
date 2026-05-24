# 🗺️ Refactoring Roadmap - Peyvandyar Frontend

## Priority Matrix

```
High Impact, Low Effort  │  High Impact, High Effort
─────────────────────────┼──────────────────────────
✅ API Client Setup      │  🔄 Full Feature Migration
✅ Error Handling        │  🔄 State Management
✅ Type Definitions      │  🔄 Component Refactoring
─────────────────────────┼──────────────────────────
Low Impact, Low Effort   │  Low Impact, High Effort
✅ Code Formatting       │  ⏸️  UI Library Migration
✅ Naming Conventions    │  ⏸️  Testing Setup
```

---

## 🎯 Quick Wins (Week 1-2)

### 1. Setup Infrastructure
**Effort:** Low | **Impact:** High | **Time:** 2-3 days

```bash
# Install dependencies
npm install @tanstack/react-query zustand axios zod
npm install -D @tanstack/react-query-devtools
```

**Files to create:**
- `src/shared/api/client.ts` - Axios instance با interceptors
- `src/shared/api/error-handler.ts` - Global error handling
- `src/shared/config/env.ts` - Environment variables
- `src/shared/types/api.ts` - Common API types

**Benefits:**
- ✅ Centralized API configuration
- ✅ Consistent error handling
- ✅ Better type safety

---

### 2. Extract Utility Functions
**Effort:** Low | **Impact:** Medium | **Time:** 1 day

**Current issues:**
```typescript
// ❌ Repeated in multiple files
const priceEnglish = convertPersianToEnglish(price);
const priceNumber = parseInt(priceEnglish.replace(/,/g, ""));
```

**Solution:**
```typescript
// ✅ src/shared/utils/persian.ts
export const persianUtils = {
  toEnglishNumber: (str: string): string => { ... },
  toEnglishPrice: (price: string): number => { ... },
  formatPrice: (price: number): string => { ... },
};
```

**Files to create:**
- `src/shared/utils/persian.ts`
- `src/shared/utils/currency.ts`
- `src/shared/utils/format.ts`
- `src/shared/utils/validation.ts`

---

### 3. Centralize Constants
**Effort:** Low | **Impact:** Medium | **Time:** 1 day

**Current issues:**
```typescript
// ❌ Hard-coded در چند فایل
const API_BASE_URL = "https://peyvandyar.amintvk.ir/api";
const AUTH_COOKIE_NAME = "peyvandyar_token";
```

**Solution:**
```typescript
// ✅ src/shared/config/constants.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  TIMEOUT: 30000,
} as const;

export const AUTH_CONFIG = {
  COOKIE_NAME: 'peyvandyar_token',
  TOKEN_EXPIRY_DAYS: 7,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  // ...
} as const;
```

---

## 🔄 Medium Priority (Week 3-4)

### 4. Migrate Auth Feature
**Effort:** Medium | **Impact:** High | **Time:** 3-4 days

**Structure:**
```
features/auth/
├── api/
│   ├── auth.service.ts       # API calls
│   └── auth.types.ts          # Types
├── hooks/
│   ├── useAuth.ts             # Main auth hook
│   ├── useLogin.ts            # Login logic
│   └── useLogout.ts           # Logout logic
├── store/
│   └── authStore.ts           # Zustand store
├── components/
│   ├── AuthGuard.tsx          # Route protection
│   └── LoginForm.tsx          # Login UI
└── utils/
    ├── token.ts               # Token management
    └── validation.ts          # Auth validation
```

**Migration steps:**
1. Create `authStore.ts` با Zustand
2. Move token logic از `lib/auth.ts` به `features/auth/utils/token.ts`
3. Create `useAuth` hook
4. Create `AuthGuard` component
5. Update pages to use new auth system
6. Remove old `lib/auth.ts`

---

### 5. Migrate Products Feature
**Effort:** High | **Impact:** High | **Time:** 5-6 days

**Current issues:**
- API calls scattered در components
- No caching
- Duplicate data fetching
- No optimistic updates

**Solution:**
```typescript
// features/products/hooks/useProducts.ts
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// features/products/hooks/useBulkUpdate.ts
export function useBulkUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productsService.bulkUpdate,
    onMutate: async (products) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueryData(['products']);
      queryClient.setQueryData(['products'], (old) => 
        updateProductsOptimistically(old, products)
      );
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['products'], context?.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

---

### 6. Migrate Payment Feature
**Effort:** Medium | **Impact:** High | **Time:** 2-3 days

**Current issues:**
- Payment logic در component
- No proper error handling
- Type inconsistencies

**Solution:**
```
features/payment/
├── api/
│   ├── payment.service.ts
│   └── payment.types.ts
├── hooks/
│   ├── usePayment.ts
│   └── usePaymentStatus.ts
├── components/
│   ├── PaymentModal.tsx
│   └── PaymentCallback.tsx
└── utils/
    └── currency.ts
```

---

## 🚀 Long-term (Week 5-8)

### 7. Component Library Standardization
**Effort:** High | **Impact:** Medium | **Time:** 1-2 weeks

**Goals:**
- Consistent component API
- Proper prop types
- Accessibility compliance
- Storybook documentation

**Example:**
```typescript
// components/ui/Button.tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }))}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Spinner />}
        {children}
      </button>
    );
  }
);
```

---

### 8. Testing Infrastructure
**Effort:** High | **Impact:** High | **Time:** 2-3 weeks

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event msw
```

**Test structure:**
```
features/products/
├── __tests__/
│   ├── products.service.test.ts
│   ├── useProducts.test.ts
│   └── ProductCard.test.tsx
└── __mocks__/
    └── products.mock.ts
```

---

## 📊 Metrics & Success Criteria

### Code Quality Metrics
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (except necessary cases)
- [ ] ESLint errors: 0
- [ ] Test coverage: >70%

### Performance Metrics
- [ ] Initial load time: <2s
- [ ] Time to Interactive: <3s
- [ ] Lighthouse score: >90

### Developer Experience
- [ ] New feature setup time: <30 min
- [ ] Build time: <1 min
- [ ] Hot reload time: <1s

---

## 🛠️ Tools & Scripts

### Code Quality
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "analyze": "npm run build && next-bundle-analyzer"
  }
}
```

### Migration Helpers
```bash
# Find all API calls
grep -r "fetch(" src/

# Find all useState for server data
grep -r "useState.*\[\]" src/

# Find all hardcoded URLs
grep -r "https://" src/
```

---

## ⚠️ Risk Management

### High Risk Areas
1. **Auth System** - Critical, needs careful testing
2. **Payment Flow** - Money involved, zero tolerance for bugs
3. **Product Updates** - Bulk operations can affect many products

### Mitigation Strategies
1. **Feature Flags** - Enable new features gradually
2. **Parallel Running** - Keep old code until new is proven
3. **Rollback Plan** - Git tags for each major change
4. **Monitoring** - Error tracking from day 1

---

## 📅 Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Infrastructure | API client, utils, types |
| 3-4 | Auth & Products | Feature migration |
| 5-6 | Payment & Admin | Feature migration |
| 7-8 | Testing & Docs | Tests, documentation |

**Total Estimated Time:** 8 weeks (with 1 developer)

---

## 🎓 Learning Resources

### For Team
- [ ] Feature-Sliced Design workshop
- [ ] React Query tutorial
- [ ] Zustand basics
- [ ] TypeScript best practices

### Documentation
- [ ] Architecture decision records (ADRs)
- [ ] API documentation
- [ ] Component documentation
- [ ] Deployment guide

---

## ✅ Checklist Before Starting

- [ ] Team buy-in
- [ ] Backup current codebase
- [ ] Setup feature flags
- [ ] Create migration branch
- [ ] Setup error tracking
- [ ] Document current behavior
- [ ] Create rollback plan

---

**Remember:** 
> "Make it work, make it right, make it fast" - Kent Beck

ابتدا کد رو کار کن، بعد تمیزش کن، بعد بهینه‌اش کن. عجله نکن!
