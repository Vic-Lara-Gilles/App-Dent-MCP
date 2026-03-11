---
applyTo: '**'
---

# Unified Phase Implementation Instruction

## Purpose

This instruction replaces legacy phase-specific instructions (`fase1`, `fase2`, `fase3`, etc.) with one canonical execution flow.

All phase work MUST be driven by:

- `Backend/docs/IMPLEMENTATION_PLAN.md` (single source of truth)
- `Backend/.github/instructions/analisis.instructions.md` (documentation orchestration)
- `Backend/.github/instructions/commit.instructions.md` (commit workflow)
- `Backend/.githooks/*` (mandatory hooks)

## Core Mandate

When the user asks to continue, implement, or complete a phase, you MUST:

1. Detect the target phase.
2. Implement according to `IMPLEMENTATION_PLAN.md` scope, status, dependencies, and constraints.
3. Apply SOLID and good engineering practices, supported by Context7 documentation when relevant.
4. Add or update tests to validate the implemented behavior.
5. Update documentation for all impacted directories and canonical docs.
6. Commit changes following commit instructions and hook requirements.

## Phase Detection Rules

### Explicit phase

If the user mentions a phase number/name directly, use that phase.

### Implicit phase

If not explicit, infer from `IMPLEMENTATION_PLAN.md` in this order:

1. Phase marked `Active`
2. Next `Planned` phase whose dependencies are `Completed` or `Active`-ready
3. If ambiguous, ask one concise clarification question

## Implementation Workflow (Required)

### Step 1 — Read and lock scope

- Read `Backend/docs/IMPLEMENTATION_PLAN.md`.
- Extract: phase status, scope, actors, models, dependencies, allowed deferrals, and exit criteria.
- Do not implement outside the target phase scope unless explicitly requested.

### Step 2 — Technical design and quality baseline

- Respect existing architecture and coding style.
- Apply SOLID:
	- Single Responsibility in services/controllers
	- Open/Closed for extensible logic
	- Liskov-safe contracts and substitutions
	- Interface Segregation for narrow contracts
	- Dependency Inversion via abstractions/repositories when appropriate
- Keep changes minimal, cohesive, and production-safe.

### Step 3 — Context7 usage policy

Use Context7 when:

- Introducing or changing framework/library patterns
- Needing authoritative API behavior
- Validating best-practice usage of dependencies

Workflow:

1. Resolve library ID
2. Fetch docs focused on the exact topic
3. Apply only relevant guidance to current codebase

Do not over-engineer from docs; prioritize project consistency.

### Step 4 — Implement phase deliverables

- Implement models/schemas/services/controllers/routes/types required by phase scope.
- Keep permission and ownership rules explicit.
- Preserve backward compatibility unless breaking change is requested and documented.

### Step 5 — Testing (mandatory)

For every behavior added/changed, add or update tests in the closest layer:

- `schemas` tests for validation contracts
- `services` tests for business rules
- `controllers` tests for request/response boundaries
- Additional route/integration tests when necessary

Validation strategy:

1. Run targeted tests first
2. Run relevant build/type checks
3. Expand to broader test scope if needed

No phase implementation is complete without passing tests for touched behavior.

### Step 6 — Documentation synchronization (mandatory)

Use `Backend/.github/instructions/analisis.instructions.md` as the orchestration guide.

Minimum updates after phase changes:

- Canonical: `Backend/docs/IMPLEMENTATION_PLAN.md`
- Technical docs affected by code changes (directory-level `Backend/src/**/_*.md`)
- Any backend docs impacted by semantics (API, architecture, flows, data models, user stories, roles)
- Changelog when behavior/fix is user-visible or operationally relevant

Rules:

- Keep terminology, statuses, and phase naming consistent
- Do not leave contradictory statements across docs
- If a new backend markdown file is created, include it in the analysis inventory

### Step 7 — Commit and hooks compliance (mandatory)

Follow `Backend/.github/instructions/commit.instructions.md` strictly.

Requirements:

- Use Conventional Commits in English
- Group commits by logical context
- Never use `--no-verify`
- Respect `.githooks` execution and fix issues if hooks fail
- Repeat commit cycle until working tree is clean

## Completion Criteria for a Phase Iteration

A phase iteration is considered complete only if all are true:

1. Implementation matches target phase scope from `IMPLEMENTATION_PLAN.md`
2. Tests for changed behavior are present and passing
3. Build/type checks pass for affected areas
4. Documentation was synchronized via analysis orchestration
5. Commit(s) created under commit workflow and hooks passed
6. Working tree is clean after commit cycle

## Boundaries and Safety

- Do not skip unresolved blockers; report them with concrete next action.
- Do not modify unrelated modules unless required to unblock the target phase.
- Do not invent roadmap status; derive status from `IMPLEMENTATION_PLAN.md`.
- Do not bypass protected branch policies.

## Output Expectations per Phase Task

When finishing a phase implementation request, report concisely:

1. What was implemented (phase-aligned)
2. What tests were added/updated and their results
3. Which docs were updated
4. Commit identifiers and message(s)
5. Remaining items (if any) tied to plan scope

