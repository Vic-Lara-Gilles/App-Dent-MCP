---
applyTo: "src/**/*.ts"
---

# Code Quality - SOLID & Best Practices

## SOLID Principles

### 1. Single Responsibility (SRP)

Each module has **one reason to change**. Layer responsibilities:

| Layer | Responsibility |
|-------|---------------|
| Controllers | HTTP handling only (`req`, `res`, status codes) |
| Services | Business logic and orchestration |
| Repositories | Data access only |
| Middleware | Cross-cutting concerns (auth, validation, logging) |

```typescript
// Good: Controller delegates to service
class ClientController {
  constructor(private clientService: ClientService) {}
  async create(req: Request, res: Response): Promise<void> {
    const client = await this.clientService.createClient(req.body);
    res.status(201).json(client);
  }
}

// Bad: Controller with business logic, DB access, email sending
```

### 2. Open/Closed (OCP)

Open for **extension**, closed for **modification**. Use interfaces/strategies instead of if/else chains.

```typescript
// Good: Strategy pattern - add new types without modifying existing code
interface INotificationStrategy {
  send(to: string, message: string): Promise<void>;
}
class EmailNotification implements INotificationStrategy { /* ... */ }
class SMSNotification implements INotificationStrategy { /* ... */ }

class NotificationService {
  constructor(private strategy: INotificationStrategy) {}
  async notify(to: string, msg: string) { await this.strategy.send(to, msg); }
}

// Bad: if/else or switch on type string - requires modification for each new type
```

### 3. Liskov Substitution (LSP)

Subtypes must honor the **contract** of their base type. Never throw where base returns null, never narrow accepted inputs, never widen possible errors.

```typescript
// Good: Implements contract faithfully
class ClientRepository implements IRepository<IClient> {
  async findById(id: string): Promise<IClient | null> {
    return await Client.findById(id); // Returns null if not found (honors contract)
  }
}

// Bad: Subclass throws instead of returning null - breaks substitutability
```

### 4. Interface Segregation (ISP)

Many **specific interfaces** > one general interface. Clients should not depend on methods they don't use.

```typescript
// Good: Granular interfaces
interface IReadable<T> { findById(id: string): Promise<T | null>; findAll(): Promise<T[]>; }
interface IWritable<T> { create(data: Partial<T>): Promise<T>; update(id: string, data: Partial<T>): Promise<T>; }
interface IDeletable { delete(id: string): Promise<void>; }

class ReadOnlyService implements IReadable<IClient> { /* only read methods */ }
class FullCRUDService implements IReadable<IClient>, IWritable<IClient>, IDeletable { /* all */ }

// Bad: One fat interface forcing unused method implementations that throw "Not supported"
```

### 5. Dependency Inversion (DIP)

Depend on **abstractions**, not concretions. Inject dependencies via constructor.

```typescript
// Good: Dependencies injected - easy to test
class AuthService {
  constructor(private emailService: IEmailService, private userRepo: IUserRepository) {}
  async register(data: RegisterInput): Promise<IUser> {
    const user = await this.userRepo.create(data);
    await this.emailService.send(user.email, "Welcome", "...");
    return user;
  }
}
// Test: new AuthService(mockEmail, mockRepo)

// Bad: new MailtrapEmailService() inside method - impossible to test without real service
```

---

## Best Practices

### TypeScript Strict Typing

- No `any` without documented reason; prefer `unknown` for truly unknown types
- Define explicit return types on all functions
- Use `: Foo` annotation over `as Foo` assertion for object literals
- Use parameter properties: `constructor(private readonly name: string) {}`

```typescript
// Good
async function createUser(data: CreateUserInput): Promise<IUser> { /* ... */ }

// Bad
async function createUser(data: any): Promise<any> { /* ... */ }
```

### Error Handling

Use **custom error classes** with status codes. Always `try-catch` async operations and forward errors via `next(error)`.

```typescript
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

// Service usage
const client = await this.clientRepository.findById(id);
if (!client) throw new NotFoundError("Client", id);

// Controller: always wrap in try-catch, call next(error) on failure
// Bad: throw new Error("Not found") - no context, no status code
```

### Async/Await

- **Controllers**: wrap in `try-catch`, delegate errors via `next(error)`
- **Services**: catch specific errors (e.g., `error.code === 11000`), rethrow as custom errors
- Never leave promise rejections unhandled

### Testing

- Inject dependencies to enable mocking (follows DIP)
- Coverage goals: Services >80%, Utilities 100%, Controllers via integration tests

```typescript
describe('ClientService', () => {
  it('should create client and send email', async () => {
    const mockRepo = { create: jest.fn().mockResolvedValue(mockClient) };
    const mockEmail = { sendWelcome: jest.fn() };
    const service = new ClientService(mockRepo, mockEmail);
    await service.create(validInput);
    expect(mockRepo.create).toHaveBeenCalledWith(validInput);
    expect(mockEmail.sendWelcome).toHaveBeenCalled();
  });
});
```

---

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **God Object** | One class with register, login, sendEmail, uploadFile, etc. | Split into focused services |
| **Anemic Model** | Models with only data, all logic in services | Add behavior to domain models when appropriate |
| **Feature Envy** | `order.client.subscription.tier === "premium"` chains | Encapsulate: `client.isPremiumActive()` |
| **Scattered Validation** | `if (!req.body.name)` checks in controllers | Use Zod schemas via validation middleware |
| **Magic Strings** | `throw new Error("Not found")` | Use custom error classes with context |

---

## Pre-Commit Checklist

- [ ] Single responsibility per function/class
- [ ] Dependencies injected, not instantiated
- [ ] Inputs validated with Zod schemas
- [ ] Errors handled with custom error classes + try-catch
- [ ] No `any` types (use `unknown` if needed)
- [ ] Tests written for business logic
- [ ] No `console.log` (use logger)
- [ ] JSDoc on complex logic
