# MAOS Mock Data Documentation

## Overview

The MAOS application uses a centralized mock data system to power the Agent Architecture visualization and Person Details enhancements. All mock data is defined in `/lib/mockData.ts`.

## Location

**Primary file:** `/lib/mockData.ts`

This module exports all mock data structures, types, and helper functions used throughout the application.

## Data Structure

### 1. Agent Architecture Data

The agent architecture represents a hierarchical system: **Departments → Modules → Agents → Dependencies**

#### Departments (5 total)
- Revenue Operations
- Finance & Accounting
- Operations & Logistics
- People & Culture
- Platform & Infrastructure

Each department contains:
- `id`, `name`, `color`, `description`
- `moduleCount`, `agentCount`
- `healthScore` (0-100)
- `flowHealth` ("green" | "amber" | "red")

#### Modules (19 total)
Modules are functional units within departments (e.g., "Lead Routing Engine", "Ledger Close Automation").

Each module contains:
- `id`, `name`, `departmentId`, `description`
- `status`: "healthy" | "warning" | "critical" | "offline"
- `criticality`: "low" | "medium" | "high" | "critical"
- `agentCount`, `healthScore`
- `lastRunAt` (ISO timestamp)
- `inputs`, `outputs` (array of strings)
- `dependencies` (array of module IDs)

#### Agents (27 total)
Agents are automated workers within modules (e.g., "Territory Matcher", "Reconciliation Engine").

Each agent contains:
- `id`, `name`, `moduleId`, `departmentId`, `description`
- `status`, `criticality`, `healthScore`
- `lastRunAt`, `avgLatencyMs`, `successRate`
- `runsToday`, `runsWeek`
- `inputs`, `outputs`
- `dependencies` (array of agent IDs)

#### Dependencies
Dependencies define relationships between modules and agents.

Each dependency contains:
- `id`, `fromId`, `toId`
- `type`: "data-flow" | "triggers" | "depends-on"
- `weight` (0-1 for visual strength)
- `label` (optional description)

### 2. Person Details Enhancement Data

#### Today's Plans (30 people)
Each plan contains:
- `personId`, `date`
- `topOutcomes` (array of 1-3 goals)
- `timeBlocks` (optional array of time/activity pairs)

#### Work Tasks (generated for 30 people, 3-10 tasks each)
Each task contains:
- `id`, `personId`, `title`, `description`
- `status`: "todo" | "doing" | "blocked" | "done"
- `priority`: "low" | "medium" | "high" | "critical"
- `dueDate` (optional ISO date string)
- `moduleId` (optional link to agent module)
- `createdAt`, `updatedAt`

#### Linked Modules
Modules associated with each person based on their tasks.

Each linked module contains:
- `moduleId`, `moduleName`
- `role`: "Owner" | "Contributor" | "Reviewer"

#### Manager Relationships
A simple hierarchy map connecting people to their managers based on department and role.

## Helper Functions

### Agent Architecture

```typescript
// Get modules filtered by department
getModulesByDepartment(departmentId: string): AgentModule[]

// Get agents filtered by module
getAgentsByModule(moduleId: string): AgentNode[]

// Get agents filtered by department
getAgentsByDepartment(departmentId: string): AgentNode[]

// Get dependencies for a node (module or agent)
getDependencies(nodeId: string): AgentDependency[]

// Advanced filtering
filterModules(options: {
  search?: string
  departmentId?: string
  status?: AgentStatus
  criticality?: AgentCriticality
}): AgentModule[]

filterAgents(options: {
  search?: string
  departmentId?: string
  moduleId?: string
  status?: AgentStatus
  criticality?: AgentCriticality
}): AgentNode[]
```

### Person Details

```typescript
// Get the organizational chain (manager hierarchy)
getOrgChain(personId: string): string[]

// Check if viewer can see detailed tasks
// Returns true if viewer is the person OR manages them
viewerCanSeeTasks(viewerId: string, personId: string): boolean

// Get all tasks for a person
getTasksByPerson(personId: string): WorkTask[]

// Get task summary counts by status
getTaskSummary(personId: string): Record<TaskStatus, number>

// Get today's plan for a person
getTodaysPlan(personId: string): TodaysPlan | undefined

// Get linked modules for a person
getLinkedModules(personId: string): LinkedModule[]

// Get complete person details (convenience function)
getPersonDetails(personId: string): PersonDetails

// Get direct reports for a manager
getDirectReports(managerId: string): OrgPerson[]

// Get subordinates with active tasks
getActiveSubordinates(managerId: string): OrgPerson[]
```

## How to Extend

### Adding New Departments

1. Add a new entry to `mockAgentDepartments`:
```typescript
{
  id: "dept-your-dept",
  name: "Your Department",
  color: "#hex-color",
  description: "Department description",
  moduleCount: 0, // Will be calculated
  agentCount: 0,  // Will be calculated
  healthScore: 85,
  flowHealth: "green"
}
```

### Adding New Modules

1. Add a new entry to `mockAgentModules`:
```typescript
{
  id: "mod-your-module",
  name: "Your Module",
  departmentId: "dept-existing-dept",
  description: "What this module does",
  status: "healthy",
  criticality: "medium",
  agentCount: 3,
  healthScore: 90,
  lastRunAt: new Date().toISOString(),
  inputs: ["Input 1", "Input 2"],
  outputs: ["Output 1"],
  dependencies: ["other-module-id"] // optional
}
```

2. Update the parent department's `moduleCount`

### Adding New Agents

1. Add a new entry to `mockAgentNodes`:
```typescript
{
  id: "agent-your-agent",
  name: "Your Agent",
  moduleId: "mod-existing-module",
  departmentId: "dept-existing-dept",
  description: "What this agent does",
  status: "healthy",
  criticality: "high",
  healthScore: 95,
  lastRunAt: new Date().toISOString(),
  avgLatencyMs: 120,
  successRate: 98.5,
  runsToday: 150,
  runsWeek: 1050,
  inputs: ["Agent input"],
  outputs: ["Agent output"],
  dependencies: ["other-agent-id"] // optional
}
```

2. Update the parent module's `agentCount`

### Adding Dependencies

1. Add a new entry to `mockAgentDependencies`:
```typescript
{
  id: "dep-unique-id",
  fromId: "source-module-or-agent-id",
  toId: "target-module-or-agent-id",
  type: "data-flow", // or "triggers" or "depends-on"
  weight: 0.8, // 0-1 for visual weight
  label: "Description of relationship" // optional
}
```

### Adding Tasks for People

Tasks are generated programmatically in `mockData.ts`. To add more tasks:

1. Add task templates to the `taskTemplates` array
2. Optionally link them to modules via `moduleId`
3. The generator will create tasks with random statuses and priorities

### Modifying Manager Relationships

Manager relationships are calculated based on role names in `mockData.ts`. To modify:

1. Update the logic in the manager map section
2. Or manually add entries to `managerMap.set(subordinateId, managerId)`

## Role-Based Access Control

The `viewerCanSeeTasks()` function implements simple RBAC:

**Rules:**
- Users can see their own tasks (full detail)
- Managers can see subordinate tasks (full detail)
- Others can only see summary counts

**To modify:**
Edit the `viewerCanSeeTasks()` function in `/lib/mockData.ts`

## Integration Points

### Agent Architecture Page
- **File:** `/app/map/agents/page.tsx`
- **Uses:** `mockAgentDepartments`, `mockAgentModules`, `mockAgentNodes`, `mockAgentDependencies`
- **Helpers:** `filterModules()`, `filterAgents()`, `getAgentsByModule()`, `getDependencies()`

### Agent Architecture Graph
- **File:** `/components/AgentArchitectureGraph.tsx`
- **Receives:** Filtered departments, modules, agents, and dependencies as props
- **Renders:** Interactive canvas-based visualization

### Person Details Drawer
- **File:** `/components/MapDetailsDrawer.tsx`
- **Uses:** `getTodaysPlan()`, `getTasksByPerson()`, `getTaskSummary()`, `getLinkedModules()`, `viewerCanSeeTasks()`
- **Shows:** Today's Plan, Task List, and Linked Modules sections

## Future Improvements

1. **Replace with API calls**: When backend is ready, swap mock data imports with API fetch calls
2. **Add WebSocket updates**: For real-time agent status and metrics
3. **Persistent storage**: Store user tasks and plans in a database
4. **More granular permissions**: Implement full RBAC with teams, projects, etc.
5. **Historical data**: Track agent performance over time
6. **Alerts and notifications**: Trigger alerts when agents fail or modules degrade

## Notes

- All data is deterministic and seeded for consistency
- Mock data includes realistic timestamps (relative to current time)
- Health scores and metrics are randomized within realistic ranges
- Module/agent dependencies form a realistic DAG (directed acyclic graph)
- People data integrates with existing org map data from `/lib/org-map-data.ts`
