// User & Auth Types
export type UserRole = "Admin" | "Manager" | "Operator" | "Viewer" | string;

export interface AssignedRole {
  key: string;
  name: string;
}

export interface User {
  username: string;
  role: UserRole;
  roles?: AssignedRole[];
  permissions?: string[];
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface AuthSession {
  token: string;
  user: User;
}

// Incident Types
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "RESOLVED" | "CLOSED";
export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IncidentAssignee {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignedTeam?: string | null;
  assignedTo?: IncidentAssignee | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  notes?: string | null;
}

export interface IncidentListResponse {
  items: Incident[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  priority: IncidentPriority;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateIncidentPayload {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  assignedTo?: string;
  notes?: string;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface DocumentListResponse {
  items: Document[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreateDocumentPayload {
  title: string;
  content: string;
}

export interface UpdateDocumentPayload {
  title?: string;
  content?: string;
}

// Asset Types
export interface Asset {
  id: string;
  name: string;
  type: "Server" | "Workstation" | "Network" | "Storage" | string;
  ipAddress?: string | null;
  location?: string | null;
  status: "Active" | "Inactive" | "Maintenance" | string;
  os?: string | null;
  cpu?: string | null;
  memory?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AssetListResponse {
  items: Asset[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreateAssetPayload {
  name: string;
  type: string;
  ipAddress?: string;
  location?: string;
  status: string;
  os?: string;
  cpu?: string;
  memory?: string;
  tags?: string[];
}

export interface UpdateAssetPayload {
  name?: string;
  type?: string;
  ipAddress?: string;
  location?: string;
  status?: string;
  os?: string;
  cpu?: string;
  memory?: string;
  tags?: string[];
}

// Problem Types
export type ProblemSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProblemStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Problem {
  id: string;
  title: string;
  description: string;
  severity: ProblemSeverity;
  status: ProblemStatus;
  solution?: string | null;
  affectedAssets?: string[];
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}

export interface ProblemListResponse {
  items: Problem[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface CreateProblemPayload {
  title: string;
  description: string;
  severity: ProblemSeverity;
  solution?: string;
  affectedAssets?: string[];
}

export interface UpdateProblemPayload {
  title?: string;
  description?: string;
  severity?: ProblemSeverity;
  status?: ProblemStatus;
  solution?: string;
  affectedAssets?: string[];
}

// Relationship Types
export interface Relationship {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  relationshipType: "depends_on" | "connects_to" | "hosts" | "contains" | string;
  label?: string | null;
  createdAt: string;
}

export interface RelationshipListResponse {
  items: Relationship[];
  total?: number;
  page?: number;
  limit?: number;
}

// Dashboard Types
export interface DashboardKPI {
  activeServers?: number;
  openProblems?: number;
  openIncidents?: number;
  documentsCount?: number;
  assetsCount?: number;
  problemsCount?: number;
}

export interface DashboardSummary {
  kpis: DashboardKPI;
  recentIncidents?: Incident[];
  recentDocuments?: Document[];
  recentActivity?: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    actor?: string;
  }>;
}

// Search Types
export type GlobalSearchEntityType = "asset" | "problem" | "incident" | "document";

export interface GlobalSearchResultItem {
  type: GlobalSearchEntityType;
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  createdAt: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: GlobalSearchResultItem[];
  grouped: {
    assets: GlobalSearchResultItem[];
    problems: GlobalSearchResultItem[];
    incidents: GlobalSearchResultItem[];
    documents: GlobalSearchResultItem[];
  };
}

// Knowledge Suggestion Types
export type KnowledgeSuggestionSourceType = "incident" | "problem";

export interface KnowledgeSuggestion {
  sourceType: KnowledgeSuggestionSourceType;
  sourceId: string;
  title: string;
  description: string;
  solution?: string | null;
  status?: string | null;
  priority?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  score: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulRate: number;
  reason: string;
}

// Settings Types
export interface UserSettings {
  username: string;
  notificationsEmail?: boolean;
  notificationsInApp?: boolean;
  theme?: "light" | "dark" | "auto";
  language?: string;
}

// Generic API Response Types
export interface ApiError {
  error?: string;
  message?: string;
  status?: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Audit Log Types
export interface AuditLogEntry {
  id: string;
  actorUsername: string | null;
  targetUsername: string | null;
  action: string;
  resource: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}
