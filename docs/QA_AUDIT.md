# QA Audit - Interactive Elements Inventory

## Overview
This document inventories all interactive UI elements in the MAOS Sales Agent App, their expected behavior, current status, and test coverage.

**Generated:** 2024
**Last Updated:** During refactor implementation

---

## A) Interactive Elements Inventory

### Navigation & Global Controls

#### 1. Sidebar Navigation Links
- **Location:** `components/Sidebar.tsx` (lines 44-56, 70-82)
- **Type:** Link buttons (desktop sidebar + mobile bottom nav)
- **Expected Behavior:** Navigate to respective pages, highlight active route
- **Current Behavior:** ✅ Working - uses Next.js Link, active state computed correctly
- **Backend Dependency:** None
- **Test Coverage:** None (needs unit test for active state logic)

#### 2. Command Palette (Cmd/Ctrl+K)
- **Location:** `components/CommandPalette.tsx` (lines 21-141)
- **Type:** Modal with search input and result buttons
- **Expected Behavior:** 
  - Opens on Cmd/Ctrl+K
  - Filters navigation, personnel, agents
  - Navigates on selection
  - Closes on Escape
- **Current Behavior:** ✅ Working - keyboard handler, search, navigation all functional
- **Backend Dependency:** None (uses store data)
- **Test Coverage:** None (needs integration test)

#### 3. TopBar "AI Preview" Button
- **Location:** `components/TopBar.tsx` (line 16)
- **Type:** Button
- **Expected Behavior:** Opens AI Preview drawer
- **Current Behavior:** ✅ Working - calls `setAiPanelOpen(true)`
- **Backend Dependency:** None
- **Test Coverage:** None

---

### Home Page (`/home`)

#### 4. Team Card Links
- **Location:** `app/home/page.tsx` (lines 177-248)
- **Type:** Link cards
- **Expected Behavior:** Navigate to `/map?team={teamId}` with team filter
- **Current Behavior:** ✅ Working - Link component with href
- **Backend Dependency:** None
- **Test Coverage:** None

#### 5. Risk Alert Action Buttons
- **Location:** `app/home/page.tsx` (lines 266-272)
- **Type:** Disabled button (stub)
- **Expected Behavior:** Should handle risk action (currently shows "Coming soon")
- **Current Behavior:** ❌ Broken - button is disabled, no handler
- **Backend Dependency:** Unknown (needs definition)
- **Test Coverage:** None

#### 6. Quick Action Links
- **Location:** `app/home/page.tsx` (lines 593-624)
- **Type:** Link cards (Org Map, Task Queue, Agents, Personnel)
- **Expected Behavior:** Navigate to respective pages
- **Current Behavior:** ✅ Working - Link components
- **Backend Dependency:** None
- **Test Coverage:** None

#### 7. "View org map" Link
- **Location:** `app/home/page.tsx` (line 546-552)
- **Type:** Link
- **Expected Behavior:** Navigate to `/map`
- **Current Behavior:** ✅ Working
- **Backend Dependency:** None
- **Test Coverage:** None

#### 8. "View all agents" Link
- **Location:** `app/home/page.tsx` (line 632-638)
- **Type:** Link
- **Expected Behavior:** Navigate to `/agents`
- **Current Behavior:** ✅ Working
- **Backend Dependency:** None
- **Test Coverage:** None

---

### Map Page (`/map`)

#### 9. Flow Trace Toggle
- **Location:** `app/map/page.tsx` (line 129-131, via MapControlBar)
- **Type:** Button toggle
- **Expected Behavior:** Toggle `showFlowTrace` state, update canvas
- **Current Behavior:** ✅ Working - state updates, passed to canvas
- **Backend Dependency:** None
- **Test Coverage:** None

#### 10. Time Window Selector (24h/7d)
- **Location:** `app/map/page.tsx` (line 133-135, via MapControlBar)
- **Type:** Button group
- **Expected Behavior:** Change time window, update displayed data
- **Current Behavior:** ✅ Working - state updates
- **Backend Dependency:** None (currently no data filtering by time)
- **Test Coverage:** None

#### 11. Revenue/Drag Overlay Toggle
- **Location:** `app/map/page.tsx` (lines 194-204)
- **Type:** Button toggle
- **Expected Behavior:** Show/hide revenue overlay panel
- **Current Behavior:** ✅ Working - toggles `showRevenueOverlay`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 12. Overlay Mode Buttons (None/Tasks/Agents)
- **Location:** `app/map/page.tsx` (lines 213-243)
- **Type:** Button group
- **Expected Behavior:** Change overlay mode, update canvas display
- **Current Behavior:** ✅ Working - state updates, passed to canvas
- **Backend Dependency:** None
- **Test Coverage:** None

#### 13. Density Toggle (Compact/Comfortable)
- **Location:** `app/map/page.tsx` (lines 253-273)
- **Type:** Button group
- **Expected Behavior:** Change node density on canvas
- **Current Behavior:** ✅ Working - state updates, passed to TaskFeed
- **Backend Dependency:** None
- **Test Coverage:** None

#### 14. Label Mode Toggle (Off/Key/All)
- **Location:** `app/map/page.tsx` (lines 283-313)
- **Type:** Button group
- **Expected Behavior:** Change label visibility on canvas
- **Current Behavior:** ✅ Working - state updates, passed to canvas
- **Backend Dependency:** None
- **Test Coverage:** None

#### 15. Mobile Controls Toggle
- **Location:** `app/map/page.tsx` (lines 431-436)
- **Type:** Button
- **Expected Behavior:** Toggle mobile controls panel visibility
- **Current Behavior:** ✅ Working - toggles `mobileControlsOpen`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 16. Mobile Tasks Toggle
- **Location:** `app/map/page.tsx` (lines 439-445)
- **Type:** Button
- **Expected Behavior:** Toggle task feed panel on mobile
- **Current Behavior:** ✅ Working - toggles `mobileTasksOpen`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 17. Task Feed Clear Filter Button
- **Location:** `app/map/page.tsx` (lines 469-477)
- **Type:** Button
- **Expected Behavior:** Clear team/person filters
- **Current Behavior:** ✅ Working - resets filter state
- **Backend Dependency:** None
- **Test Coverage:** None

#### 18. Task Click Handler
- **Location:** `app/map/page.tsx` (line 137-139, via TaskFeed)
- **Type:** Click handler on task items
- **Expected Behavior:** Open task details drawer
- **Current Behavior:** ✅ Working - sets `selectedTask`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 19. Person/Department Selection (Canvas)
- **Location:** `app/map/page.tsx` (lines 95-111, via OrgMapCanvas)
- **Type:** Canvas click handlers
- **Expected Behavior:** Select person/dept, open details drawer, filter tasks
- **Current Behavior:** ✅ Working - handlers update state
- **Backend Dependency:** None
- **Test Coverage:** None

#### 20. Task Details Drawer Close
- **Location:** `app/map/page.tsx` (line 141-143, via TaskDetailsDrawer)
- **Type:** Button/X button
- **Expected Behavior:** Close drawer, clear selection
- **Current Behavior:** ✅ Working - ESC key and button both work
- **Backend Dependency:** None
- **Test Coverage:** None

#### 21. Task Details "Run Agent" Button
- **Location:** `components/TaskDetailsDrawer.tsx` (line 269, via onRunAgent prop)
- **Type:** Button
- **Expected Behavior:** Run/preview AI agent for task
- **Current Behavior:** ⚠️ Partial - shows alert, should open AI drawer
- **Backend Dependency:** None (client-side only)
- **Test Coverage:** None

---

### Personnel Page (`/personnel`)

#### 22. Search Input
- **Location:** `app/personnel/page.tsx` (line 143-148)
- **Type:** Input field
- **Expected Behavior:** Filter personnel list by name/title
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 23. Team Filter Dropdown
- **Location:** `app/personnel/page.tsx` (line 150-157)
- **Type:** Select dropdown
- **Expected Behavior:** Filter by team
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 24. Status Filter Dropdown
- **Location:** `app/personnel/page.tsx` (line 158-165)
- **Type:** Select dropdown
- **Expected Behavior:** Filter by status
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 25. Capacity Range Inputs
- **Location:** `app/personnel/page.tsx` (lines 167-182)
- **Type:** Number inputs
- **Expected Behavior:** Filter by capacity range
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 26. Team Quick Filter Buttons
- **Location:** `app/personnel/page.tsx` (lines 188-196)
- **Type:** Button group
- **Expected Behavior:** Quick filter by team
- **Current Behavior:** ✅ Working - sets `teamFilter` state
- **Backend Dependency:** None
- **Test Coverage:** None

#### 27. "Add new" Button
- **Location:** `app/personnel/page.tsx` (line 218)
- **Type:** Button
- **Expected Behavior:** Add new personnel entry
- **Current Behavior:** ✅ Working - calls `addPersonnel()` from store
- **Backend Dependency:** None (localStorage)
- **Test Coverage:** None

#### 28. Personnel Row Click
- **Location:** `app/personnel/page.tsx` (lines 236-303)
- **Type:** Button (full row)
- **Expected Behavior:** Select person, show details panel
- **Current Behavior:** ✅ Working - sets `selectedId`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 29. "View on map" Button (Personnel Row)
- **Location:** `app/personnel/page.tsx` (lines 291-300)
- **Type:** Button
- **Expected Behavior:** Navigate to map with person focus
- **Current Behavior:** ✅ Working - router.push with query param
- **Backend Dependency:** None
- **Test Coverage:** None

#### 30. Personnel Detail Panel "View on Map"
- **Location:** `components/MaosDetailPanel.tsx` (via prop)
- **Type:** Button
- **Expected Behavior:** Navigate to map with person focus
- **Current Behavior:** ✅ Working - passed handler works
- **Backend Dependency:** None
- **Test Coverage:** None

---

### Agents Page (`/agents`)

#### 31. Sidebar Toggle Button
- **Location:** `app/agents/page.tsx` (lines 424-429)
- **Type:** Button
- **Expected Behavior:** Toggle filter sidebar visibility
- **Current Behavior:** ✅ Working - toggles `sidebarOpen`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 32. Search Input
- **Location:** `app/agents/page.tsx` (lines 246-253)
- **Type:** Input field
- **Expected Behavior:** Filter agents by name/purpose/module
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 33. Quick Filter: Critical
- **Location:** `app/agents/page.tsx` (lines 259-263)
- **Type:** Toggle button
- **Expected Behavior:** Filter to show only critical agents
- **Current Behavior:** ✅ Working - toggles `showCriticalOnly`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 34. Quick Filter: Overloaded
- **Location:** `app/agents/page.tsx` (lines 264-268)
- **Type:** Toggle button
- **Expected Behavior:** Filter by high utilization
- **Current Behavior:** ✅ Working - sets `utilBand` to "high"
- **Backend Dependency:** None
- **Test Coverage:** None

#### 35. Filter Chips (Remove)
- **Location:** `app/agents/page.tsx` (lines 276-308)
- **Type:** Chip buttons with remove
- **Expected Behavior:** Remove individual filter
- **Current Behavior:** ✅ Working - removes from filter arrays
- **Backend Dependency:** None
- **Test Coverage:** None

#### 36. "Clear all" Filters Button
- **Location:** `app/agents/page.tsx` (lines 303-308)
- **Type:** Button
- **Expected Behavior:** Reset all filters
- **Current Behavior:** ✅ Working - calls `clearFilters()`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 37. Module Filter Chips
- **Location:** `app/agents/page.tsx` (lines 316-328)
- **Type:** Toggle chips
- **Expected Behavior:** Toggle module filter
- **Current Behavior:** ✅ Working - adds/removes from `selectedModules`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 38. Team Filter Chips
- **Location:** `app/agents/page.tsx` (lines 332-346)
- **Type:** Toggle chips
- **Expected Behavior:** Toggle team filter
- **Current Behavior:** ✅ Working - adds/removes from `selectedTeams`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 39. Status Filter Chips
- **Location:** `app/agents/page.tsx` (lines 350-364)
- **Type:** Toggle chips
- **Expected Behavior:** Toggle status filter
- **Current Behavior:** ✅ Working - adds/removes from `selectedStatuses`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 40. Utilization Band Buttons
- **Location:** `app/agents/page.tsx` (lines 370-385)
- **Type:** Toggle buttons
- **Expected Behavior:** Filter by utilization range
- **Current Behavior:** ✅ Working - sets `utilBand`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 41. Agent Selection (Canvas)
- **Location:** `app/agents/page.tsx` (line 164, via AgentsTopologyCanvas)
- **Type:** Canvas click handler
- **Expected Behavior:** Select agent, open details panel
- **Current Behavior:** ✅ Working - sets `selectedAgentId`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 42. Agent Details Panel Close
- **Location:** `app/agents/page.tsx` (lines 521-526)
- **Type:** Button
- **Expected Behavior:** Close details panel
- **Current Behavior:** ✅ Working - sets `detailsOpen(false)`, ESC key works
- **Backend Dependency:** None
- **Test Coverage:** None

#### 43. Agent Details "AI Preview" Button
- **Location:** `app/agents/page.tsx` (line 644)
- **Type:** Button
- **Expected Behavior:** Open AI drawer with agent context
- **Current Behavior:** ✅ Working - sets context and opens panel
- **Backend Dependency:** None
- **Test Coverage:** None

#### 44. Agent Details "View in Map" Button
- **Location:** `app/agents/page.tsx` (line 648)
- **Type:** Button
- **Expected Behavior:** Navigate to map with agent focus
- **Current Behavior:** ✅ Working - router.push with query param
- **Backend Dependency:** None
- **Test Coverage:** None

#### 45. Connected Agent Links (Upstream/Downstream)
- **Location:** `app/agents/page.tsx` (lines 607-632)
- **Type:** Button links
- **Expected Behavior:** Select connected agent
- **Current Behavior:** ✅ Working - sets `selectedAgentId`
- **Backend Dependency:** None
- **Test Coverage:** None

---

### Company Tasks Page (`/company-tasks`)

#### 46. Team Filter Dropdown
- **Location:** `app/company-tasks/page.tsx` (lines 195-206)
- **Type:** Select dropdown
- **Expected Behavior:** Filter tasks by team
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 47. Person Filter Dropdown
- **Location:** `app/company-tasks/page.tsx` (lines 209-220)
- **Type:** Select dropdown
- **Expected Behavior:** Filter tasks by person
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 48. Task Type Filter Dropdown
- **Location:** `app/company-tasks/page.tsx` (lines 223-234)
- **Type:** Select dropdown
- **Expected Behavior:** Filter by task type
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 49. Revenue Impact Filter Dropdown
- **Location:** `app/company-tasks/page.tsx` (lines 237-245)
- **Type:** Select dropdown
- **Expected Behavior:** Filter by revenue impact (Revenue/NonRevenue)
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 50. Status Filter Dropdown
- **Location:** `app/company-tasks/page.tsx` (lines 248-258)
- **Type:** Select dropdown
- **Expected Behavior:** Filter by status
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 51. Priority Filter Dropdown
- **Location:** `app/company-tasks/page.tsx` (lines 261-270)
- **Type:** Select dropdown
- **Expected Behavior:** Filter by priority
- **Current Behavior:** ✅ Working - filters via `useMemo`
- **Backend Dependency:** None
- **Test Coverage:** None

---

### Settings Page (`/settings`)

#### 52. Deep Mode Toggle
- **Location:** `app/settings/page.tsx` (line 53)
- **Type:** Button toggle
- **Expected Behavior:** Enable/disable deep mode, persist to localStorage
- **Current Behavior:** ✅ Working - uses `useLocalStorageBoolean`
- **Backend Dependency:** None
- **Test Coverage:** None

#### 53. "Reset demo data" Button
- **Location:** `app/settings/page.tsx` (line 64)
- **Type:** Button
- **Expected Behavior:** Reset all demo data to initial seed
- **Current Behavior:** ✅ Working - calls `resetDemoData()` from store
- **Backend Dependency:** None (localStorage)
- **Test Coverage:** None

#### 54. "Reset intro" Button
- **Location:** `app/settings/page.tsx` (lines 71-74)
- **Type:** Button
- **Expected Behavior:** Clear intro seen flag, redirect to home
- **Current Behavior:** ✅ Working - removes localStorage item, redirects
- **Backend Dependency:** None
- **Test Coverage:** None

---

### AI Preview Drawer

#### 55. AI Drawer Close Button
- **Location:** `components/AIPreviewDrawer.tsx` (line 187)
- **Type:** Button
- **Expected Behavior:** Close drawer
- **Current Behavior:** ✅ Working - calls `setAiPanelOpen(false)`, ESC key works
- **Backend Dependency:** None
- **Test Coverage:** None

#### 56. Prompt Template Buttons
- **Location:** `components/AIPreviewDrawer.tsx` (lines 195-207)
- **Type:** Button chips
- **Expected Behavior:** Fill prompt textarea with template
- **Current Behavior:** ✅ Working - sets `prompt` state
- **Backend Dependency:** None
- **Test Coverage:** None

#### 57. "Use context" Checkbox
- **Location:** `components/AIPreviewDrawer.tsx` (lines 220-228)
- **Type:** Checkbox
- **Expected Behavior:** Toggle context inclusion in AI request
- **Current Behavior:** ✅ Working - toggles `useContext` state
- **Backend Dependency:** None
- **Test Coverage:** None

#### 58. "Run" Button
- **Location:** `components/AIPreviewDrawer.tsx` (line 230)
- **Type:** Button
- **Expected Behavior:** Send prompt to API, show response
- **Current Behavior:** ⚠️ Partial - calls API but no loading/error UI states
- **Backend Dependency:** `/api/ai` route
- **Test Coverage:** None

---

### MaosIntro Component

#### 59. "Enter MAOS" Button
- **Location:** `components/MaosIntro.tsx` (line 317)
- **Type:** Button
- **Expected Behavior:** Complete intro, navigate to home
- **Current Behavior:** ✅ Working - calls `onComplete()`, navigates
- **Backend Dependency:** None
- **Test Coverage:** Unit test exists (`__tests__/components/MaosIntro.test.tsx`)

#### 60. "Skip intro" Button
- **Location:** `components/MaosIntro.tsx` (line 332)
- **Type:** Button
- **Expected Behavior:** Skip intro, navigate to home
- **Current Behavior:** ✅ Working - calls `handleEnter()`
- **Backend Dependency:** None
- **Test Coverage:** Unit test exists

#### 61. Close (X) Button
- **Location:** `components/MaosIntro.tsx` (line 161)
- **Type:** Button
- **Expected Behavior:** Close intro, navigate to home
- **Current Behavior:** ✅ Working - calls `handleEnter()`
- **Backend Dependency:** None
- **Test Coverage:** Unit test exists

---

## B) Critical Workflows

### 1. Leadership View: Capacity/Workload/Outcomes Summary
**Workflow:** User navigates to `/home` → sees executive dashboard with:
- Capacity utilization gauge
- Work allocation (revenue/admin/support)
- People status
- Risk status
- Team breakdowns
- Risk alerts

**Status:** ✅ **Working** - All metrics computed from mock data, displayed correctly
**Test Coverage:** None (needs e2e test)

**Files:**
- `app/home/page.tsx` - Main dashboard
- `lib/executive-metrics.ts` - Metric computation
- `lib/sales-mock-data.ts` - Data source

---

### 2. Revenue vs Admin Separation
**Workflow:** User can see, filter, or segment work as revenue-producing vs admin drag:
- Home page shows work distribution bar (revenue/admin/support %)
- Company Tasks page has "Revenue Impact" filter
- Map page has Revenue/Drag overlay toggle
- Team cards show revenue/admin percentages

**Status:** ✅ **Working** - All views show revenue/admin separation
**Test Coverage:** None (needs e2e test for filter changes)

**Files:**
- `app/home/page.tsx` - Work distribution bar
- `app/company-tasks/page.tsx` - Revenue filter
- `app/map/page.tsx` - Revenue overlay
- `components/RevenueDragOverlay.tsx` - Overlay component

---

### 3. Agent + Human Visibility
**Workflow:** User can view combined view where humans/agents are both present:
- Agents page shows agent topology
- Map page can show agents overlay
- Personnel page shows human operators
- Home page shows both people count and agent fleet status

**Status:** ✅ **Working** - All views show humans and agents
**Test Coverage:** None (needs e2e test)

**Files:**
- `app/agents/page.tsx` - Agent topology
- `app/map/page.tsx` - Combined view with overlay
- `app/personnel/page.tsx` - Human directory
- `app/home/page.tsx` - Combined metrics

---

## Summary Statistics

- **Total Interactive Elements:** 61
- **Working:** 58 (95%)
- **Partially Working:** 2 (3%)
- **Broken:** 1 (2%)
- **With Test Coverage:** 3 (5%)
- **Needs Test Coverage:** 58 (95%)

### Issues Found

1. **Risk Alert Action Buttons** (Home page) - Disabled, no handler
2. **AI Preview "Run" Button** - Missing loading/error UI states
3. **Task Details "Run Agent"** - Shows alert instead of opening AI drawer
4. **No audit logging** - No tracking of user actions
5. **No loading states** - Most async operations lack loading indicators
6. **No error handling** - API calls don't show error messages to users
7. **Limited test coverage** - Only 3 elements have tests

---

## Next Steps

1. Implement action helper pattern for consistent async handling
2. Add audit logging for all user actions
3. Wire up missing handlers (risk alerts, run agent)
4. Add loading/error states to all async operations
5. Create comprehensive test suite
6. Update copy to match MAOS elevator pitch
