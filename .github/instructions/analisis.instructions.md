---
applyTo: '**'
---

# Markdown Alignment Orchestrator (Canonical)

## Objective

This instruction defines the canonical inventory of Backend Markdown documents and the mandatory synchronization flow to keep architecture, roadmap, changelogs, instructions, prompts, and skills aligned across Backend.

All analysis, planning, and implementation responses that affect documented behavior MUST validate and align the corresponding Markdown files listed here.

## Parsing/Formatting Baseline (Context7)

- Markdown syntax expectations are aligned with CommonMark 0.31.2 semantics (Context7 reference: `/websites/spec_commonmark_0_31_2`).
- Prefer explicit inline links to concrete documents, stable heading hierarchy, and unambiguous section names.
- Avoid ambiguous reference-link patterns when they reduce maintainability.

## Source-of-Truth Priority

When conflicts exist, resolve in this order:

1. `Backend/docs/IMPLEMENTATION_PLAN.md`
2. `Backend/docs/ARCHITECTURE.md`
3. `Backend/docs/API_REFERENCE.md`
4. Directory-level technical docs in `Backend/src/**/_*.md`
5. Repo-level READMEs and changelogs
6. Skills/prompts/auxiliary instruction docs

## Mandatory Sync Rules

When code changes impact behavior, models, routes, validation, architecture, roadmap, workflow, or team conventions:

- Update all affected markdown files in the same work cycle.
- Keep names, statuses, and phase labels consistent across docs.
- Ensure endpoint names, route prefixes, role names, and model names match implementation.
- Ensure changelog entries are coherent with actual commits.
- Do not mark phases/features as complete without matching implementation evidence.

## Technical Debt Matrix Protocol (Mandatory)

When architecture-level analysis is requested (C4, roadmap audit, gap analysis, refactor planning), produce and maintain a **Technical Debt Matrix** in canonical docs.

### Required behavior

1. **Detect first in code**: verify debt against implementation (`src/**`) before declaring it.
2. **Code-first remediation**: if debt is real and safe to fix in scope, apply code changes first.
3. **Document-only fallback**: if no debt exists (or remediation is out of scope), update docs to remove drift and clarify current architecture.
4. **Record evidence** per debt item with concrete file paths.
5. **Track status** with one of: `Open`, `In Progress`, `Resolved`, `Deferred`.

### Matrix minimum columns

- `Gap`
- `C4 Level/Layer`
- `Evidence (code/docs)`
- `Impact`
- `Remediation`
- `Status`
- `Owner/Date`

## Full Markdown Inventory (Backend)

### Backend root

- `Backend/CHANGELOG.md`
- `Backend/README.md`

### Backend docs

- `Backend/docs/API_REFERENCE.md`
- `Backend/docs/ARCHITECTURE.md`
- `Backend/docs/C4_DIAGRAMS.md`
- `Backend/docs/DATA_MODELS.md`
- `Backend/docs/FASE1_DATA_MODEL.md`
- `Backend/docs/FLOWS.md`
- `Backend/docs/IMPLEMENTATION_PLAN.md`
- `Backend/docs/README.md`
- `Backend/docs/ROLES.md`
- `Backend/docs/SYSTEM_ARCHITECTURE_DIAGRAM.md`
- `Backend/docs/TRUNK_BASED_DEVELOPMENT.md`
- `Backend/docs/USER_STORIES.md`

### Backend source directory docs

- `Backend/src/config/_CONFIG.md`
- `Backend/src/constants/_CONSTANTS.md`
- `Backend/src/controllers/_CONTROLLERS.md`
- `Backend/src/helpers/_HELPERS.md`
- `Backend/src/middleware/_MIDDLEWARE.md`
- `Backend/src/models/_MODELS.md`
- `Backend/src/plugins/_PLUGINS.md`
- `Backend/src/repositories/_REPOSITORIES.md`
- `Backend/src/routes/_ROUTES.md`
- `Backend/src/schemas/_SCHEMAS.md`
- `Backend/src/services/_SERVICES.md`
- `Backend/src/services/patient/README.md`
- `Backend/src/types/_TYPES.md`
- `Backend/src/utils/_UTILS.md`

### Backend governance, instructions, prompts, agents, skills

- `Backend/.github/copilot-instructions.md`
- `Backend/.github/agents/Beast Mode.AGENTS.md`
- `Backend/.github/agents/Research.AGENTS.md`
- `Backend/.github/instructions/analisis.instructions.md`
- `Backend/.github/instructions/code-quality.instructions.md`
- `Backend/.github/instructions/commit.instructions.md`
- `Backend/.github/instructions/document.instructions.md`
- `Backend/.github/instructions/fase_imp.instructions.md`
- `Backend/.github/instructions/types.instructions.md`
- `Backend/.github/prompts/task.prompt.md`
- `Backend/.github/skills/git-commit/SKILL.md`

## Execution Checklist for Any Markdown-Affecting Change

1. Identify implementation delta (models/routes/services/schemas/tests/process).
2. Map impacted docs using the inventory above.
3. Update canonical docs first (Implementation Plan, Architecture, API Reference when applicable).
4. Propagate to directory-level `_*.md` docs.
5. Update changelog(s) and status references.
6. Validate consistency of terms (roles, phases, endpoints, statuses).
7. Ensure no contradictory statements remain.
8. If the change relates to architecture/flow/debt, update the Technical Debt Matrix and its status.

## Drift Prevention

- If a new `.md` file is added in Backend, this inventory MUST be updated.
- If a markdown file is deleted or renamed, update this inventory in the same commit.
- Documentation-only commits MUST still maintain cross-file consistency.