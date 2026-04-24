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
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface PermissionDefinition {
  id: string;
  key: string;
  module: string;
  action: string;
  description?: string | null;
}

export interface RoleDefinition {
  key: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissions: string[];
}

export interface AccessUserSummary {
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  roles: AssignedRole[];
  allowPermissions: string[];
  denyPermissions: string[];
  permissions: string[];
}

export interface AccessControlPayload {
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  users: AccessUserSummary[];
}

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
}

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

export interface KnowledgeSuggestionResponse {
  incidentId?: string | null;
  query: {
    title: string;
    description: string;
  };
  solutions: KnowledgeSuggestion[];
  similarIncidents: KnowledgeSuggestion[];
}

export interface KnowledgeFeedbackResponse {
  success: boolean;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface DashboardSummary {
  kpis: {
    incidents: number;
    documents: number;
    users: number;
    totalAssets?: number;
    activeServers?: number;
    openProblems?: number;
    resolvedThisMonth?: number;
  };
  recentActivity: {
    id: string;
    title: string;
    createdAt: string;
    type: "incident" | "document";
  }[];
  openProblems?: {
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedAssets: string[];
  }[];
}

export interface NotificationItem {
  id: string;
  kind: "incident" | "document" | "problem" | "asset";
  sourceId: string;
  title: string;
  createdAt: string;
  href: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface ApiError {
  error?: string;
  message?: string;
  status?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: "server" | "vm" | "network-device" | "network" | "storage" | "service";
  ipAddress: string;
  location: string;
  status: "online" | "offline" | "maintenance" | "warning";
  os?: string;
  cpu?: string;
  memory?: string;
  tags?: string[];
  lastUpdated: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  affectedAssets: string[];
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "investigating" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  solution?: string;
}

export interface Relationship {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  relationshipType: "depends-on" | "hosted-on" | "communicates-with";
  label?: string;
}

export interface UserSettings {
  profile?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  notifications: {
    email: boolean;
    inApp: boolean;
    critical: boolean;
  };
  theme: "light" | "dark" | "auto";
}
