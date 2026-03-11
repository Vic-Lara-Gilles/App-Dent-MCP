---
applyTo: '**'
---

# TypeScript Types Organization Guide

**Last Updated**: 2026-02-01

## Core Principles

### 1. Co-location First
Define types where they're used, not in a separate types folder by default.

```typescript
// GOOD: Type lives with implementation
// models/User.ts
export interface IUser {
  name: string;
  email: string;
}

export const User = model<IUser>("User", userSchema);

// BAD: Type separated from implementation
// types/models.ts
export interface IUser { ... }

// models/User.ts
import type { IUser } from '../types/models';
export const User = model<IUser>("User", userSchema);
```

### 2. Shared Types in Dedicated Files
Only move types to a shared location when used by 3+ files.

```typescript
// types/api.ts - Shared across controllers and services
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 3. Avoid Barrel Files
Don't create index.ts files that re-export everything.

**Performance Impact:**
- Bundler loads entire module tree even if you need one type
- Tree-shaking doesn't work reliably with barrel files
- Easy to create circular dependencies, hard to debug
- TypeScript compiles unnecessary files

```typescript
// BAD: Barrel file
// types/index.ts
export type { User } from './domain/User';
export type { Product } from './domain/Product';
// ... 50 more exports

// Another file needs ONLY User type
import type { User } from '../types'; // Loads ALL 50 files!

// GOOD: Direct imports
import type { User } from '../models/User';
import type { ApiResponse } from '../types/api';
```

---

## Where to Place Types

| Type Category | Location | Reason |
|--------------|----------|--------|
| Model types | Same file as model | Co-location with implementation |
| Schema types | Same file as schema | Used only by that schema |
| API types | `types/api.ts` | Shared across controllers/services |
| Request/Response | `types/requests.ts`, `types/responses.ts` | Shared across routes |
| Auth types | `types/auth.ts` | Shared across middleware/services |
| Database types | Same file as connection/model | Co-located with implementation |
| DTO types | `types/dto/` | When separating API from domain |
| Utility types | `types/utils.ts` | Generic helpers like `Nullable<T>` |

---

## Project Structure

**Recommended (No Barrels):**

```
src/
├── models/
│   ├── User.ts              // exports: IUser, IUserMethods, User (model)
│   ├── Administrator.ts     // exports: IAdministrator, Administrator
│   └── Client.ts            // exports: IClient, IClientMethods, Client
├── types/
│   ├── api.ts               // Shared: ApiResponse<T>, ApiError
│   ├── auth.ts              // Shared: JWTPayload, AuthRequest
│   ├── requests.ts          // Shared: CreateUserRequest, UpdateUserRequest
│   └── responses.ts         // Shared: UserResponse, LoginResponse
├── services/
│   └── userService.ts       // imports from: '../models/User', '../types/auth'
└── controllers/
    └── userController.ts    // imports from: '../services/userService', '../types/api'
```

**Avoid (Types Separated):**

```
src/
├── types/
│   ├── index.ts             // BAD: Barrel file - loads everything
│   ├── models/              // BAD: Types separated from models
│   │   ├── User.ts
│   │   └── Admin.ts
│   └── dto/
│       └── CreateUserDTO.ts
└── models/
    ├── User.ts              // Must import from ../types/models/User
    └── Admin.ts
```

---

## Import Guidelines

### Use Relative Imports

```typescript
// GOOD: Relative imports
import type { IUser } from '../models/User';
import type { ApiResponse } from '../types/api';
import { userService } from '../services/userService';

// BAD: Absolute imports create coupling
import type { IUser } from '@/models/User';  // Requires path mapping
```

### Limit Parent Directory Traversal

```typescript
// BAD: Too many parent levels
import type { IUser } from '../../../../models/User';

// GOOD: Restructure or use intermediate exports
import type { IUser } from '../models/User';
```

### Import Types vs Values

```typescript
// GOOD: Use 'import type' for type-only imports
import type { IUser } from '../models/User';
import { User } from '../models/User';  // Runtime import

// BAD: Mixing type and value imports
import { IUser, User } from '../models/User';
```

TypeScript's `--importsNotUsedAsValues` and `--isolatedModules` work better with explicit `import type`.

---

## Barrel Files - Acceptable Use Cases

**Don't Use For:**
- Model types (should stay with models)
- Large projects (performance penalty increases)
- Frequently changing APIs (maintenance overhead)
- Deep module trees (circular dependency risks)

**Acceptable (Rare):**
1. Public API of a library when publishing to npm
2. Feature modules with few exports (< 5 exports)

```typescript
// my-lib/index.ts - Public API
export type { Config } from './config';
export { createClient } from './client';
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Interface (Model) | `I` + PascalCase | `IUser`, `IProduct` |
| Interface (General) | PascalCase | `ApiResponse`, `AuthRequest` |
| Type Alias | PascalCase | `UserRole`, `OrderStatus` |
| Enum | PascalCase | `UserRole`, `HttpStatus` |
| DTO | PascalCase + `DTO` | `CreateUserDTO` |
| Response | PascalCase + `Response` | `LoginResponse` |
| Request | PascalCase + `Request` | `CreateUserRequest` |
| Generic Type Params | Single uppercase letter | `T`, `K`, `V` |
| Utility Type | PascalCase + descriptive | `Nullable<T>` |

---

## Best Practices

### Co-locate Types with Implementation

```typescript
// models/User.ts
export interface IUser {
  name: string;
  email: string;
}

export interface IUserMethods {
  checkPassword(pwd: string): Promise<boolean>;
}

export const User = model<IUser, IUserModel, IUserMethods>("User", userSchema);
```

### Use `import type` for Type-Only Imports

```typescript
import type { IUser } from '../models/User';
import type { ApiResponse } from '../types/api';
import { User } from '../models/User';
import { apiService } from '../services/apiService';
```

### Minimize Exported Surface

```typescript
interface InternalConfig {  // Not exported - internal only
  secret: string;
}

export interface PublicConfig {  // Exported - public API
  apiUrl: string;
}
```

### Organize by Feature, Not Type

```typescript
// GOOD: Feature-based
src/
├── auth/
│   ├── AuthService.ts       // Has auth types + logic
│   └── authController.ts
└── users/
    ├── UserService.ts       // Has user types + logic
    └── userController.ts

// BAD: Type-based
src/
├── types/
│   ├── auth.ts
│   └── user.ts
├── services/
└── controllers/
```

---

## Anti-Patterns

### Over-Engineering Type Hierarchies

```typescript
// BAD: Too many abstraction layers
interface BaseEntity { id: string; }
interface TimestampedEntity extends BaseEntity { createdAt: Date; }
interface SoftDeletableEntity extends TimestampedEntity { deletedAt?: Date; }
interface User extends SoftDeletableEntity { name: string; }

// GOOD: Flat when possible
interface User {
  id: string;
  name: string;
  createdAt: Date;
  deletedAt?: Date;
}
```

### Barrel Files for Everything

```typescript
// BAD: types/index.ts re-exports everything
export type * from './models';
export type * from './api';

// GOOD: Import directly from source
import type { IUser } from '../models/User';
```

### Type-Only Modules

```typescript
// BAD: Entire file just for types
// types/user.ts
export interface IUser { ... }
export interface IUserMethods { ... }

// models/User.ts (imports from types)
import type { IUser } from '../types/user';

// GOOD: Types with implementation
// models/User.ts
export interface IUser { ... }
export interface IUserMethods { ... }
export const User = model<IUser>(...);
```

---

## Decision Tree

```
Is the type used in only ONE file?
├─ YES → Define it in that file
└─ NO
   └─ Is it used by 2 files?
      ├─ YES → Keep in original file, import where needed
      └─ NO (3+ files)
         └─ Is it domain-specific (User, Product)?
            ├─ YES → Keep in model file (co-location)
            └─ NO (cross-cutting: API, Auth)
               └─ Move to types/<category>.ts
```

---

**References:**
- [TypeScript Handbook - Modules](https://www.typescriptlang.org/docs/handbook/modules/introduction.html)
- [Google TypeScript Style Guide](https://ts.dev/style/)

**Context7 Sources:**
- `/websites/typescriptlang` - Module organization
- `/websites/ts_dev-style` - Google style guide on imports and organization
