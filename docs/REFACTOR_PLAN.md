# Refactor Plan - MAOS Production-Ready MVP

## Overview
This document outlines the problems found, proposed solutions, and implementation plan to transform the MAOS Sales Agent App into a production-ready MVP with full functionality, auditing, and testing.

**Date:** 2024
**Status:** In Progress

---

## Problems Found

### 1. Architecture & Code Organization

#### Missing Action Pattern
- **Problem:** No consistent pattern for async operations. Components directly call `fetch()` or store methods without error handling, loading states, or retry logic.
- **Impact:** Silent failures, poor UX, no observability
- **Files Affected:** All components with async operations

#### No Audit Logging
- **Problem:** Zero tracking of user actions. No way to debug issues or understand user behavior.
- **Impact:** No observability, difficult debugging, no compliance trail
- **Files Affected:** All interactive components

#### Inconsistent Error Handling
- **Problem:** API calls don't show errors to users. Failures are silent or only logged to console.
- **Impact:** Poor UX, users don't know when actions fail
- **Files Affected:** `components/AIPreviewDrawer.tsx`, all API route handlers

#### Missing Loading States
- **Problem:** Most async operations have no loading indicators. Users don't know if actions are in progress.
- **Impact:** Confusing UX, users may click multiple times
- **Files Affected:** All components with async operations

### 2. Type Safety & Data Layer

#### Mixed Data Sources
- **Problem:** App uses both `maos-store` (localStorage) and `sales-mock-data` (static). No clear adapter pattern.
- **Impact:** Confusion about data source, hard to swap implementations
- **Files Affected:** Multiple pages and components

#### Type Inconsistencies
- **Problem:** Some components use `any`, type guards are scattered
- **Impact:** Runtime errors, poor IDE support
- **Files Affected:** `lib/maos-store.tsx`, various components

### 3. UI/UX Issues

#### Broken/Incomplete Actions
- **Problem:** 
  - Risk alert buttons are disabled with no handler
  - "Run Agent" shows alert instead of opening AI drawer
  - AI Preview "Run" button has no loading/error states
- **Impact:** Dead UI elements, confusing UX
- **Files Affected:** `app/home/page.tsx`, `components/TaskDetailsDrawer.tsx`, `components/AIPreviewDrawer.tsx`

#### No Success Feedback
- **Problem:** Actions complete silently. Users don't know if operations succeeded.
- **Impact:** Poor UX, uncertainty
- **Files Affected:** All mutation operations

### 4. Testing

#### Minimal Test Coverage
- **Problem:** Only 3 interactive elements have tests. No integration or e2e tests for critical workflows.
- **Impact:** High risk of regressions, no confidence in changes
- **Files Affected:** Entire codebase

#### No Test Infrastructure
- **Problem:** Missing test utilities, mocks, and helpers. No CI test pipeline defined.
- **Impact:** Hard to write tests, no automated verification
- **Files Affected:** Test setup

### 5. Messaging & Copy

#### Outdated Copy
- **Problem:** App copy doesn't match MAOS elevator pitch. Missing key messaging about "real-time operating system", "bird's-eye view", "revenue vs admin drag".
- **Impact:** Inconsistent brand, unclear value prop
- **Files Affected:** Homepage, intro, about sections

---

## Proposed Solutions

### 1. Standardize Action Pattern

**Create:** `lib/action-helper.ts`
- Consistent async handler wrapper
- Built-in loading state management
- Toast/inline error reporting
- Audit logging integration
- Retry-safe behavior

**Usage Pattern:**
```typescript
const { execute, loading, error } = useAction();

const handleAction = execute(async () => {
  const result = await apiCall();
  showSuccess('Action completed');
  return result;
});
```

**Benefits:**
- Consistent error handling
- Automatic loading states
- Built-in audit logging
- Retry logic
- Type-safe

---

### 2. Observability / Auditing

**Create:** `lib/audit-logger.ts`
- Client-side event capture (button clicks, form submits, navigation)
- Server-side capture (API mutations, important reads)
- Storage: localStorage in dev, JSON file/mock in production
- Debug view: `/debug` route showing last 50 events

**Event Schema:**
```typescript
type AuditEvent = {
  id: string;
  timestamp: string;
  type: 'click' | 'submit' | 'navigate' | 'api_call' | 'error';
  component: string;
  action: string;
  metadata?: Record<string, unknown>;
  userId?: string;
};
```

**Benefits:**
- Full action trail
- Debugging support
- User behavior insights
- Compliance ready

---

### 3. Data Strategy

**Create:** `lib/data-adapter.ts`
- Adapter pattern for data access
- Supports both mock and real data
- Deterministic mock data layer
- Easy to swap implementations

**Structure:**
```typescript
interface DataAdapter {
  getPersonnel(): Promise<Personnel[]>;
  getAgents(): Promise<Agent[]>;
  getTasks(): Promise<Task[]>;
  // ...
}

class MockDataAdapter implements DataAdapter { ... }
class RealDataAdapter implements DataAdapter { ... }
```

**Benefits:**
- Consistent data interface
- Easy testing
- Simple mock/real swap
- Type-safe

---

### 4. Testing Setup

**Add:**
- Unit tests for utilities + action helper
- Component tests for key screens
- E2E tests (Playwright) for critical workflows:
  - App loads → leadership dashboard loads
  - Rev/admin filter changes visible results
  - Clicking 5+ buttons results in visible state change + audit log

**NPM Scripts:**
- `test` - Run all tests
- `test:unit` - Jest unit tests
- `test:e2e` - Playwright e2e tests
- `test:watch` - Watch mode
- `lint` - ESLint
- `typecheck` - TypeScript check

**CI Configuration:**
- Netlify-compatible test pipeline
- Headless test execution
- Test reports

**Benefits:**
- Regression prevention
- Confidence in changes
- Documentation via tests
- CI/CD ready

---

### 5. Button Guarantee

**For every interactive element:**
- Implement correct handler OR remove if dead/duplicate
- Add at least one test asserting observable behavior:
  - Changes UI
  - Navigates
  - Creates audit log entry
  - Triggers API and handles response

**Priority Order:**
1. Fix broken handlers (risk alerts, run agent)
2. Add loading/error states to all async operations
3. Add success feedback
4. Add tests

---

### 6. MAOS Messaging Update

**Update copy in:**
- Homepage (`app/home/page.tsx`)
- Intro component (`components/MaosIntro.tsx`)
- About/help sections (if any)
- Metadata/titles

**Key Messages:**
- "Real-time operating system"
- "Bird's-eye view of capacity, workload, outcomes"
- "Separates revenue-producing work from administrative drag"
- "Human teams and AI agents managed together"
- "Layered visibility, due diligence, decision-making"
- "Clearer accountability, smarter people-level reasoning"
- "Scales with structure instead of chaos"

---

## Implementation Order

### Phase 1: Foundation (Highest Impact)
1. ✅ Create QA_AUDIT.md
2. ✅ Create REFACTOR_PLAN.md
3. Create action helper pattern (`lib/action-helper.ts`)
4. Create audit logger (`lib/audit-logger.ts`)
5. Create data adapter (`lib/data-adapter.ts`)

### Phase 2: Wire Up Missing Handlers
6. Fix risk alert buttons (home page)
7. Fix "Run Agent" button (task details)
8. Add loading/error states to AI Preview
9. Add success feedback to all mutations

### Phase 3: Observability
10. Integrate audit logging into action helper
11. Add audit logging to all interactive elements
12. Create `/debug` route for audit log viewer

### Phase 4: Testing
13. Set up test infrastructure
14. Write unit tests for utilities
15. Write component tests for key screens
16. Write e2e tests for critical workflows
17. Add CI test pipeline

### Phase 5: Polish
18. Update copy to match MAOS pitch
19. Remove dead code
20. Final lint/typecheck pass
21. Create TESTING.md
22. Create DEFINITION_OF_DONE.md

---

## Definition of Done

### Functionality
- [ ] 100% of interactive elements mapped in QA_AUDIT.md
- [ ] Every button/clickable control does something correct and verifiable
- [ ] No silent failures - all actions show success/failure UI states
- [ ] All actions have loading states
- [ ] All actions have error handling

### Auditing
- [ ] All important user actions logged (client + server where relevant)
- [ ] Audit log stored persistently (localStorage or mock file)
- [ ] Debug view available at `/debug` showing last 50 events
- [ ] Logging integrated into action helper

### Testing
- [ ] Unit tests for utilities + action helper
- [ ] Component tests for key screens (render + interaction)
- [ ] E2E tests for at least 3 critical workflows:
  - [ ] App loads → leadership dashboard loads
  - [ ] Rev/admin filter changes visible results
  - [ ] Clicking 5+ buttons results in visible state change + audit log entry
- [ ] Tests pass locally
- [ ] Tests pass in CI (Netlify-compatible)
- [ ] npm scripts: `test`, `test:unit`, `test:e2e`, `lint`, `typecheck`

### Messaging
- [ ] Copy updated to match MAOS elevator pitch
- [ ] Homepage reflects key messages
- [ ] Intro component updated
- [ ] Metadata/titles updated

### Code Quality
- [ ] No dead code
- [ ] No `any` types (unless necessary)
- [ ] Build passes (Netlify-compatible)
- [ ] Lint passes
- [ ] Typecheck passes

### Documentation
- [ ] QA_AUDIT.md complete
- [ ] REFACTOR_PLAN.md complete
- [ ] TESTING.md created (how to run tests locally + in CI)
- [ ] DEFINITION_OF_DONE.md created (final checklist)

---

## Constraints

- Keep dependencies minimal
- Do not break the build
- Prefer TypeScript correctness over `any`
- No dead code - remove unused components, routes, old mocks
- Preserve existing visual design unless it blocks usability
- Prioritize "works" over "pretty"

---

## Risk Mitigation

### Risk: Breaking Existing Functionality
**Mitigation:** 
- Comprehensive test coverage before refactoring
- Incremental changes with verification
- Keep existing tests passing

### Risk: Performance Impact
**Mitigation:**
- Audit logging is lightweight (localStorage)
- Action helper adds minimal overhead
- Monitor and optimize if needed

### Risk: Scope Creep
**Mitigation:**
- Strict adherence to Definition of Done
- No new features beyond making existing UI functional
- Focus on correctness over new capabilities

---

## Success Metrics

1. **Functionality:** 100% of interactive elements working
2. **Test Coverage:** >80% of critical paths covered
3. **Audit Coverage:** 100% of important actions logged
4. **Build Status:** Passing in CI
5. **User Feedback:** All actions provide clear feedback (loading/success/error)

---

## Notes

- This refactor prioritizes correctness and observability over new features
- All changes should be backward-compatible with existing data
- Test infrastructure should be reusable for future development
- Audit logging can be enhanced later (e.g., server-side persistence, analytics)
