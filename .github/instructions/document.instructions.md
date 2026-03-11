---
applyTo: '**'
---

# Project Documentation Guide

## Objective
Maintain concise, up-to-date documentation for each directory to facilitate code understanding and collaboration.

## 1. Directory Documentation Structure

Each main directory in `src/` requires a single **`_[DIRNAME].md`** file that combines index, documentation, and changelog.

**File naming convention**: `_[DIRNAME].md` (underscore prefix ensures it appears first in directory listing)

Examples: `_CONTROLLERS.md`, `_MODELS.md`, `_SERVICES.md`, `_ROUTES.md`, `_SCHEMAS.md`, `_MIDDLEWARE.md`, `_HELPERS.md`, `_CONFIG.md`, `_UTILS.md`, `_PLUGINS.md`, `_REPOSITORIES.md`, `_TYPES.md`, `_CONSTANTS.md`

### Structure Template

````text
# [Directory Name]

**Last Updated**: YYYY-MM-DD

## Table of Contents

- Purpose and Overview
- Files
   - 2.1 fileName.ts
   - 2.2 anotherFile.ts
- Dependency Graph
- External Dependencies
- Import Boundary Rules
- Configuration (if applicable)
- Initialization Order (if applicable)
- Change Log

## Quick Navigation
- **Most Recent Changes**: See Change Log
- **Files**: N files, **M exports** total
- **Critical Files**: fileName.ts, anotherFile.ts

---

## Purpose and Overview
Brief description of directory purpose and main responsibilities.

## Files

### fileName.ts

**Purpose**: What this file does (1-2 sentences)

**Imports from:**
- `library` → `ImportedItem` — What it's used for
- `../path/otherFile.js` → `specificExport` — How it's used

**Exports:** `exportA`, `exportB`, `exportC`

**Imported in:** `src/path/consumer.ts`

**Configuration details** (if applicable):
- Specific settings, defaults, validation rules
- Environment variables used

---

## Dependency Graph

Visual representation of import/export relationships:

```
┌─────────────────┐
│   fileA.ts      │
│ Exports: X, Y   │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
    ┌────────┐    ┌────────┐
    │fileB.ts│    │fileC.ts│
    └────────┘    └────────┘
```

## External Dependencies
- `package-name` — Purpose in this directory

## Import Boundary Rules

> Enforced by `src/__tests__/architecture/layerBoundaries.test.ts`

### Allowed imports
| Source | Allowed targets |
| ------ | --------------- |
| `directory/*.ts` | list allowed import paths |

### Forbidden imports
list of forbidden import targets

## Change Log

### YYYY-MM-DD — Description
- **Added/Fixed/Updated**: Details
````

### Key conventions

- **Last Updated** date at the top MUST match the most recent Change Log entry date.
- **Imports from** uses arrow notation: `module` → `export` — description.
- **Exports** listed inline (short list) or grouped by sub-domain (long list, e.g., controllers).
- **Import Boundary Rules** are mandatory — all 13 `src/` directories have rules enforced by architecture tests.
- **Change Log** entries are chronological ascending (oldest first).

## 2. Priority Directories

1. **High**: `models/`, `schemas/`, `controllers/`, `services/`, `repositories/`
2. **Medium**: `routes/`, `middleware/`, `helpers/`, `types/`
3. **Low**: `config/`, `utils/`, `plugins/`, `constants/`

All 13 `src/` directories require documentation.

## 3. JSDoc Tags Reference

**Functions:**
```typescript
/**
 * Brief description
 * @param {Type} name - Description
 * @returns {Type} Description
 * @throws {Error} When thrown
 * @example functionName(arg)
 */
```

**Interfaces:**
```typescript
/**
 * Description
 * @interface
 * @property {type} name - Description
 */
```

**File Headers:**
```typescript
/**
 * @fileoverview Brief description
 * @module path/to/module
 */
```

## 4. Code Comment Tags

```typescript
// TODO: Task description
// FIXME: Bug description
// HACK: Temporary solution
// NOTE: Important info
// SECURITY: Security concern
// OPTIMIZE: Performance improvement needed
```

## 5. VSCode Extensions

**Essential:**
- `aaron-bond.better-comments` — Color-coded comments
- `gruntfuggly.todo-tree` — TODO sidebar
- `oouo-diogo-perdigao.docthis` — Auto JSDoc
- `yzhang.markdown-all-in-one` — **TOC generator**, shortcuts, preview (Recommended)
- `huntertran.auto-markdown-toc` — Auto-generate table of contents

With `yzhang.markdown-all-in-one`:
- Press `Ctrl+Shift+P` → "Markdown All in One: Create Table of Contents"
- Auto-updates on save
- Supports numbered sections

## 6. Documentation Workflow

**New code:**
1. Add file header with @fileoverview
2. Document all exported functions with JSDoc
3. Use tags for TODOs/FIXMEs
4. Update directory `_[DIRNAME].md` if new file added

**Before commit:**
```bash
bun run lint
bun run type-check
```

## 6.1 Technical Debt Documentation Rule

When the change touches architecture, C4 diagrams, repository contracts, service boundaries, or phase status:

1. Verify whether the debt exists in code.
2. If it exists and is in scope, fix code first.
3. Update canonical docs with a **Technical Debt Matrix** entry (gap, evidence, impact, remediation, status).
4. If no debt exists, update docs to explicitly mark the item as validated/aligned.

At minimum, sync:
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE.md`
- impacted directory `_[DIRNAME].md` docs

## 7. Quick Templates

**Complete File Template:**
```typescript
/**
 * @fileoverview Brief description
 * @module path/to/module
 */

// imports...

/**
 * Description
 * @param {Type} param - Description
 * @returns {Type} Description
 */
export function name(param: Type): ReturnType {
  // implementation
}
```

**File entry example (environment.ts):**
````text
### environment.ts

**Purpose**: Environment variable validation using Zod.

**Imports from:**
- `ms` (type) → `StringValue`

**Uses**: `process.loadEnvFile()` (Node.js native) to load environment variables from .env file.

**Exports:**
- `NODE_ENV: 'development' | 'production' | 'test'` — App environment
- `PORT: number` — Server port (default: 4000)
- `JWT_SECRET: string` — Access token secret
- `EMAIL_CONFIG: object` — SMTP settings (host, port, auth)
- `TOKEN_CONFIG: object` — Token TTLs (accessTokenExpiry, refreshTokenExpiry)

**Imported in:**
- `src/config/dataBase.ts` — Uses MONGO_URI, NODE_ENV
- `src/config/logger.ts` — Uses NODE_ENV
- `src/config/server.ts` — Uses PORT, FRONTEND_URL
- `src/helpers/generateJWT.ts` — Uses JWT_SECRET, TOKEN_CONFIG

**Configuration details:**
- Validates all env vars on startup, fails fast if invalid
- Provides defaults for optional settings
- Groups related config into objects (EMAIL_CONFIG, TOKEN_CONFIG)
````

**Dependency Graph Example:**
````text
## Dependency Graph

```
environment.ts (Foundation)
  ├─> Exports: NODE_ENV, PORT, JWT_SECRET, EMAIL_CONFIG, TOKEN_CONFIG
  │
  ├──> logger.ts
  │      ├─> Imports: pino, environment.ts
  │      └─> Imported by: dataBase.ts, server.ts, controllers/*
  │
  ├──> dataBase.ts
  │      ├─> Imports: mongoose, environment.ts, logger.ts
  │      └─> Imported by: server.ts
  │
  └──> server.ts
         ├─> Imports: express, environment.ts, logger.ts, dataBase.ts
         └─> Entry point (starts app)
```
````

**Controller:**
```typescript
/**
 * @route POST /api/resource
 * @access Public/Private
 */
export const handler = async (req: Request, res: Response) => {
  // implementation
};
```

## Checklist

Per-directory `_[DIRNAME].md` validation:

- [ ] `_[DIRNAME].md` exists with `**Last Updated**` date at top
- [ ] Table of Contents with numbered sections
- [ ] Quick Navigation section
- [ ] All `.ts` files documented in Files section
- [ ] "Imports from" section for each file
- [ ] "Imported in" section for each file (or "Exports" + "Imported in" shorthand)
- [ ] Dependency graph present
- [ ] Import Boundary Rules section present
- [ ] External Dependencies listed
- [ ] Change Log section at end with chronological ascending entries
- [ ] `Last Updated` date matches most recent Change Log entry
- [ ] Technical Debt Matrix updated when architecture/debt analysis is involved
- [ ] JSDoc on public functions in corresponding `.ts` files
- [ ] Tags for TODOs in code files