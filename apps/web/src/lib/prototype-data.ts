export interface Asset {
  id: string;
  name: string;
  type: "server" | "vm" | "network" | "storage" | "service";
  ipAddress: string;
  location: string;
  status: "online" | "offline" | "warning" | "maintenance";
  os?: string;
  cpu?: string;
  memory?: string;
  lastUpdated: string;
  tags: string[];
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved";
  affectedAssets: string[];
  createdAt: string;
  resolvedAt?: string;
  solution?: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  type: "create" | "update" | "resolve" | "alert";
}

export interface RelationshipConnection {
  from: string;
  to: string;
  label: string;
}

export const mockAssets: Asset[] = [
  { id: "1", name: "PROD-WEB-01", type: "server", ipAddress: "10.0.1.10", location: "DC-East Rack A3", status: "online", os: "Ubuntu 22.04 LTS", cpu: "Intel Xeon E5-2680 v4 (16 cores)", memory: "64 GB DDR4", lastUpdated: "2026-04-13T08:30:00Z", tags: ["production", "web"] },
  { id: "2", name: "PROD-WEB-02", type: "server", ipAddress: "10.0.1.11", location: "DC-East Rack A3", status: "online", os: "Ubuntu 22.04 LTS", cpu: "Intel Xeon E5-2680 v4 (16 cores)", memory: "64 GB DDR4", lastUpdated: "2026-04-13T08:30:00Z", tags: ["production", "web"] },
  { id: "3", name: "DB-PRIMARY", type: "server", ipAddress: "10.0.2.5", location: "DC-East Rack B1", status: "online", os: "CentOS 8", cpu: "AMD EPYC 7702 (32 cores)", memory: "256 GB DDR4", lastUpdated: "2026-04-13T09:00:00Z", tags: ["production", "database"] },
  { id: "4", name: "VM-DEV-01", type: "vm", ipAddress: "10.0.3.20", location: "Hypervisor-01", status: "online", os: "Windows Server 2022", cpu: "4 vCPUs", memory: "16 GB", lastUpdated: "2026-04-12T14:00:00Z", tags: ["development"] },
  { id: "5", name: "VM-STAGING-01", type: "vm", ipAddress: "10.0.3.30", location: "Hypervisor-02", status: "warning", os: "Ubuntu 20.04", cpu: "8 vCPUs", memory: "32 GB", lastUpdated: "2026-04-13T07:15:00Z", tags: ["staging"] },
  { id: "6", name: "SW-CORE-01", type: "network", ipAddress: "10.0.0.1", location: "DC-East MDF", status: "online", lastUpdated: "2026-04-13T09:10:00Z", tags: ["core", "network"] },
  { id: "7", name: "FW-EDGE-01", type: "network", ipAddress: "10.0.0.254", location: "DC-East MDF", status: "online", lastUpdated: "2026-04-13T09:10:00Z", tags: ["firewall", "edge"] },
  { id: "8", name: "NAS-BACKUP-01", type: "storage", ipAddress: "10.0.4.10", location: "DC-East Rack C2", status: "online", lastUpdated: "2026-04-13T06:00:00Z", tags: ["backup", "storage"] },
  { id: "9", name: "MAIL-SERVER", type: "server", ipAddress: "10.0.1.50", location: "DC-West Rack A1", status: "offline", os: "Ubuntu 20.04", cpu: "Intel Xeon E3 (4 cores)", memory: "16 GB", lastUpdated: "2026-04-12T22:00:00Z", tags: ["production", "email"] },
  { id: "10", name: "K8S-NODE-01", type: "server", ipAddress: "10.0.5.10", location: "DC-East Rack D1", status: "online", os: "Ubuntu 22.04", cpu: "AMD EPYC 7502 (16 cores)", memory: "128 GB", lastUpdated: "2026-04-13T08:45:00Z", tags: ["kubernetes", "production"] },
];

export const mockProblems: Problem[] = [
  { id: "1", title: "Mail server unresponsive", description: "MAIL-SERVER stopped responding to SMTP and IMAP connections. CPU at 100% utilization.", severity: "critical", status: "open", affectedAssets: ["MAIL-SERVER"], createdAt: "2026-04-12T22:10:00Z" },
  { id: "2", title: "VM-STAGING-01 high memory usage", description: "Memory usage consistently above 90%. Possible memory leak in staging application.", severity: "high", status: "investigating", affectedAssets: ["VM-STAGING-01"], createdAt: "2026-04-13T07:20:00Z" },
  { id: "3", title: "Intermittent DNS resolution failures", description: "Some internal DNS queries failing intermittently, affecting service discovery.", severity: "medium", status: "resolved", affectedAssets: ["SW-CORE-01"], createdAt: "2026-04-10T14:00:00Z", resolvedAt: "2026-04-11T09:30:00Z", solution: "Updated DNS forwarder configuration and flushed DNS cache across all nodes." },
  { id: "4", title: "NAS backup job failed", description: "Nightly backup job to NAS-BACKUP-01 failed with disk space error.", severity: "high", status: "resolved", affectedAssets: ["NAS-BACKUP-01", "DB-PRIMARY"], createdAt: "2026-04-09T06:15:00Z", resolvedAt: "2026-04-09T10:00:00Z", solution: "Cleaned up old snapshots and expanded storage volume by 2TB." },
  { id: "5", title: "SSL certificate expiring soon", description: "SSL certificate for production web servers expires in 7 days.", severity: "medium", status: "open", affectedAssets: ["PROD-WEB-01", "PROD-WEB-02"], createdAt: "2026-04-13T08:00:00Z" },
];

export const mockActivities: ActivityItem[] = [
  { id: "1", action: "reported problem", target: "Mail server unresponsive", user: "Sarah Chen", timestamp: "2026-04-12T22:10:00Z", type: "alert" },
  { id: "2", action: "added asset", target: "K8S-NODE-01", user: "John Doe", timestamp: "2026-04-12T16:00:00Z", type: "create" },
  { id: "3", action: "resolved problem", target: "DNS resolution failures", user: "Mike Torres", timestamp: "2026-04-11T09:30:00Z", type: "resolve" },
  { id: "4", action: "updated asset", target: "PROD-WEB-01", user: "John Doe", timestamp: "2026-04-11T08:00:00Z", type: "update" },
  { id: "5", action: "resolved problem", target: "NAS backup job failed", user: "Sarah Chen", timestamp: "2026-04-09T10:00:00Z", type: "resolve" },
];

export const connections: RelationshipConnection[] = [
  { from: "PROD-WEB-01", to: "SW-CORE-01", label: "eth0" },
  { from: "PROD-WEB-02", to: "SW-CORE-01", label: "eth0" },
  { from: "DB-PRIMARY", to: "SW-CORE-01", label: "eth0" },
  { from: "SW-CORE-01", to: "FW-EDGE-01", label: "trunk" },
  { from: "NAS-BACKUP-01", to: "SW-CORE-01", label: "eth0" },
  { from: "VM-DEV-01", to: "SW-CORE-01", label: "vSwitch" },
  { from: "VM-STAGING-01", to: "SW-CORE-01", label: "vSwitch" },
  { from: "MAIL-SERVER", to: "SW-CORE-01", label: "eth0" },
  { from: "K8S-NODE-01", to: "SW-CORE-01", label: "eth0" },
  { from: "DB-PRIMARY", to: "NAS-BACKUP-01", label: "backup" },
  { from: "PROD-WEB-01", to: "DB-PRIMARY", label: "mysql" },
  { from: "PROD-WEB-02", to: "DB-PRIMARY", label: "mysql" },
];

export const kpiData = {
  totalAssets: mockAssets.length,
  activeServers: mockAssets.filter((asset) => asset.type === "server" && asset.status === "online").length,
  openProblems: mockProblems.filter((problem) => problem.status !== "resolved").length,
  resolvedThisMonth: mockProblems.filter((problem) => problem.status === "resolved").length,
};