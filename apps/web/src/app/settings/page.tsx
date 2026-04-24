"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { User, Shield, Bell, Plug, Key, FileText } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { AccessControlPayload, UserSettings, AuditLogsResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/theme-provider";
import { ExportMenu } from "@/components/ui";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "access", label: "Access Control", icon: Shield },
  { id: "audit", label: "Audit Logs", icon: FileText },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "api", label: "API Keys", icon: Key }
] as const;

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme: setAppTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("profile");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [accessControl, setAccessControl] = useState<AccessControlPayload | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogsResponse | null>(null);
  const [selectedAccessUser, setSelectedAccessUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActorFilter, setAuditActorFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditResourceFilter, setAuditResourceFilter] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [auditTypeFilter, setAuditTypeFilter] = useState("");
  const [auditSortBy, setAuditSortBy] = useState<"createdAt" | "actorUsername" | "action" | "resource">("createdAt");
  const [auditSortOrder, setAuditSortOrder] = useState<"asc" | "desc">("desc");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(50);
  const [expandedAuditLogId, setExpandedAuditLogId] = useState<string | null>(null);
  const [auditActorSuggestions, setAuditActorSuggestions] = useState<string[]>([]);
  const [auditActionSuggestions, setAuditActionSuggestions] = useState<string[]>([]);
  const [auditResourceSuggestions, setAuditResourceSuggestions] = useState<string[]>([]);

  const canManageAccess = Boolean(user?.permissions?.includes("user:manage") || user?.permissions?.includes("permission:manage"));

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError(null);
        const data = await apiClient.get<UserSettings>("/settings/me");
        setSettings(data);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load settings"));
      }
    };

    loadSettings();
  }, []);

  const loadAccessControl = async () => {
    try {
      const data = await apiClient.get<AccessControlPayload>("/admin/access");
      setAccessControl(data);
      if (!selectedAccessUser && data.users.length > 0) {
        setSelectedAccessUser(data.users[0].username);
      }
      if (!selectedRole && data.roles.length > 0) {
        setSelectedRole(data.roles[0].key);
      }
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load access control data"));
    }
  };

  useEffect(() => {
    if (activeTab === "access" && canManageAccess) {
      loadAccessControl();
    }
  }, [activeTab, canManageAccess]);

  const loadAuditLogs = async () => {
    try {
      const data = await apiClient.get<AuditLogsResponse>("/admin/audit-logs", {
        limit: auditPageSize,
        offset: (auditPage - 1) * auditPageSize,
        q: auditSearch.trim() || undefined,
        actor: auditActorFilter.trim() || undefined,
        action: auditActionFilter.trim() || undefined,
        resource: auditResourceFilter.trim() || undefined,
        type: auditTypeFilter || undefined,
        from: auditFrom || undefined,
        to: auditTo || undefined,
        sortBy: auditSortBy,
        sortOrder: auditSortOrder
      });
      setAuditLogs(data);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load audit logs"));
    }
  };

  const loadAuditSuggestions = async (field: "actor" | "action" | "resource", value: string) => {
    try {
      const data = await apiClient.get<{ items: string[] }>("/admin/audit-logs/suggestions", {
        field,
        q: value.trim() || undefined,
        limit: 10
      });

      if (field === "actor") {
        setAuditActorSuggestions(data.items || []);
      } else if (field === "action") {
        setAuditActionSuggestions(data.items || []);
      } else {
        setAuditResourceSuggestions(data.items || []);
      }
    } catch (_error) {
      if (field === "actor") {
        setAuditActorSuggestions([]);
      } else if (field === "action") {
        setAuditActionSuggestions([]);
      } else {
        setAuditResourceSuggestions([]);
      }
    }
  };

  useEffect(() => {
    if (activeTab !== "audit" || !canManageAccess) {
      return;
    }

    const id = window.setTimeout(() => {
      void loadAuditSuggestions("actor", auditActorFilter);
    }, 180);

    return () => window.clearTimeout(id);
  }, [auditActorFilter, activeTab, canManageAccess]);

  useEffect(() => {
    if (activeTab !== "audit" || !canManageAccess) {
      return;
    }

    const id = window.setTimeout(() => {
      void loadAuditSuggestions("action", auditActionFilter);
    }, 180);

    return () => window.clearTimeout(id);
  }, [auditActionFilter, activeTab, canManageAccess]);

  useEffect(() => {
    if (activeTab !== "audit" || !canManageAccess) {
      return;
    }

    const id = window.setTimeout(() => {
      void loadAuditSuggestions("resource", auditResourceFilter);
    }, 180);

    return () => window.clearTimeout(id);
  }, [auditResourceFilter, activeTab, canManageAccess]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditActorFilter, auditActionFilter, auditResourceFilter, auditTypeFilter, auditFrom, auditTo, auditSortBy, auditSortOrder, auditPageSize]);

  useEffect(() => {
    if (activeTab === "audit" && canManageAccess) {
      loadAuditLogs();
    }
  }, [activeTab, canManageAccess, auditSearch, auditActorFilter, auditActionFilter, auditResourceFilter, auditTypeFilter, auditFrom, auditTo, auditSortBy, auditSortOrder, auditPage, auditPageSize]);

  const auditTotalPages = useMemo(() => {
    if (!auditLogs || auditPageSize <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(auditLogs.total / auditPageSize));
  }, [auditLogs, auditPageSize]);

  const exportAuditCsv = async () => {
    try {
      const params = new URLSearchParams({
        limit: "1000",
        format: "csv",
        sortBy: auditSortBy,
        sortOrder: auditSortOrder
      });

      if (auditSearch.trim()) {
        params.set("q", auditSearch.trim());
      }
      if (auditActorFilter.trim()) {
        params.set("actor", auditActorFilter.trim());
      }
      if (auditActionFilter.trim()) {
        params.set("action", auditActionFilter.trim());
      }
      if (auditResourceFilter.trim()) {
        params.set("resource", auditResourceFilter.trim());
      }
      if (auditTypeFilter) {
        params.set("type", auditTypeFilter);
      }
      if (auditFrom) {
        params.set("from", auditFrom);
      }
      if (auditTo) {
        params.set("to", auditTo);
      }

      const response = await fetch(`/api/backend/admin/audit-logs?${params.toString()}`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to export audit CSV"));
    }
  };

  const exportAuditPdf = () => {
    if (!auditLogs || auditLogs.logs.length === 0) {
      return;
    }

    const rows = auditLogs.logs
      .map(
        (log) => `
          <tr>
            <td>${new Date(log.createdAt).toLocaleString()}</td>
            <td>${log.actorUsername || "-"}</td>
            <td>${log.action}</td>
            <td>${log.targetUsername || "-"}</td>
            <td>${log.resource || "-"}</td>
          </tr>`
      )
      .join("");

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) {
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Audit Logs Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            .meta { color: #666; margin-bottom: 16px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>Audit Logs</h1>
          <div class="meta">Generated at ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const saveSettings = async (next: UserSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      const saved = await apiClient.patch<UserSettings>("/settings/me", next as Record<string, any>);
      setSettings(saved);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to save settings"));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRolePermission = async (roleKey: string, permissionKey: string) => {
    if (!accessControl) {
      return;
    }

    const role = accessControl.roles.find((item) => item.key === roleKey);
    if (!role) {
      return;
    }

    const hasPermission = role.permissions.includes(permissionKey);
    const permissionKeys = hasPermission
      ? role.permissions.filter((key) => key !== permissionKey)
      : [...role.permissions, permissionKey];

    try {
      await apiClient.patch(`/admin/roles/${roleKey}`, { permissionKeys });
      await loadAccessControl();
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to update role permissions"));
    }
  };

  const toggleUserRole = async (username: string, roleKey: string) => {
    if (!accessControl) {
      return;
    }

    const userSummary = accessControl.users.find((item) => item.username === username);
    if (!userSummary) {
      return;
    }

    const hasRole = userSummary.roles.some((role) => role.key === roleKey);
    const roleKeys = hasRole
      ? userSummary.roles.map((role) => role.key).filter((key) => key !== roleKey)
      : [...userSummary.roles.map((role) => role.key), roleKey];

    try {
      await apiClient.patch(`/admin/users/${username}`, {
        roleKeys,
        allowPermissions: userSummary.allowPermissions,
        denyPermissions: userSummary.denyPermissions
      });
      await loadAccessControl();
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to update user roles"));
    }
  };

  const toggleUserPermission = async (username: string, permissionKey: string, mode: "allow" | "deny") => {
    if (!accessControl) {
      return;
    }

    const userSummary = accessControl.users.find((item) => item.username === username);
    if (!userSummary) {
      return;
    }

    const allowSet = new Set(userSummary.allowPermissions);
    const denySet = new Set(userSummary.denyPermissions);

    if (mode === "allow") {
      if (allowSet.has(permissionKey)) {
        allowSet.delete(permissionKey);
      } else {
        allowSet.add(permissionKey);
        denySet.delete(permissionKey);
      }
    } else if (denySet.has(permissionKey)) {
      denySet.delete(permissionKey);
    } else {
      denySet.add(permissionKey);
      allowSet.delete(permissionKey);
    }

    try {
      await apiClient.patch(`/admin/users/${username}`, {
        roleKeys: userSummary.roles.map((role) => role.key),
        allowPermissions: Array.from(allowSet),
        denyPermissions: Array.from(denySet)
      });
      await loadAccessControl();
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to update user permissions"));
    }
  };

  const selectedRoleDetails = accessControl?.roles.find((role) => role.key === selectedRole) || null;
  const selectedUserDetails = accessControl?.users.find((item) => item.username === selectedAccessUser) || null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="kpi-shadow border border-border/50 rounded-lg bg-card md:w-[200px] shrink-0">
          <div className="p-2">
            <nav className="flex md:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 kpi-shadow border border-border/50 rounded-lg bg-card p-6">
          {error && <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="first-name" className="text-sm">First Name</label>
                  <input
                    id="first-name"
                    value={settings?.profile?.firstName || ""}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              profile: {
                                firstName: event.target.value,
                                lastName: prev.profile?.lastName || "",
                                email: prev.profile?.email || ""
                              }
                            }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last-name" className="text-sm">Last Name</label>
                  <input
                    id="last-name"
                    value={settings?.profile?.lastName || ""}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              profile: {
                                firstName: prev.profile?.firstName || "",
                                lastName: event.target.value,
                                email: prev.profile?.email || ""
                              }
                            }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="email" className="text-sm">Email</label>
                  <input
                    id="email"
                    value={settings?.profile?.email || ""}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              profile: {
                                firstName: prev.profile?.firstName || "",
                                lastName: prev.profile?.lastName || "",
                                email: event.target.value
                              }
                            }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="role" className="text-sm">Role</label>
                  <input id="role" defaultValue="IT Administrator" disabled className="h-10 w-full rounded-md border border-input bg-muted px-3" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="theme" className="text-sm">Theme Mode</label>
                  <select
                    id="theme"
                    value={settings?.theme === "auto" ? theme : settings?.theme || theme}
                    onChange={(event) => {
                      const nextTheme = event.target.value as "light" | "dark";
                      setSettings((prev) => (prev ? { ...prev, theme: nextTheme } : prev));
                      void setAppTheme(nextTheme);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Theme preference is saved to your user settings.</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
                  onClick={() => settings && saveSettings(settings)}
                  disabled={!settings || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button className="h-8 px-3 rounded-md border border-border bg-card text-sm">Cancel</button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {["Email notifications", "Critical alerts", "Weekly digest", "Asset status changes"].map((item) => (
                <label key={item} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                  <span>{item}</span>
                  <input
                    type="checkbox"
                    checked={
                      item === "Email notifications"
                        ? Boolean(settings?.notifications.email)
                        : item === "Critical alerts"
                        ? Boolean(settings?.notifications.critical)
                        : item === "Asset status changes"
                        ? Boolean(settings?.notifications.inApp)
                        : false
                    }
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                ...(item === "Email notifications" ? { email: event.target.checked } : {}),
                                ...(item === "Critical alerts" ? { critical: event.target.checked } : {}),
                                ...(item === "Asset status changes" ? { inApp: event.target.checked } : {})
                              }
                            }
                          : prev
                      )
                    }
                    className="h-4 w-4"
                  />
                </label>
              ))}
              <button
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
                onClick={() => settings && saveSettings(settings)}
                disabled={!settings || isSaving}
              >
                {isSaving ? "Saving..." : "Save Notifications"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Security</h2>
              <div className="space-y-1.5">
                <label htmlFor="current-password" className="text-sm">Current Password</label>
                <input id="current-password" type="password" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm">New Password</label>
                <input id="new-password" type="password" className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3" />
              </div>
              <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm">Update Password</button>
            </div>
          )}

          {activeTab === "access" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Access Control</h2>

              {!canManageAccess && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                  You do not have permission to manage user access.
                </div>
              )}

              {canManageAccess && !accessControl && (
                <p className="text-sm text-muted-foreground">Loading access control data...</p>
              )}

              {canManageAccess && accessControl && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Roles</h3>
                      <div className="max-h-[340px] overflow-auto border border-border rounded-md p-2 space-y-1">
                        {accessControl.roles.map((role) => (
                          <button
                            key={role.key}
                            type="button"
                            onClick={() => setSelectedRole(role.key)}
                            className={`w-full text-left px-2 py-2 rounded-md text-sm ${
                              selectedRole === role.key ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            }`}
                          >
                            <p className="font-medium">{role.name}</p>
                            <p className="text-xs text-muted-foreground">{role.key}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Role Permissions</h3>
                      {selectedRoleDetails ? (
                        <div className="border border-border rounded-md p-3 space-y-3">
                          <div>
                            <p className="font-medium">{selectedRoleDetails.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedRoleDetails.description || "No description"}</p>
                          </div>
                          <div className="max-h-[300px] overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {accessControl.permissions.map((permission) => {
                              const enabled = selectedRoleDetails.permissions.includes(permission.key);
                              return (
                                <label key={permission.key} className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={() => toggleRolePermission(selectedRoleDetails.key, permission.key)}
                                    className="mt-0.5 h-4 w-4"
                                  />
                                  <span>
                                    <span className="font-medium block">{permission.key}</span>
                                    <span className="text-xs text-muted-foreground">{permission.description || `${permission.module}:${permission.action}`}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Select a role to manage permissions.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Users</h3>
                      <div className="max-h-[340px] overflow-auto border border-border rounded-md p-2 space-y-1">
                        {accessControl.users.map((item) => (
                          <button
                            key={item.username}
                            type="button"
                            onClick={() => setSelectedAccessUser(item.username)}
                            className={`w-full text-left px-2 py-2 rounded-md text-sm ${
                              selectedAccessUser === item.username ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            }`}
                          >
                            <p className="font-medium">{item.username}</p>
                            <p className="text-xs text-muted-foreground">{item.roles.map((role) => role.name).join(", ") || "No roles"}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">User Overrides</h3>
                      {selectedUserDetails ? (
                        <div className="border border-border rounded-md p-3 space-y-3">
                          <div>
                            <p className="font-medium">{selectedUserDetails.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedUserDetails.firstName || selectedUserDetails.lastName || selectedUserDetails.email
                                ? `${selectedUserDetails.firstName || ""} ${selectedUserDetails.lastName || ""} ${selectedUserDetails.email ? `(${selectedUserDetails.email})` : ""}`.trim()
                                : "No profile details"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Roles</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {accessControl.roles.map((role) => {
                                const enabled = selectedUserDetails.roles.some((assignedRole) => assignedRole.key === role.key);
                                return (
                                  <label key={role.key} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      onChange={() => toggleUserRole(selectedUserDetails.username, role.key)}
                                      className="h-4 w-4"
                                    />
                                    <span>{role.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Permission Overrides</p>
                            <div className="max-h-[300px] overflow-auto space-y-2">
                              {accessControl.permissions.map((permission) => {
                                const isAllowed = selectedUserDetails.allowPermissions.includes(permission.key);
                                const isDenied = selectedUserDetails.denyPermissions.includes(permission.key);

                                return (
                                  <div key={permission.key} className="rounded-md border border-border p-2 text-sm">
                                    <p className="font-medium">{permission.key}</p>
                                    <p className="text-xs text-muted-foreground mb-2">{permission.description || `${permission.module}:${permission.action}`}</p>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleUserPermission(selectedUserDetails.username, permission.key, "allow")}
                                        className={`h-7 px-2 rounded-md border text-xs ${isAllowed ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-background border-border"}`}
                                      >
                                        Allow
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleUserPermission(selectedUserDetails.username, permission.key, "deny")}
                                        className={`h-7 px-2 rounded-md border text-xs ${isDenied ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-background border-border"}`}
                                      >
                                        Deny
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Select a user to manage role and permission overrides.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Audit Logs</h2>

              {!canManageAccess && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                  You do not have permission to view audit logs.
                </div>
              )}

              {canManageAccess && !auditLogs && (
                <p className="text-sm text-muted-foreground">Loading audit logs...</p>
              )}

              {canManageAccess && auditLogs && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      value={auditSearch}
                      onChange={(event) => setAuditSearch(event.target.value)}
                      placeholder="Search actor/action/resource"
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      value={auditActorFilter}
                      onChange={(event) => setAuditActorFilter(event.target.value)}
                      list="audit-actor-suggestions"
                      placeholder="Filter actor"
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      value={auditActionFilter}
                      onChange={(event) => setAuditActionFilter(event.target.value)}
                      list="audit-action-suggestions"
                      placeholder="Filter action"
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      value={auditResourceFilter}
                      onChange={(event) => setAuditResourceFilter(event.target.value)}
                      list="audit-resource-suggestions"
                      placeholder="Filter resource"
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <select
                      value={auditTypeFilter}
                      onChange={(event) => setAuditTypeFilter(event.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">All event types</option>
                      <option value="access">Access events</option>
                      <option value="change">Change events</option>
                    </select>
                    <input
                      type="date"
                      value={auditFrom}
                      onChange={(event) => setAuditFrom(event.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <input
                      type="date"
                      value={auditTo}
                      onChange={(event) => setAuditTo(event.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </div>

                  <datalist id="audit-actor-suggestions">
                    {auditActorSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  <datalist id="audit-action-suggestions">
                    {auditActionSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  <datalist id="audit-resource-suggestions">
                    {auditResourceSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      title="Sort audit logs"
                      value={auditSortBy}
                      onChange={(event) => setAuditSortBy(event.target.value as "createdAt" | "actorUsername" | "action" | "resource")}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="createdAt">Sort by date</option>
                      <option value="actorUsername">Sort by actor</option>
                      <option value="action">Sort by action</option>
                      <option value="resource">Sort by resource</option>
                    </select>
                    <select
                      title="Sort order"
                      value={auditSortOrder}
                      onChange={(event) => setAuditSortOrder(event.target.value as "asc" | "desc")}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="desc">Newest first</option>
                      <option value="asc">Oldest first</option>
                    </select>
                    <ExportMenu
                      onExportCsv={exportAuditCsv}
                      onExportPdf={exportAuditPdf}
                      label="Export"
                      className=""
                      menuClassName="text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <p>{auditLogs.total} total audit log entries</p>
                    <div className="flex items-center gap-2">
                      <span>Rows</span>
                      <select
                        title="Rows per page"
                        value={auditPageSize}
                        onChange={(event) => setAuditPageSize(parseInt(event.target.value, 10) || 50)}
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </div>
                  </div>
                  <div className="overflow-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                setAuditSortBy("createdAt");
                                setAuditSortOrder((prev) => (auditSortBy === "createdAt" ? (prev === "asc" ? "desc" : "asc") : "desc"));
                              }}
                              className="inline-flex items-center gap-1"
                            >
                              Date {auditSortBy === "createdAt" ? (auditSortOrder === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                setAuditSortBy("actorUsername");
                                setAuditSortOrder((prev) => (auditSortBy === "actorUsername" ? (prev === "asc" ? "desc" : "asc") : "asc"));
                              }}
                              className="inline-flex items-center gap-1"
                            >
                              Actor {auditSortBy === "actorUsername" ? (auditSortOrder === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                setAuditSortBy("action");
                                setAuditSortOrder((prev) => (auditSortBy === "action" ? (prev === "asc" ? "desc" : "asc") : "asc"));
                              }}
                              className="inline-flex items-center gap-1"
                            >
                              Action {auditSortBy === "action" ? (auditSortOrder === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">Target</th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                setAuditSortBy("resource");
                                setAuditSortOrder((prev) => (auditSortBy === "resource" ? (prev === "asc" ? "desc" : "asc") : "asc"));
                              }}
                              className="inline-flex items-center gap-1"
                            >
                              Resource {auditSortBy === "resource" ? (auditSortOrder === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs.logs.length > 0 ? (
                          auditLogs.logs.map((log) => (
                            <Fragment key={log.id}>
                              <tr
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => setExpandedAuditLogId((prev) => (prev === log.id ? null : log.id))}
                              >
                                <td className="px-3 py-2 text-xs">
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-xs font-mono">
                                  {log.actorUsername || "—"}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-800">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs font-mono">
                                  {log.targetUsername || "—"}
                                </td>
                                <td className="px-3 py-2 text-xs truncate max-w-xs" title={log.resource || ""}>
                                  {log.resource || "—"}
                                </td>
                              </tr>
                              {expandedAuditLogId === log.id && (
                                <tr className="bg-muted/30">
                                  <td colSpan={5} className="px-3 py-2 text-xs">
                                    <p className="font-semibold text-foreground mb-1">Metadata</p>
                                    <pre className="rounded-md border border-border bg-background p-2 overflow-auto max-h-56">{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                              No audit log entries found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Page {auditPage} of {auditTotalPages}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                        disabled={auditPage <= 1}
                        className="h-8 px-3 rounded-md border border-border bg-background text-xs disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuditPage((prev) => Math.min(auditTotalPages, prev + 1))}
                        disabled={auditPage >= auditTotalPages}
                        className="h-8 px-3 rounded-md border border-border bg-background text-xs disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === "integrations" || activeTab === "api") && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
