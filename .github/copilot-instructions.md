---
applyTo: '**'
---

# Project Guidelines - Veterinary Management System

> Coding standards and architectural patterns for consistent development.

## Core Standards

- **No decorative symbols** in code/docs/commits
- **Language**: English (code/commits), Spanish (user communication)
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)

---

## Architecture Quick Reference

### Backend Pattern

```
Routes → Middleware → Controllers → Services → Models
```

**Linked Profile Pattern**: Separate collections for auth (`users`) and domain (`administrators`, `veterinarians`, `assistants`, `clients`) linked by `userId` FK.

**See**: `docs/ARCHITECTURE.md` for full system design, roles, and security architecture.

### Frontend Pattern

- **Server State**: TanStack Query (ALL API data)
- **Client State**: Zustand (UI state ONLY - theme, modals, flags)
- **Never** duplicate server data in Zustand

```typescript
//Good
const { data: user } = useProfile() // TanStack Query
const isOpen = useStore(state => state.isModalOpen) // Zustand UI state

//Bad
const user = useStore(state => state.user) // DON'T copy server data
```

**See**: `docs/ARCHITECTURE.md` for component structure and patterns.

---

## TypeScript Essentials

```typescript
// Use type annotations, avoid `any`
function process(user: User): UserResponse { ... }

// Direct imports (no barrel files)
import { authService } from '../services/authService.js';

// Custom error classes with `new`
throw new BadRequest('Invalid format');
```

---

## API Standards

**Response Format**:
```typescript
{ success: true, data: {...}, message?: string }  // Success
{ success: false, error: string, details?: [...] } // Error
```

**Validation**: Zod schemas via middleware  
**Auth**: `checkAuth` + `requireRole(...roles)`

**See**: `docs/API_REFERENCE.md` for complete endpoints.

---

## Testing

```bash
bun run test       # Unit tests
bun run test:e2e   # E2E (Playwright)
bun run check      # Lint/format check
bun run check:fix  # Auto-fix
```

---

## Documentation

**Full reference** in `Backend/docs/`:

| File | Content |
|------|---------|
| `ARCHITECTURE.md` | System design, Linked Profile Pattern, security |
| `API_REFERENCE.md` | Complete endpoint specs |
| `ROLES.md` | Role definitions, permission matrix |
| `FLOWS.md` | Sequence diagrams |
| `DATA_MODELS.md` | 20 collections, relationships |
| `USER_STORIES.md` | Product backlog |

**Always check docs/** before implementing features.
