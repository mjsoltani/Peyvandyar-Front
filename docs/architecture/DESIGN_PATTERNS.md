# Design Patterns برای Peyvandyar Frontend

## 🎯 تحلیل پروژه

**نوع پروژه:** E-commerce Management Dashboard (SaaS)  
**ویژگی‌های کلیدی:**
- مدیریت محصولات (CRUD)
- ویرایش انبوه (Bulk operations)
- کپی محصول از marketplace
- پرداخت و اشتراک
- احراز هویت و مجوزدهی
- Real-time data updates

---

## 🏗️ Design Patterns پیشنهادی

### 1. **Repository Pattern** ⭐⭐⭐⭐⭐
**چرا؟** جداسازی Business Logic از Data Access

#### مشکل فعلی:
```typescript
// ❌ API calls مستقیم در component
const ProductList = () => {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);
}
```

#### راه‌حل:
```typescript
// ✅ Repository Pattern
// features/products/api/products.repository.ts
export class ProductsRepository {
  async getAll(filters?: ProductFilters): Promise<Product[]> {
    return apiClient.get('/products', { params: filters });
  }
  
  async getById(id: number): Promise<Product> {
    return apiClient.get(`/products/${id}`);
  }
  
  async bulkUpdate(products: BulkUpdateDto[]): Promise<void> {
    return apiClient.patch('/products/batch-update', { products });
  }
}

export const productsRepository = new ProductsRepository();

// Component
const ProductList = () => {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsRepository.getAll(),
  });
}
```

**مزایا:**
- ✅ تغییر API endpoint آسون (فقط یک جا)
- ✅ Mock کردن برای test راحت
- ✅ Caching و error handling متمرکز
- ✅ Type safety کامل

---

### 2. **Factory Pattern** ⭐⭐⭐⭐⭐
**چرا؟** ساخت اشیاء پیچیده با configuration های مختلف

#### Use Case: API Client Factory
```typescript
// shared/api/client-factory.ts
export class ApiClientFactory {
  static createAuthenticatedClient(): AxiosInstance {
    const client = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: 30000,
    });
    
    client.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) config.headers['X-Encrypted-Token'] = token;
      return config;
    });
    
    return client;
  }
  
  static createPublicClient(): AxiosInstance {
    return axios.create({
      baseURL: env.API_BASE_URL,
      timeout: 10000,
    });
  }
  
  static createUploadClient(): AxiosInstance {
    const client = this.createAuthenticatedClient();
    client.defaults.headers['Content-Type'] = 'multipart/form-data';
    return client;
  }
}
```

#### Use Case: Toast Notification Factory
```typescript
// shared/factories/toast.factory.ts
export class ToastFactory {
  static success(message: string) {
    return toast.success(message, {
      position: 'top-right',
      duration: 3000,
      icon: '✅',
    });
  }
  
  static error(error: ApiError) {
    const message = error.isSubscriptionExpired
      ? 'اشتراک شما به پایان رسیده است'
      : error.message;
      
    return toast.error(message, {
      position: 'top-right',
      duration: 5000,
      icon: '❌',
    });
  }
  
  static loading(message: string) {
    return toast.loading(message);
  }
}
```

**مزایا:**
- ✅ Consistent object creation
- ✅ پیچیدگی ساخت مخفی می‌شه
- ✅ راحت می‌شه configuration تغییر داد

---

### 3. **Strategy Pattern** ⭐⭐⭐⭐⭐
**چرا؟** الگوریتم‌های مختلف برای یک کار (مثلا قیمت‌گذاری، validation)

#### Use Case: Price Calculation Strategy
```typescript
// features/products/strategies/pricing.strategy.ts
interface PricingStrategy {
  calculate(basePrice: number, quantity: number): number;
}

class RetailPricing implements PricingStrategy {
  calculate(basePrice: number, quantity: number): number {
    return basePrice * quantity;
  }
}

class WholesalePricing implements PricingStrategy {
  calculate(basePrice: number, quantity: number): number {
    const discount = quantity > 100 ? 0.2 : quantity > 50 ? 0.1 : 0;
    return basePrice * quantity * (1 - discount);
  }
}

class SubscriptionPricing implements PricingStrategy {
  calculate(basePrice: number, months: number): number {
    const discount = months >= 12 ? 0.3 : months >= 6 ? 0.15 : 0;
    return basePrice * months * (1 - discount);
  }
}

// Usage
class PriceCalculator {
  constructor(private strategy: PricingStrategy) {}
  
  setStrategy(strategy: PricingStrategy) {
    this.strategy = strategy;
  }
  
  calculate(price: number, quantity: number): number {
    return this.strategy.calculate(price, quantity);
  }
}
```

#### Use Case: Payment Gateway Strategy
```typescript
// features/payment/strategies/gateway.strategy.ts
interface PaymentGateway {
  createPayment(amount: number): Promise<PaymentResponse>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

class BasalamGateway implements PaymentGateway {
  async createPayment(amount: number) {
    return apiClient.post('/payment/basalam/create', { amount });
  }
  
  async verifyPayment(transactionId: string) {
    return apiClient.get(`/payment/basalam/verify/${transactionId}`);
  }
}

class ZarinpalGateway implements PaymentGateway {
  async createPayment(amount: number) {
    return apiClient.post('/payment/zarinpal/create', { amount });
  }
  
  async verifyPayment(transactionId: string) {
    return apiClient.get(`/payment/zarinpal/verify/${transactionId}`);
  }
}

// Usage
const paymentService = new PaymentService(new BasalamGateway());
```

**مزایا:**
- ✅ راحت می‌شه الگوریتم جدید اضافه کرد
- ✅ کد تمیز و قابل test
- ✅ Open/Closed Principle

---

### 4. **Observer Pattern (Pub/Sub)** ⭐⭐⭐⭐
**چرا؟** Event-driven architecture برای real-time updates

#### Use Case: Product Update Events
```typescript
// shared/events/event-bus.ts
type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();
  
  subscribe(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }
  
  publish(event: string, data: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();

// Usage
// Component A: Publish
const handleBulkUpdate = async () => {
  await bulkUpdateProducts(products);
  eventBus.publish('products:updated', { count: products.length });
};

// Component B: Subscribe
useEffect(() => {
  const unsubscribe = eventBus.subscribe('products:updated', (data) => {
    toast.success(`${data.count} محصول به‌روز شد`);
    refetchProducts();
  });
  
  return unsubscribe;
}, []);
```

**مزایا:**
- ✅ Loose coupling بین components
- ✅ Real-time updates
- ✅ راحت می‌شه listener جدید اضافه کرد

---

### 5. **Adapter Pattern** ⭐⭐⭐⭐
**چرا؟** تبدیل interface های ناسازگار

#### Use Case: API Response Adapter
```typescript
// features/products/adapters/product.adapter.ts
interface BasalamProduct {
  id: number;
  name: string;
  price: number; // در ریال
  inventory: number;
}

interface AppProduct {
  id: number;
  title: string;
  price: number; // در تومان
  stock: number;
}

export class ProductAdapter {
  static fromBasalam(basalamProduct: BasalamProduct): AppProduct {
    return {
      id: basalamProduct.id,
      title: basalamProduct.name,
      price: basalamProduct.price / 10, // ریال به تومان
      stock: basalamProduct.inventory,
    };
  }
  
  static toBasalam(appProduct: AppProduct): BasalamProduct {
    return {
      id: appProduct.id,
      name: appProduct.title,
      price: appProduct.price * 10, // تومان به ریال
      inventory: appProduct.stock,
    };
  }
  
  static fromBasalamList(products: BasalamProduct[]): AppProduct[] {
    return products.map(p => this.fromBasalam(p));
  }
}

// Usage
const products = await apiClient.get('/products');
const adaptedProducts = ProductAdapter.fromBasalamList(products);
```

**مزایا:**
- ✅ جداسازی external API از internal models
- ✅ راحت می‌شه API عوض کرد
- ✅ Type safety

---

### 6. **Decorator Pattern** ⭐⭐⭐⭐
**چرا؟** اضافه کردن قابلیت به اشیاء بدون تغییر کد اصلی

#### Use Case: API Request Decorators
```typescript
// shared/decorators/api.decorators.ts
function withRetry(maxRetries: number = 3) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      let lastError;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      
      throw lastError;
    };
    
    return descriptor;
  };
}

function withCache(ttl: number = 60000) {
  const cache = new Map();
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
      
      const result = await originalMethod.apply(this, args);
      cache.set(key, { data: result, timestamp: Date.now() });
      
      return result;
    };
    
    return descriptor;
  };
}

// Usage
class ProductsRepository {
  @withRetry(3)
  @withCache(60000)
  async getAll(): Promise<Product[]> {
    return apiClient.get('/products');
  }
}
```

**مزایا:**
- ✅ Separation of concerns
- ✅ Reusable functionality
- ✅ Clean code

---

### 7. **Command Pattern** ⭐⭐⭐⭐
**چرا؟** Undo/Redo functionality برای bulk operations

#### Use Case: Bulk Edit with Undo
```typescript
// features/products/commands/product.commands.ts
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

class BulkUpdateCommand implements Command {
  private previousState: Product[];
  
  constructor(
    private products: Product[],
    private updates: Partial<Product>
  ) {}
  
  async execute() {
    // Save previous state
    this.previousState = [...this.products];
    
    // Apply updates
    await productsRepository.bulkUpdate(
      this.products.map(p => ({ ...p, ...this.updates }))
    );
  }
  
  async undo() {
    // Restore previous state
    await productsRepository.bulkUpdate(this.previousState);
  }
}

class CommandManager {
  private history: Command[] = [];
  private currentIndex = -1;
  
  async execute(command: Command) {
    await command.execute();
    
    // Remove any commands after current index
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new command
    this.history.push(command);
    this.currentIndex++;
  }
  
  async undo() {
    if (this.currentIndex >= 0) {
      await this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }
  
  async redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      await this.history[this.currentIndex].execute();
    }
  }
  
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }
  
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}

// Usage
const commandManager = new CommandManager();

const updateCommand = new BulkUpdateCommand(selectedProducts, {
  price: newPrice,
});

await commandManager.execute(updateCommand);

// Later...
if (commandManager.canUndo()) {
  await commandManager.undo(); // Undo the bulk update
}
```

**مزایا:**
- ✅ Undo/Redo functionality
- ✅ Command history
- ✅ Macro commands (multiple commands as one)

---

### 8. **Singleton Pattern** ⭐⭐⭐
**چرا؟** یک instance برای services مشترک

#### Use Case: Auth Service
```typescript
// features/auth/services/auth.service.ts
class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  
  private constructor() {
    // Private constructor
  }
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  setUser(user: User) {
    this.user = user;
  }
  
  getUser(): User | null {
    return this.user;
  }
  
  isAuthenticated(): boolean {
    return this.user !== null;
  }
}

// Usage
const authService = AuthService.getInstance();
```

**⚠️ توجه:** در React بهتره از Zustand یا Context استفاده کنی، نه Singleton!

---

### 9. **Builder Pattern** ⭐⭐⭐
**چرا؟** ساخت اشیاء پیچیده step by step

#### Use Case: Query Builder
```typescript
// shared/builders/query.builder.ts
class QueryBuilder {
  private params: Record<string, any> = {};
  
  page(page: number): this {
    this.params.page = page;
    return this;
  }
  
  perPage(perPage: number): this {
    this.params.per_page = perPage;
    return this;
  }
  
  search(query: string): this {
    this.params.search = query;
    return this;
  }
  
  filter(key: string, value: any): this {
    this.params[key] = value;
    return this;
  }
  
  sort(field: string, order: 'asc' | 'desc' = 'asc'): this {
    this.params.sort = field;
    this.params.order = order;
    return this;
  }
  
  build(): Record<string, any> {
    return { ...this.params };
  }
}

// Usage
const query = new QueryBuilder()
  .page(1)
  .perPage(20)
  .search('کفش')
  .filter('category', 'shoes')
  .sort('price', 'desc')
  .build();

const products = await productsRepository.getAll(query);
```

**مزایا:**
- ✅ Fluent API
- ✅ Readable code
- ✅ Optional parameters

---

### 10. **Facade Pattern** ⭐⭐⭐⭐
**چرا؟** ساده‌سازی interface پیچیده

#### Use Case: Payment Facade
```typescript
// features/payment/facades/payment.facade.ts
class PaymentFacade {
  constructor(
    private paymentGateway: PaymentGateway,
    private subscriptionService: SubscriptionService,
    private notificationService: NotificationService
  ) {}
  
  async processSubscriptionPayment(
    userId: number,
    planId: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      // 1. Create payment
      const payment = await this.paymentGateway.createPayment(amount);
      
      // 2. Redirect user
      window.location.href = payment.pay_url;
      
      return { success: true, paymentUrl: payment.pay_url };
    } catch (error) {
      // Handle error
      await this.notificationService.sendError(userId, error);
      throw error;
    }
  }
  
  async handlePaymentCallback(
    transactionId: string,
    status: string
  ): Promise<void> {
    // 1. Verify payment
    const isValid = await this.paymentGateway.verifyPayment(transactionId);
    
    if (isValid && status === 'success') {
      // 2. Activate subscription
      await this.subscriptionService.activate(transactionId);
      
      // 3. Send notification
      await this.notificationService.sendSuccess(transactionId);
    } else {
      // Handle failure
      await this.notificationService.sendFailure(transactionId);
    }
  }
}
```

**مزایا:**
- ✅ ساده‌سازی عملیات پیچیده
- ✅ کاهش coupling
- ✅ راحت‌تر برای استفاده

---

## 📊 Priority Matrix

| Pattern | Priority | Use Cases | Complexity |
|---------|----------|-----------|------------|
| Repository | ⭐⭐⭐⭐⭐ | API calls | Low |
| Factory | ⭐⭐⭐⭐⭐ | Object creation | Low |
| Strategy | ⭐⭐⭐⭐⭐ | Pricing, Payment | Medium |
| Observer | ⭐⭐⭐⭐ | Real-time updates | Medium |
| Adapter | ⭐⭐⭐⭐ | API integration | Low |
| Decorator | ⭐⭐⭐⭐ | Retry, Cache | Medium |
| Command | ⭐⭐⭐⭐ | Undo/Redo | High |
| Singleton | ⭐⭐⭐ | Services | Low |
| Builder | ⭐⭐⭐ | Query building | Low |
| Facade | ⭐⭐⭐⭐ | Complex flows | Medium |

---

## 🎯 Implementation Roadmap

### Week 1-2: Core Patterns
- [x] Repository Pattern (Done with infrastructure)
- [ ] Factory Pattern (API clients, Toasts)
- [ ] Adapter Pattern (API responses)

### Week 3-4: Business Logic
- [ ] Strategy Pattern (Pricing, Payment)
- [ ] Observer Pattern (Events)
- [ ] Facade Pattern (Payment flow)

### Week 5-6: Advanced Features
- [ ] Command Pattern (Undo/Redo)
- [ ] Decorator Pattern (Retry, Cache)
- [ ] Builder Pattern (Query builder)

---

## ⚠️ Anti-Patterns to Avoid

### 1. **God Object**
```typescript
// ❌ Bad
class ProductManager {
  getProducts() {}
  updateProducts() {}
  deleteProducts() {}
  calculatePrice() {}
  validateProduct() {}
  sendNotification() {}
  logActivity() {}
  // ... 50 more methods
}
```

### 2. **Spaghetti Code**
```typescript
// ❌ Bad
const handleSubmit = async () => {
  if (user) {
    if (products.length > 0) {
      if (hasPermission) {
        try {
          const result = await fetch(...);
          if (result.ok) {
            // nested hell...
          }
        } catch (e) {
          // ...
        }
      }
    }
  }
};
```

### 3. **Prop Drilling**
```typescript
// ❌ Bad
<App>
  <Dashboard user={user}>
    <Products user={user}>
      <ProductCard user={user}>
        <ProductActions user={user} />
      </ProductCard>
    </Products>
  </Dashboard>
</App>
```

**راه‌حل:** Use Zustand or Context!

---

## 📚 Resources

- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Patterns.dev](https://www.patterns.dev/)
- [React Patterns](https://reactpatterns.com/)

---

**نکته مهم:** Design patterns ابزار هستن، نه هدف! فقط وقتی استفاده کن که واقعا نیاز داری.

> "The best code is no code at all" - Jeff Atwood
