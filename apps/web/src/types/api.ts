export type UserRole = "Admin" | "User";

export interface User {
  username: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  createdAt: string;
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
