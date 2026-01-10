/**
 * Centralized Mock Data Module for MAOS
 *
 * This module provides comprehensive mock data for:
 * - Agent Architecture (Departments → Modules → Agents → Dependencies)
 * - Person Details enhancements (Today's Plan, Task Lists, Linked Modules)
 * - Role-based access control helpers
 */

import type { OrgPerson, FlowHealth } from "./maos-types";
import { defaultOrgData } from "./org-map-data";

// ============================================================================
// AGENT ARCHITECTURE TYPES
// ============================================================================

export type AgentStatus = "healthy" | "warning" | "critical" | "offline";
export type AgentCriticality = "low" | "medium" | "high" | "critical";

export interface AgentDepartment {
  id: string;
  name: string;
  color: string;
  description: string;
  moduleCount: number;
  agentCount: number;
  healthScore: number; // 0-100
  flowHealth: FlowHealth;
}

export interface AgentModule {
  id: string;
  name: string;
  departmentId: string;
  description: string;
  status: AgentStatus;
  criticality: AgentCriticality;
  agentCount: number;
  healthScore: number;
  lastRunAt: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[]; // other module IDs
}

export interface AgentNode {
  id: string;
  name: string;
  moduleId: string;
  departmentId: string;
  description: string;
  status: AgentStatus;
  criticality: AgentCriticality;
  healthScore: number;
  lastRunAt: string;
  avgLatencyMs: number;
  successRate: number; // 0-100
  runsToday: number;
  runsWeek: number;
  inputs: string[];
  outputs: string[];
  dependencies: string[]; // other agent IDs
}

export interface AgentDependency {
  id: string;
  fromId: string; // module or agent ID
  toId: string; // module or agent ID
  type: "data-flow" | "triggers" | "depends-on";
  weight: number; // 0-1 for visual weight
  label?: string;
}

// ============================================================================
// PERSON DETAILS ENHANCEMENT TYPES
// ============================================================================

export type TaskStatus = "todo" | "doing" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface WorkTask {
  id: string;
  personId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  moduleId?: string; // linked module
  createdAt: string;
  updatedAt: string;
}

export interface TodaysPlan {
  personId: string;
  date: string;
  topOutcomes: string[]; // max 3
  timeBlocks?: {
    time: string;
    activity: string;
  }[];
}

export interface LinkedModule {
  moduleId: string;
  moduleName: string;
  role: string; // e.g., "Owner", "Contributor", "Reviewer"
}

export interface PersonDetails {
  personId: string;
  tasks: WorkTask[];
  todaysPlan: TodaysPlan;
  linkedModules: LinkedModule[];
  managerId?: string; // direct manager
}

// ============================================================================
// MOCK DATA - AGENT ARCHITECTURE
// ============================================================================

export const mockAgentDepartments: AgentDepartment[] = [
  {
    id: "dept-revenue",
    name: "Revenue Operations",
    color: "#3b82f6",
    description: "Sales pipeline, lead routing, and revenue recognition automation",
    moduleCount: 4,
    agentCount: 14,
    healthScore: 87,
    flowHealth: "green",
  },
  {
    id: "dept-finance",
    name: "Finance & Accounting",
    color: "#10b981",
    description: "Financial close, AR/AP automation, and reporting systems",
    moduleCount: 3,
    agentCount: 10,
    healthScore: 92,
    flowHealth: "green",
  },
  {
    id: "dept-operations",
    name: "Operations & Logistics",
    color: "#f59e0b",
    description: "Supply chain, scheduling, and operational workflow automation",
    moduleCount: 5,
    agentCount: 17,
    healthScore: 78,
    flowHealth: "amber",
  },
  {
    id: "dept-people",
    name: "People & Culture",
    color: "#ec4899",
    description: "Recruiting, onboarding, and employee lifecycle management",
    moduleCount: 3,
    agentCount: 8,
    healthScore: 85,
    flowHealth: "green",
  },
  {
    id: "dept-platform",
    name: "Platform & Infrastructure",
    color: "#06b6d4",
    description: "Data pipelines, integrations, and system health monitoring",
    moduleCount: 4,
    agentCount: 12,
    healthScore: 94,
    flowHealth: "green",
  },
];

export const mockAgentModules: AgentModule[] = [
  // Revenue Operations
  {
    id: "mod-lead-routing",
    name: "Lead Routing Engine",
    departmentId: "dept-revenue",
    description: "Intelligent lead distribution based on territory, capacity, and expertise",
    status: "healthy",
    criticality: "critical",
    agentCount: 3,
    healthScore: 91,
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    inputs: ["CRM Webhooks", "Lead Scoring API", "Rep Availability"],
    outputs: ["Lead Assignments", "Routing Logs", "Distribution Metrics"],
    dependencies: ["mod-rep-capacity"],
  },
  {
    id: "mod-pipeline-analytics",
    name: "Pipeline Analytics",
    departmentId: "dept-revenue",
    description: "Real-time sales pipeline health monitoring and forecasting",
    status: "healthy",
    criticality: "high",
    agentCount: 4,
    healthScore: 88,
    lastRunAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    inputs: ["CRM Data", "Deal Updates", "Activity Logs"],
    outputs: ["Pipeline Reports", "Forecast Data", "Health Alerts"],
    dependencies: [],
  },
  {
    id: "mod-rep-capacity",
    name: "Rep Capacity Manager",
    departmentId: "dept-revenue",
    description: "Tracks sales rep workload and availability for optimal assignment",
    status: "healthy",
    criticality: "medium",
    agentCount: 2,
    healthScore: 85,
    lastRunAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    inputs: ["Rep Schedules", "Active Deals", "Meeting Calendar"],
    outputs: ["Capacity Scores", "Availability Windows"],
    dependencies: [],
  },
  {
    id: "mod-revenue-recognition",
    name: "Revenue Recognition",
    departmentId: "dept-revenue",
    description: "Automated revenue recognition and compliance tracking",
    status: "healthy",
    criticality: "critical",
    agentCount: 5,
    healthScore: 93,
    lastRunAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    inputs: ["Closed Deals", "Contract Terms", "Payment Events"],
    outputs: ["Revenue Journal Entries", "Compliance Reports"],
    dependencies: ["mod-ledger-close"],
  },

  // Finance & Accounting
  {
    id: "mod-ledger-close",
    name: "Ledger Close Automation",
    departmentId: "dept-finance",
    description: "Month-end close automation with reconciliation and variance detection",
    status: "healthy",
    criticality: "critical",
    agentCount: 4,
    healthScore: 95,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    inputs: ["GL Transactions", "Bank Statements", "Reconciliation Rules"],
    outputs: ["Close Reports", "Variance Alerts", "Journal Entries"],
    dependencies: [],
  },
  {
    id: "mod-ar-collections",
    name: "AR Collections Engine",
    departmentId: "dept-finance",
    description: "Automated invoice follow-up and payment reminder orchestration",
    status: "warning",
    criticality: "high",
    agentCount: 3,
    healthScore: 76,
    lastRunAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    inputs: ["Invoice Data", "Payment Status", "Customer Preferences"],
    outputs: ["Reminder Emails", "Collection Tasks", "Aging Reports"],
    dependencies: [],
  },
  {
    id: "mod-ap-automation",
    name: "AP Processing",
    departmentId: "dept-finance",
    description: "Invoice processing, approval routing, and payment scheduling",
    status: "healthy",
    criticality: "medium",
    agentCount: 3,
    healthScore: 89,
    lastRunAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    inputs: ["Vendor Invoices", "Purchase Orders", "Approval Rules"],
    outputs: ["Payment Batches", "Approval Requests", "Audit Logs"],
    dependencies: [],
  },

  // Operations & Logistics
  {
    id: "mod-scheduling",
    name: "Intelligent Scheduler",
    departmentId: "dept-operations",
    description: "Resource scheduling optimization for field operations",
    status: "healthy",
    criticality: "high",
    agentCount: 4,
    healthScore: 82,
    lastRunAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    inputs: ["Service Requests", "Technician Availability", "Location Data"],
    outputs: ["Optimized Schedules", "Route Plans", "Resource Assignments"],
    dependencies: ["mod-resource-tracking"],
  },
  {
    id: "mod-resource-tracking",
    name: "Resource Tracker",
    departmentId: "dept-operations",
    description: "Real-time tracking of equipment, inventory, and personnel",
    status: "healthy",
    criticality: "medium",
    agentCount: 3,
    healthScore: 80,
    lastRunAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    inputs: ["GPS Data", "Inventory Updates", "Check-in Events"],
    outputs: ["Location Data", "Utilization Reports", "Availability Status"],
    dependencies: [],
  },
  {
    id: "mod-supply-chain",
    name: "Supply Chain Monitor",
    departmentId: "dept-operations",
    description: "Supply chain visibility and exception management",
    status: "warning",
    criticality: "high",
    agentCount: 5,
    healthScore: 71,
    lastRunAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    inputs: ["Supplier Data", "Shipment Tracking", "Demand Forecast"],
    outputs: ["Delay Alerts", "Reorder Triggers", "Supply Reports"],
    dependencies: [],
  },
  {
    id: "mod-quality-assurance",
    name: "QA Automation",
    departmentId: "dept-operations",
    description: "Automated quality checks and compliance verification",
    status: "healthy",
    criticality: "medium",
    agentCount: 3,
    healthScore: 86,
    lastRunAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    inputs: ["Process Logs", "Quality Metrics", "Inspection Data"],
    outputs: ["QA Reports", "Defect Alerts", "Compliance Status"],
    dependencies: [],
  },
  {
    id: "mod-maintenance",
    name: "Preventive Maintenance",
    departmentId: "dept-operations",
    description: "Equipment maintenance scheduling and failure prediction",
    status: "healthy",
    criticality: "medium",
    agentCount: 2,
    healthScore: 79,
    lastRunAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    inputs: ["Equipment Telemetry", "Maintenance History", "Usage Patterns"],
    outputs: ["Maintenance Schedules", "Failure Predictions", "Work Orders"],
    dependencies: ["mod-scheduling"],
  },

  // People & Culture
  {
    id: "mod-recruiting",
    name: "Recruiting Pipeline",
    departmentId: "dept-people",
    description: "Candidate sourcing, screening, and interview coordination",
    status: "healthy",
    criticality: "medium",
    agentCount: 3,
    healthScore: 84,
    lastRunAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    inputs: ["Job Applications", "Resume Data", "Hiring Manager Feedback"],
    outputs: ["Candidate Rankings", "Interview Schedules", "Offer Letters"],
    dependencies: [],
  },
  {
    id: "mod-onboarding",
    name: "Onboarding Orchestration",
    departmentId: "dept-people",
    description: "New hire onboarding workflow and compliance tracking",
    status: "healthy",
    criticality: "high",
    agentCount: 3,
    healthScore: 88,
    lastRunAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    inputs: ["New Hire Data", "Department Requirements", "Training Modules"],
    outputs: ["Onboarding Tasks", "Compliance Checks", "Welcome Kits"],
    dependencies: [],
  },
  {
    id: "mod-employee-lifecycle",
    name: "Employee Lifecycle",
    departmentId: "dept-people",
    description: "Performance reviews, development plans, and retention analytics",
    status: "healthy",
    criticality: "medium",
    agentCount: 2,
    healthScore: 82,
    lastRunAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    inputs: ["Performance Data", "Engagement Surveys", "Career Goals"],
    outputs: ["Review Reminders", "Development Plans", "Retention Insights"],
    dependencies: [],
  },

  // Platform & Infrastructure
  {
    id: "mod-data-pipeline",
    name: "Data Pipeline Manager",
    departmentId: "dept-platform",
    description: "ETL orchestration and data quality monitoring",
    status: "healthy",
    criticality: "critical",
    agentCount: 4,
    healthScore: 96,
    lastRunAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    inputs: ["Source Systems", "Data Schemas", "Transformation Rules"],
    outputs: ["Clean Data", "Quality Reports", "Pipeline Metrics"],
    dependencies: [],
  },
  {
    id: "mod-integration-hub",
    name: "Integration Hub",
    departmentId: "dept-platform",
    description: "API gateway and third-party integration management",
    status: "healthy",
    criticality: "critical",
    agentCount: 3,
    healthScore: 92,
    lastRunAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    inputs: ["API Requests", "Authentication Tokens", "Rate Limits"],
    outputs: ["API Responses", "Integration Logs", "Error Alerts"],
    dependencies: [],
  },
  {
    id: "mod-system-health",
    name: "System Health Monitor",
    departmentId: "dept-platform",
    description: "Infrastructure monitoring, alerting, and auto-remediation",
    status: "healthy",
    criticality: "critical",
    agentCount: 3,
    healthScore: 94,
    lastRunAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    inputs: ["System Metrics", "Application Logs", "Performance Data"],
    outputs: ["Health Dashboards", "Alert Notifications", "Remediation Actions"],
    dependencies: [],
  },
  {
    id: "mod-security-compliance",
    name: "Security & Compliance",
    departmentId: "dept-platform",
    description: "Security scanning, compliance auditing, and threat detection",
    status: "healthy",
    criticality: "critical",
    agentCount: 2,
    healthScore: 97,
    lastRunAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    inputs: ["Access Logs", "Security Events", "Compliance Rules"],
    outputs: ["Security Reports", "Compliance Status", "Threat Alerts"],
    dependencies: [],
  },
];

export const mockAgentNodes: AgentNode[] = [
  // Lead Routing Engine agents
  {
    id: "agent-territory-matcher",
    name: "Territory Matcher",
    moduleId: "mod-lead-routing",
    departmentId: "dept-revenue",
    description: "Matches incoming leads to appropriate sales territories",
    status: "healthy",
    criticality: "critical",
    healthScore: 92,
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    avgLatencyMs: 45,
    successRate: 98.5,
    runsToday: 247,
    runsWeek: 1543,
    inputs: ["Lead Location", "Territory Rules"],
    outputs: ["Territory Assignment"],
    dependencies: [],
  },
  {
    id: "agent-capacity-scorer",
    name: "Capacity Scorer",
    moduleId: "mod-lead-routing",
    departmentId: "dept-revenue",
    description: "Scores rep availability for lead assignment",
    status: "healthy",
    criticality: "critical",
    healthScore: 89,
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    avgLatencyMs: 32,
    successRate: 97.2,
    runsToday: 247,
    runsWeek: 1543,
    inputs: ["Rep Capacity"],
    outputs: ["Capacity Score"],
    dependencies: ["agent-rep-availability"],
  },
  {
    id: "agent-lead-assigner",
    name: "Lead Assigner",
    moduleId: "mod-lead-routing",
    departmentId: "dept-revenue",
    description: "Final lead assignment and CRM update",
    status: "healthy",
    criticality: "critical",
    healthScore: 94,
    lastRunAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    avgLatencyMs: 78,
    successRate: 99.1,
    runsToday: 247,
    runsWeek: 1543,
    inputs: ["Territory Assignment", "Capacity Score"],
    outputs: ["CRM Update", "Assignment Notification"],
    dependencies: ["agent-territory-matcher", "agent-capacity-scorer"],
  },

  // Rep Capacity Manager agents
  {
    id: "agent-rep-availability",
    name: "Rep Availability Tracker",
    moduleId: "mod-rep-capacity",
    departmentId: "dept-revenue",
    description: "Monitors real-time rep availability",
    status: "healthy",
    criticality: "medium",
    healthScore: 87,
    lastRunAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    avgLatencyMs: 23,
    successRate: 96.8,
    runsToday: 180,
    runsWeek: 1120,
    inputs: ["Calendar Events", "Active Deals"],
    outputs: ["Availability Status"],
    dependencies: [],
  },
  {
    id: "agent-workload-analyzer",
    name: "Workload Analyzer",
    moduleId: "mod-rep-capacity",
    departmentId: "dept-revenue",
    description: "Analyzes rep workload distribution",
    status: "healthy",
    criticality: "medium",
    healthScore: 83,
    lastRunAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    avgLatencyMs: 56,
    successRate: 95.3,
    runsToday: 90,
    runsWeek: 630,
    inputs: ["Deal Count", "Activity Logs"],
    outputs: ["Workload Metrics"],
    dependencies: [],
  },

  // Ledger Close agents
  {
    id: "agent-reconciliation",
    name: "Reconciliation Engine",
    moduleId: "mod-ledger-close",
    departmentId: "dept-finance",
    description: "Automated bank reconciliation",
    status: "healthy",
    criticality: "critical",
    healthScore: 96,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    avgLatencyMs: 1240,
    successRate: 99.4,
    runsToday: 12,
    runsWeek: 84,
    inputs: ["Bank Statements", "GL Transactions"],
    outputs: ["Reconciliation Report"],
    dependencies: [],
  },
  {
    id: "agent-variance-detector",
    name: "Variance Detector",
    moduleId: "mod-ledger-close",
    departmentId: "dept-finance",
    description: "Identifies and flags financial variances",
    status: "healthy",
    criticality: "critical",
    healthScore: 94,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    avgLatencyMs: 890,
    successRate: 98.7,
    runsToday: 12,
    runsWeek: 84,
    inputs: ["Reconciliation Report"],
    outputs: ["Variance Alerts"],
    dependencies: ["agent-reconciliation"],
  },
  {
    id: "agent-journal-generator",
    name: "Journal Entry Generator",
    moduleId: "mod-ledger-close",
    departmentId: "dept-finance",
    description: "Creates automated journal entries",
    status: "healthy",
    criticality: "high",
    healthScore: 97,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    avgLatencyMs: 234,
    successRate: 99.8,
    runsToday: 45,
    runsWeek: 315,
    inputs: ["Transaction Data"],
    outputs: ["Journal Entries"],
    dependencies: [],
  },
  {
    id: "agent-close-validator",
    name: "Close Validator",
    moduleId: "mod-ledger-close",
    departmentId: "dept-finance",
    description: "Validates month-end close completeness",
    status: "healthy",
    criticality: "critical",
    healthScore: 93,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    avgLatencyMs: 567,
    successRate: 99.2,
    runsToday: 8,
    runsWeek: 56,
    inputs: ["Close Checklist", "Journal Entries"],
    outputs: ["Close Report"],
    dependencies: ["agent-journal-generator", "agent-variance-detector"],
  },

  // AR Collections agents
  {
    id: "agent-aging-analyzer",
    name: "Aging Analyzer",
    moduleId: "mod-ar-collections",
    departmentId: "dept-finance",
    description: "Analyzes invoice aging patterns",
    status: "warning",
    criticality: "high",
    healthScore: 78,
    lastRunAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    avgLatencyMs: 123,
    successRate: 92.1,
    runsToday: 156,
    runsWeek: 1092,
    inputs: ["Invoice Data", "Payment History"],
    outputs: ["Aging Report"],
    dependencies: [],
  },
  {
    id: "agent-reminder-scheduler",
    name: "Reminder Scheduler",
    moduleId: "mod-ar-collections",
    departmentId: "dept-finance",
    description: "Schedules payment reminder communications",
    status: "healthy",
    criticality: "high",
    healthScore: 85,
    lastRunAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    avgLatencyMs: 67,
    successRate: 94.6,
    runsToday: 203,
    runsWeek: 1421,
    inputs: ["Aging Report", "Customer Preferences"],
    outputs: ["Reminder Queue"],
    dependencies: ["agent-aging-analyzer"],
  },
  {
    id: "agent-collection-prioritizer",
    name: "Collection Prioritizer",
    moduleId: "mod-ar-collections",
    departmentId: "dept-finance",
    description: "Prioritizes collection efforts by risk",
    status: "warning",
    criticality: "medium",
    healthScore: 65,
    lastRunAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    avgLatencyMs: 189,
    successRate: 88.3,
    runsToday: 98,
    runsWeek: 686,
    inputs: ["Aging Report", "Payment Patterns"],
    outputs: ["Priority Queue"],
    dependencies: ["agent-aging-analyzer"],
  },

  // Scheduling agents
  {
    id: "agent-route-optimizer",
    name: "Route Optimizer",
    moduleId: "mod-scheduling",
    departmentId: "dept-operations",
    description: "Optimizes technician routes",
    status: "healthy",
    criticality: "high",
    healthScore: 84,
    lastRunAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    avgLatencyMs: 456,
    successRate: 96.1,
    runsToday: 67,
    runsWeek: 469,
    inputs: ["Service Locations", "Technician Locations"],
    outputs: ["Optimal Routes"],
    dependencies: [],
  },
  {
    id: "agent-availability-checker",
    name: "Availability Checker",
    moduleId: "mod-scheduling",
    departmentId: "dept-operations",
    description: "Checks resource availability",
    status: "healthy",
    criticality: "medium",
    healthScore: 81,
    lastRunAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    avgLatencyMs: 78,
    successRate: 97.3,
    runsToday: 234,
    runsWeek: 1638,
    inputs: ["Resource Calendar"],
    outputs: ["Availability Windows"],
    dependencies: [],
  },
  {
    id: "agent-schedule-publisher",
    name: "Schedule Publisher",
    moduleId: "mod-scheduling",
    departmentId: "dept-operations",
    description: "Publishes finalized schedules",
    status: "healthy",
    criticality: "high",
    healthScore: 86,
    lastRunAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    avgLatencyMs: 123,
    successRate: 98.7,
    runsToday: 67,
    runsWeek: 469,
    inputs: ["Optimal Routes", "Availability Windows"],
    outputs: ["Published Schedules", "Notifications"],
    dependencies: ["agent-route-optimizer", "agent-availability-checker"],
  },
  {
    id: "agent-conflict-resolver",
    name: "Conflict Resolver",
    moduleId: "mod-scheduling",
    departmentId: "dept-operations",
    description: "Resolves scheduling conflicts",
    status: "healthy",
    criticality: "medium",
    healthScore: 79,
    lastRunAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    avgLatencyMs: 234,
    successRate: 93.4,
    runsToday: 23,
    runsWeek: 161,
    inputs: ["Schedule Conflicts"],
    outputs: ["Resolution Suggestions"],
    dependencies: [],
  },

  // Data Pipeline agents
  {
    id: "agent-etl-orchestrator",
    name: "ETL Orchestrator",
    moduleId: "mod-data-pipeline",
    departmentId: "dept-platform",
    description: "Orchestrates data extraction and transformation",
    status: "healthy",
    criticality: "critical",
    healthScore: 97,
    lastRunAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    avgLatencyMs: 3456,
    successRate: 99.6,
    runsToday: 48,
    runsWeek: 336,
    inputs: ["Source Connections", "ETL Jobs"],
    outputs: ["Transformed Data"],
    dependencies: [],
  },
  {
    id: "agent-data-validator",
    name: "Data Validator",
    moduleId: "mod-data-pipeline",
    departmentId: "dept-platform",
    description: "Validates data quality and completeness",
    status: "healthy",
    criticality: "critical",
    healthScore: 96,
    lastRunAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    avgLatencyMs: 890,
    successRate: 99.1,
    runsToday: 48,
    runsWeek: 336,
    inputs: ["Transformed Data"],
    outputs: ["Validation Report"],
    dependencies: ["agent-etl-orchestrator"],
  },
  {
    id: "agent-schema-enforcer",
    name: "Schema Enforcer",
    moduleId: "mod-data-pipeline",
    departmentId: "dept-platform",
    description: "Enforces data schema compliance",
    status: "healthy",
    criticality: "high",
    healthScore: 94,
    lastRunAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    avgLatencyMs: 234,
    successRate: 98.8,
    runsToday: 48,
    runsWeek: 336,
    inputs: ["Data Schemas", "Incoming Data"],
    outputs: ["Schema Compliance Report"],
    dependencies: [],
  },
  {
    id: "agent-quality-monitor",
    name: "Quality Monitor",
    moduleId: "mod-data-pipeline",
    departmentId: "dept-platform",
    description: "Monitors ongoing data quality metrics",
    status: "healthy",
    criticality: "medium",
    healthScore: 95,
    lastRunAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    avgLatencyMs: 567,
    successRate: 99.3,
    runsToday: 144,
    runsWeek: 1008,
    inputs: ["Validation Report"],
    outputs: ["Quality Dashboard"],
    dependencies: ["agent-data-validator"],
  },
];

// Generate dependencies between modules and agents
export const mockAgentDependencies: AgentDependency[] = [
  // Module-level dependencies
  {
    id: "dep-mod-routing-to-capacity",
    fromId: "mod-lead-routing",
    toId: "mod-rep-capacity",
    type: "depends-on",
    weight: 0.8,
    label: "capacity data",
  },
  {
    id: "dep-mod-revenue-to-ledger",
    fromId: "mod-revenue-recognition",
    toId: "mod-ledger-close",
    type: "data-flow",
    weight: 0.9,
    label: "revenue entries",
  },
  {
    id: "dep-mod-scheduling-to-resources",
    fromId: "mod-scheduling",
    toId: "mod-resource-tracking",
    type: "depends-on",
    weight: 0.7,
    label: "resource availability",
  },
  {
    id: "dep-mod-maintenance-to-scheduling",
    fromId: "mod-maintenance",
    toId: "mod-scheduling",
    type: "triggers",
    weight: 0.6,
    label: "work orders",
  },

  // Agent-level dependencies (within Lead Routing)
  {
    id: "dep-territory-to-assigner",
    fromId: "agent-territory-matcher",
    toId: "agent-lead-assigner",
    type: "data-flow",
    weight: 0.9,
  },
  {
    id: "dep-capacity-to-assigner",
    fromId: "agent-capacity-scorer",
    toId: "agent-lead-assigner",
    type: "data-flow",
    weight: 0.85,
  },
  {
    id: "dep-availability-to-capacity",
    fromId: "agent-rep-availability",
    toId: "agent-capacity-scorer",
    type: "depends-on",
    weight: 0.75,
  },

  // Agent-level dependencies (within Ledger Close)
  {
    id: "dep-recon-to-variance",
    fromId: "agent-reconciliation",
    toId: "agent-variance-detector",
    type: "data-flow",
    weight: 0.95,
  },
  {
    id: "dep-variance-to-close",
    fromId: "agent-variance-detector",
    toId: "agent-close-validator",
    type: "data-flow",
    weight: 0.85,
  },
  {
    id: "dep-journal-to-close",
    fromId: "agent-journal-generator",
    toId: "agent-close-validator",
    type: "data-flow",
    weight: 0.9,
  },

  // Agent-level dependencies (within AR Collections)
  {
    id: "dep-aging-to-reminder",
    fromId: "agent-aging-analyzer",
    toId: "agent-reminder-scheduler",
    type: "data-flow",
    weight: 0.8,
  },
  {
    id: "dep-aging-to-priority",
    fromId: "agent-aging-analyzer",
    toId: "agent-collection-prioritizer",
    type: "data-flow",
    weight: 0.75,
  },

  // Agent-level dependencies (within Scheduling)
  {
    id: "dep-route-to-publisher",
    fromId: "agent-route-optimizer",
    toId: "agent-schedule-publisher",
    type: "data-flow",
    weight: 0.85,
  },
  {
    id: "dep-availability-to-publisher",
    fromId: "agent-availability-checker",
    toId: "agent-schedule-publisher",
    type: "data-flow",
    weight: 0.8,
  },

  // Agent-level dependencies (within Data Pipeline)
  {
    id: "dep-etl-to-validator",
    fromId: "agent-etl-orchestrator",
    toId: "agent-data-validator",
    type: "data-flow",
    weight: 0.95,
  },
  {
    id: "dep-validator-to-monitor",
    fromId: "agent-data-validator",
    toId: "agent-quality-monitor",
    type: "data-flow",
    weight: 0.85,
  },
];

// ============================================================================
// MOCK DATA - PERSON DETAILS ENHANCEMENTS
// ============================================================================

// Get people from existing org data
const people = defaultOrgData.people;

// Create manager relationships (simplified - department-based hierarchy)
const managerMap = new Map<string, string>();
people.forEach((person) => {
  if (person.role.includes("Manager") || person.role.includes("Director") || person.role.includes("VP")) {
    // This person is a manager
    const subordinates = people.filter(
      (p) => p.departmentId === person.departmentId && p.id !== person.id && !p.role.includes("Manager")
    );
    subordinates.forEach((sub) => {
      if (!managerMap.has(sub.id)) {
        managerMap.set(sub.id, person.id);
      }
    });
  }
});

// Generate mock tasks for people
export const mockWorkTasks: WorkTask[] = [];

people.slice(0, 30).forEach((person, idx) => {
  const taskCount = Math.floor(Math.random() * 8) + 3; // 3-10 tasks per person

  for (let i = 0; i < taskCount; i++) {
    const statuses: TaskStatus[] = ["todo", "doing", "blocked", "done"];
    const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const taskTemplates = [
      { title: "Review quarterly budget allocation", moduleId: "mod-ledger-close" },
      { title: "Update sales forecast for Q2", moduleId: "mod-pipeline-analytics" },
      { title: "Conduct 1:1s with team members", moduleId: undefined },
      { title: "Analyze AR aging report and flag issues", moduleId: "mod-ar-collections" },
      { title: "Optimize lead routing rules", moduleId: "mod-lead-routing" },
      { title: "Review candidate pipeline", moduleId: "mod-recruiting" },
      { title: "Update onboarding checklist", moduleId: "mod-onboarding" },
      { title: "Monitor data pipeline health", moduleId: "mod-data-pipeline" },
      { title: "Approve pending invoices", moduleId: "mod-ap-automation" },
      { title: "Review scheduling conflicts", moduleId: "mod-scheduling" },
      { title: "Prepare month-end close report", moduleId: "mod-ledger-close" },
      { title: "Investigate supply chain delays", moduleId: "mod-supply-chain" },
    ];

    const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];

    const daysOffset = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
    const dueDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);

    mockWorkTasks.push({
      id: `task-${person.id}-${i}`,
      personId: person.id,
      title: template.title,
      description: status === "blocked" ? "Waiting for external dependency" : undefined,
      status,
      priority,
      dueDate: Math.random() > 0.3 ? dueDate.toISOString().split("T")[0] : undefined,
      moduleId: template.moduleId,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
});

// Generate Today's Plans for people
export const mockTodaysPlans: TodaysPlan[] = people.slice(0, 30).map((person) => {
  const outcomeTemplates = [
    "Close 3 high-priority deals",
    "Complete month-end reconciliation",
    "Finalize Q2 hiring plan",
    "Review and approve pending invoices",
    "Optimize agent performance metrics",
    "Resolve critical pipeline issues",
    "Ship product feature update",
    "Complete customer onboarding",
    "Reduce AR aging by 15%",
    "Launch new marketing campaign",
  ];

  const topOutcomes = [
    outcomeTemplates[Math.floor(Math.random() * outcomeTemplates.length)],
    outcomeTemplates[Math.floor(Math.random() * outcomeTemplates.length)],
    outcomeTemplates[Math.floor(Math.random() * outcomeTemplates.length)],
  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  const timeBlocks = Math.random() > 0.5 ? [
    { time: "9:00 AM", activity: "Team standup" },
    { time: "10:00 AM", activity: "Deep work - priority tasks" },
    { time: "1:00 PM", activity: "Client meetings" },
    { time: "3:00 PM", activity: "Review metrics & planning" },
  ] : undefined;

  return {
    personId: person.id,
    date: new Date().toISOString().split("T")[0],
    topOutcomes,
    timeBlocks,
  };
});

// Generate linked modules for people
export const mockLinkedModules: Map<string, LinkedModule[]> = new Map();

people.slice(0, 30).forEach((person) => {
  // Get modules from person's tasks
  const personTasks = mockWorkTasks.filter((t) => t.personId === person.id);
  const moduleIds = [...new Set(personTasks.filter((t) => t.moduleId).map((t) => t.moduleId!))];

  const linkedModules: LinkedModule[] = moduleIds.map((moduleId) => {
    const modData = mockAgentModules.find((m) => m.id === moduleId);
    const roles = ["Owner", "Contributor", "Reviewer"];
    return {
      moduleId,
      moduleName: modData?.name || "Unknown Module",
      role: roles[Math.floor(Math.random() * roles.length)],
    };
  });

  mockLinkedModules.set(person.id, linkedModules);
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all modules for a specific department
 */
export function getModulesByDepartment(departmentId: string): AgentModule[] {
  return mockAgentModules.filter((m) => m.departmentId === departmentId);
}

/**
 * Get all agents for a specific module
 */
export function getAgentsByModule(moduleId: string): AgentNode[] {
  return mockAgentNodes.filter((a) => a.moduleId === moduleId);
}

/**
 * Get all agents for a specific department
 */
export function getAgentsByDepartment(departmentId: string): AgentNode[] {
  return mockAgentNodes.filter((a) => a.departmentId === departmentId);
}

/**
 * Get dependencies for a specific module or agent
 */
export function getDependencies(nodeId: string): AgentDependency[] {
  return mockAgentDependencies.filter((d) => d.fromId === nodeId || d.toId === nodeId);
}

/**
 * Get the full org chain (manager hierarchy) for a person
 */
export function getOrgChain(personId: string): string[] {
  const chain: string[] = [personId];
  let currentId = personId;

  // Traverse up the manager chain (max 10 levels to prevent infinite loop)
  for (let i = 0; i < 10; i++) {
    const managerId = managerMap.get(currentId);
    if (!managerId || chain.includes(managerId)) break;
    chain.push(managerId);
    currentId = managerId;
  }

  return chain;
}

/**
 * Check if a viewer can see detailed tasks for a person
 * Rules:
 * - Can see own tasks
 * - Can see subordinates' tasks (direct or via manager chain)
 * - Otherwise can only see summary counts
 */
export function viewerCanSeeTasks(viewerId: string, personId: string): boolean {
  if (viewerId === personId) return true;

  // Check if viewer is in the person's manager chain
  const personChain = getOrgChain(personId);
  return personChain.includes(viewerId);
}

/**
 * Get all tasks for a person
 */
export function getTasksByPerson(personId: string): WorkTask[] {
  return mockWorkTasks.filter((t) => t.personId === personId);
}

/**
 * Get task summary counts for a person
 */
export function getTaskSummary(personId: string): Record<TaskStatus, number> {
  const tasks = getTasksByPerson(personId);
  return {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
}

/**
 * Get today's plan for a person
 */
export function getTodaysPlan(personId: string): TodaysPlan | undefined {
  return mockTodaysPlans.find((p) => p.personId === personId);
}

/**
 * Get linked modules for a person
 */
export function getLinkedModules(personId: string): LinkedModule[] {
  return mockLinkedModules.get(personId) || [];
}

/**
 * Get person details (convenience function)
 */
export function getPersonDetails(personId: string): PersonDetails {
  return {
    personId,
    tasks: getTasksByPerson(personId),
    todaysPlan: getTodaysPlan(personId) || {
      personId,
      date: new Date().toISOString().split("T")[0],
      topOutcomes: [],
    },
    linkedModules: getLinkedModules(personId),
    managerId: managerMap.get(personId),
  };
}

/**
 * Get all people who report to a manager (direct reports only)
 */
export function getDirectReports(managerId: string): OrgPerson[] {
  const reportIds = Array.from(managerMap.entries())
    .filter(([_, mgrId]) => mgrId === managerId)
    .map(([personId]) => personId);

  return people.filter((p) => reportIds.includes(p.id));
}

/**
 * Get subordinates who are actively working (has tasks in progress)
 */
export function getActiveSubordinates(managerId: string): OrgPerson[] {
  const allSubordinates: OrgPerson[] = [];
  const directReports = getDirectReports(managerId);

  // Add direct reports
  allSubordinates.push(...directReports);

  // Add their reports recursively (2 levels deep)
  directReports.forEach((report) => {
    const subReports = getDirectReports(report.id);
    allSubordinates.push(...subReports);
  });

  // Filter to only those with active tasks
  return allSubordinates.filter((person) => {
    const tasks = getTasksByPerson(person.id);
    return tasks.some((t) => t.status === "doing" || t.status === "todo");
  });
}

/**
 * Filter modules by search query, department, status, or criticality
 */
export function filterModules(options: {
  search?: string;
  departmentId?: string;
  status?: AgentStatus;
  criticality?: AgentCriticality;
}): AgentModule[] {
  let filtered = mockAgentModules;

  if (options.departmentId) {
    filtered = filtered.filter((m) => m.departmentId === options.departmentId);
  }

  if (options.status) {
    filtered = filtered.filter((m) => m.status === options.status);
  }

  if (options.criticality) {
    filtered = filtered.filter((m) => m.criticality === options.criticality);
  }

  if (options.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Filter agents by search query, department, module, status, or criticality
 */
export function filterAgents(options: {
  search?: string;
  departmentId?: string;
  moduleId?: string;
  status?: AgentStatus;
  criticality?: AgentCriticality;
}): AgentNode[] {
  let filtered = mockAgentNodes;

  if (options.departmentId) {
    filtered = filtered.filter((a) => a.departmentId === options.departmentId);
  }

  if (options.moduleId) {
    filtered = filtered.filter((a) => a.moduleId === options.moduleId);
  }

  if (options.status) {
    filtered = filtered.filter((a) => a.status === options.status);
  }

  if (options.criticality) {
    filtered = filtered.filter((a) => a.criticality === options.criticality);
  }

  if (options.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
    );
  }

  return filtered;
}
