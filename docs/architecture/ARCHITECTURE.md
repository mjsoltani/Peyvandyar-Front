# معماری پیشنهادی پروژه Peyvandyar Frontend

## 🎯 مشکلات فعلی

### 1. **API Layer**
- ❌ همه API calls در یک فایل `api.ts` (600+ خط)
- ❌ Type definitions نامنظم و گاهی inconsistent
- ❌ Error handling تکراری در هر component
- ❌ No caching or request deduplication
- ❌ Hard-coded base URL

### 2. **State Management**
- ❌ هیچ state management نداریم (Redux, Zustand, etc.)
- ❌ همه state در component ها local هست
- ❌ Data fetching تکراری در چند component
- ❌ No global state for user, auth, etc.

### 3. **Component Structure**
- ❌ Business logic داخل UI components
- ❌ Components خیلی بزرگ (200+ خط)
- ❌ No separation of concerns
- ❌ Duplicate code در چند component

### 4. **Type Safety**
- ❌ Type definitions پراکنده
- ❌ استفاده از `any` در جاهای زیاد
- ❌ No shared types/interfaces

### 5. **Authentication & Authorization**
- ❌ Auth logic پراکنده در چند فایل
- ❌ Admin auth با hardcoded credentials
- ❌ No role-based access control
- ❌ Cookie management دستی

---

## 🏗️ معماری پیشنهادی (Clean Architecture + Feature-Sliced Design)

```
src/
├── app/                          # Next.js App Router (UI Layer)
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/              # Dashboard group (protected)
│   │   ├── layout.tsx            # Dashboard layout with auth guard
│   │   ├── products/
│   │   ├── bulk-edit/
│   │   └── copy-product/
│   ├── (admin)/                  # Admin group (admin only)
│   │   ├── layout.tsx            # Admin layout with admin guard
│   │   ├── users/
│   │   └── pending/
│   └── (public)/                 # Public pages
│       ├── page.tsx              # Landing
│       └── subscription/
│
├── features/                     # Feature-based modules (Business Logic)
│   ├── auth/
│   │   ├── api/                  # Auth API calls
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   ├── hooks/                # Auth hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useLogin.ts
│   │   │   └── useLogout.ts
│   │   ├── store/                # Auth state (Zustand)
│   │   │   └── authStore.ts
│   │   ├── components/           # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   └── utils/
│   │       ├── token.ts
│   │       └── validation.ts
│   │
│   ├── products/
│   │   ├── api/
│   │   │   ├── products.service.ts
│   │   │   └── products.types.ts
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   ├── useProduct.ts
│   │   │   └── useBulkUpdate.ts
│   │   ├── store/
│   │   │   └── productsStore.ts
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ProductFilters.tsx
│   │   └── utils/
│   │       └── price.ts
│   │
│   ├── payment/
│   │   ├── api/
│   │   │   ├── payment.service.ts
│   │   │   └── payment.types.ts
│   │   ├── hooks/
│   │   │   ├── usePayment.ts
│   │   │   └── usePaymentStatus.ts
│   │   ├── components/
│   │   │   ├── PaymentModal.tsx
│   │   │   └── PaymentCallback.tsx
│   │   └── utils/
│   │       └── currency.ts
│   │
│   └── admin/
│       ├── api/
│       ├── hooks/
│       ├── store/
│       └── components/
│
├── shared/                       # Shared utilities (Infrastructure)
│   ├── api/                      # Core API infrastructure
│   │   ├── client.ts             # Axios/Fetch wrapper
│   │   ├── interceptors.ts       # Request/Response interceptors
│   │   ├── error-handler.ts      # Global error handling
│   │   └── types.ts              # Common API types
│   │
│   ├── config/                   # App configuration
│   │   ├── env.ts                # Environment variables
│   │   ├── constants.ts          # App constants
│   │   └── routes.ts             # Route definitions
│   │
│   ├── hooks/                    # Shared hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── cn.ts                 # Class name utility
│   │   ├── format.ts             # Formatting utilities
│   │   ├── validation.ts         # Validation utilities
│   │   └── persian.ts            # Persian number conversion
│   │
│   └── types/                    # Shared TypeScript types
│       ├── common.ts
│       ├── api.ts
│       └── models.ts
│
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   │
│   └── common/                   # Common reusable components
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
└── lib/                          # Legacy (to be migrated)
    └── ...
```

---

## 📋 Design Patterns پیشنهادی

### 1. **Repository Pattern** (API Layer)
```typescript
// features/products/api/products.service.ts
export class ProductsService {
  private baseUrl = '/products';

  async getAll(params: GetProductsParams): Promise<Product[]> {
    return apiClient.get(this.baseUrl, { params });
  }

  async getById(id: number): Promise<Product> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    return apiClient.patch(`${this.baseUrl}/${id}`, data);
  }

  async bulkUpdate(products: BulkUpdateDto[]): Promise<void> {
    return apiClient.patch(`${this.baseUrl}/batch-update`, { products });
  }
}

export const productsService = new ProductsService();
```

### 2. **Custom Hooks Pattern** (Data Fetching)
```typescript
// features/products/hooks/useProducts.ts
export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// features/products/hooks/useBulkUpdate.ts
export function useBulkUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productsService.bulkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('محصولات با موفقیت به‌روز شدند');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### 3. **State Management Pattern** (Zustand)
```typescript
// features/auth/store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (token, user) => {
    setAuthToken(token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    removeAuthToken();
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  updateUser: (userData) => 
    set((state) => ({ 
      user: state.user ? { ...state.user, ...userData } : null 
    })),
}));
```

### 4. **Composition Pattern** (Components)
```typescript
// features/products/components/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <ProductImage src={product.image} alt={product.title} />
        <ProductTitle>{product.title}</ProductTitle>
      </CardHeader>
      <CardContent>
        <ProductPrice price={product.price} />
        <ProductStock stock={product.stock} />
      </CardContent>
      <CardFooter>
        <ProductActions 
          onEdit={() => onEdit?.(product)}
          onDelete={() => onDelete?.(product.id)}
        />
      </CardFooter>
    </Card>
  );
}
```

### 5. **Error Boundary Pattern**
```typescript
// components/common/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## 🔧 Technology Stack پیشنهادی

### State Management
- **Zustand** → Global state (auth, user, settings)
- **React Query (TanStack Query)** → Server state (API data, caching)

### API Client
- **Axios** → HTTP client با interceptors
- **Zod** → Runtime validation

### Form Management
- **React Hook Form** → Form state
- **Zod** → Form validation

### Error Tracking
- **Sentry** (optional) → Error monitoring

---

## 📦 Migration Plan (مرحله به مرحله)

### Phase 1: Infrastructure (هفته 1)
1. ✅ Setup Zustand for auth state
2. ✅ Setup React Query
3. ✅ Create API client with interceptors
4. ✅ Create shared types
5. ✅ Setup error handling

### Phase 2: Auth Feature (هفته 2)
1. ✅ Migrate auth logic to `features/auth`
2. ✅ Create auth hooks
3. ✅ Create AuthGuard component
4. ✅ Update auth pages

### Phase 3: Products Feature (هفته 3)
1. ✅ Migrate products API to service
2. ✅ Create products hooks
3. ✅ Refactor product components
4. ✅ Update product pages

### Phase 4: Payment Feature (هفته 4)
1. ✅ Migrate payment logic
2. ✅ Create payment hooks
3. ✅ Refactor payment components

### Phase 5: Admin Feature (هفته 5)
1. ✅ Migrate admin logic
2. ✅ Implement proper RBAC
3. ✅ Create admin hooks

### Phase 6: Cleanup (هفته 6)
1. ✅ Remove old `lib/` files
2. ✅ Update all imports
3. ✅ Add tests
4. ✅ Documentation

---

## 🎨 Code Style Guidelines

### Naming Conventions
- **Components**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase با `use` prefix (`useProducts.ts`)
- **Services**: camelCase با `.service` suffix (`products.service.ts`)
- **Types**: PascalCase (`Product`, `User`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### File Organization
```
feature/
├── api/              # External communication
├── hooks/            # React hooks
├── store/            # State management
├── components/       # UI components
├── utils/            # Helper functions
└── types/            # TypeScript types
```

### Import Order
```typescript
// 1. External libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal features
import { useAuth } from '@/features/auth';
import { productsService } from '@/features/products';

// 3. Shared utilities
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui';

// 4. Types
import type { Product } from './types';

// 5. Styles
import './styles.css';
```

---

## 🚀 Benefits

### 1. **Maintainability**
- کد تمیز و سازماندهی شده
- هر feature مستقل و جدا
- راحت‌تر می‌شه feature جدید اضافه کرد

### 2. **Scalability**
- معماری برای رشد پروژه آماده است
- می‌شه به راحتی team member جدید اضافه کرد
- هر developer می‌تونه روی یک feature کار کنه

### 3. **Testability**
- Business logic جدا از UI
- راحت‌تر می‌شه unit test نوشت
- Mock کردن dependencies آسون‌تره

### 4. **Performance**
- React Query → Automatic caching
- Code splitting → Faster load times
- Optimistic updates → Better UX

### 5. **Developer Experience**
- Type safety → Fewer bugs
- Auto-completion → Faster development
- Clear structure → Easy onboarding

---

## 📚 Resources

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## ⚠️ Important Notes

1. **تدریجی migrate کن** - همه چیز رو یکجا تغییر نده
2. **Tests بنویس** - قبل از refactor، test بنویس
3. **Documentation نگه دار** - هر تغییر رو document کن
4. **Team رو inform کن** - همه باید از معماری جدید آگاه باشن
5. **Backward compatibility** - تا migration تموم نشده، هر دو روش باید کار کنن

---

**نکته مهم:** این معماری یه پیشنهاد هست. می‌تونی بر اساس نیاز پروژه تغییرش بدی. مهم اینه که یه ساختار consistent و قابل فهم داشته باشی.
