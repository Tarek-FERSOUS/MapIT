import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaContainer,
  SectionHeader,
  Button,
  Card,
  Divider,
  Badge,
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { useQuery, useMutation } from "../../hooks/useApi";
import { api, apiClient, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { getFullName } from "../../utils/formatting";

interface SettingsData {
  notificationsEmail?: boolean;
  notificationsInApp?: boolean;
  theme?: "light" | "dark" | "auto";
  language?: string;
}

interface AccessControlPayload {
  roles: Array<{ key: string; name: string; permissions: string[] }>;
  permissions: Array<{ key: string; module: string; action: string; description?: string | null }>;
  users: Array<{
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    roles: Array<{ key: string; name: string }>;
    allowPermissions: string[];
    denyPermissions: string[];
    permissions: string[];
  }>;
}

interface AuditLogEntry {
  id: string;
  actorUsername: string | null;
  targetUsername: string | null;
  action: string;
  resource: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  const token = useAuthStore((state) => state.token);
  const canManageAccess = Boolean(
    user?.permissions?.includes("user:manage") || user?.permissions?.includes("permission:manage")
  );

  const [settings, setSettings] = useState<SettingsData>({
    notificationsEmail: true,
    notificationsInApp: true,
    theme: "auto",
    language: "en"
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [accessControl, setAccessControl] = useState<AccessControlPayload | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogsResponse | null>(null);

  const { data, isLoading, error } = useQuery(
    () => api.settings.get(user?.username || ""),
    [user?.username, token]
  );

  const { execute: saveSettings, isLoading: isSaving } = useMutation(
    () => api.settings.update(user?.username || "", settings),
    {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    }
  );

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!canManageAccess || !user?.username) {
        setAccessControl(null);
        setAuditLogs(null);
        return;
      }

      try {
        const [accessData, auditData] = await Promise.all([
          apiClient.get<AccessControlPayload>("/admin/access"),
          apiClient.get<AuditLogsResponse>("/admin/audit-logs", {
            limit: 8,
            offset: 0,
            sortBy: "createdAt",
            sortOrder: "desc"
          })
        ]);

        setAccessControl(accessData);
        setAuditLogs(auditData);
      } catch (error) {
        setError(getApiErrorMessage(error, "Failed to load admin settings"));
        setAccessControl(null);
        setAuditLogs(null);
      }
    };

    loadAdminData();
  }, [canManageAccess, user?.username]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login" as never);
      }
    }, [token, router])
  );

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login" as never);
          }
        }
      ]
    );
  };

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!token) return null;

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title="Settings" subtitle="Manage your preferences" />

        <View style={styles.contentContainer}>
          {error && <ErrorAlert message={getApiErrorMessage(error)} />}
          {showSuccess && <SuccessAlert message="Settings saved!" />}

          {/* User Info */}
          <Card>
            <Text style={styles.sectionHeading}>Account</Text>

            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={24} color={COLORS.text.inverse} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{getFullName(user?.firstName, user?.lastName, user?.username)}</Text>
                <Text style={styles.userUsername}>@{user?.username}</Text>
                <Text style={styles.userRole}>{user?.role}</Text>
              </View>
            </View>
          </Card>

          {/* Notifications */}
          <Card>
            <Text style={styles.sectionHeading}>Notifications</Text>

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive alerts via email</Text>
              </View>
              <Switch
                value={settings.notificationsEmail || false}
                onValueChange={(value) => handleSettingChange("notificationsEmail", value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary + "80" }}
                thumbColor={settings.notificationsEmail ? COLORS.primary : COLORS.surface}
              />
            </View>

            <Divider />

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>In-App Notifications</Text>
                <Text style={styles.settingDescription}>Show notifications in the app</Text>
              </View>
              <Switch
                value={settings.notificationsInApp || false}
                onValueChange={(value) => handleSettingChange("notificationsInApp", value)}
                trackColor={{ false: COLORS.border, true: COLORS.primary + "80" }}
                thumbColor={settings.notificationsInApp ? COLORS.primary : COLORS.surface}
              />
            </View>
          </Card>

          {/* Display */}
          <Card>
            <Text style={styles.sectionHeading}>Display</Text>

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Theme</Text>
                <Text style={styles.settingDescription}>Choose your preferred theme</Text>
              </View>
            </View>

            <View style={styles.themeButtons}>
              {["light", "dark", "auto"].map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeButton,
                    settings.theme === theme && styles.themeButtonActive
                  ]}
                  onPress={() => handleSettingChange("theme", theme)}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      settings.theme === theme && styles.themeButtonTextActive
                    ]}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Language */}
          <Card>
            <Text style={styles.sectionHeading}>Language</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Currently: English</Text>
              <Text style={styles.settingDescription}>More languages coming soon</Text>
            </View>
          </Card>

          {/* Access Control */}
          <Card>
            <Text style={styles.sectionHeading}>Access Control</Text>
            <Text style={styles.sectionDescription}>
              Your role and permissions, plus the available role catalog.
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Role</Text>
              <Text style={styles.metaValue}>{user?.role || "User"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Permissions</Text>
              <Text style={styles.metaValue}>{user?.permissions?.length || 0}</Text>
            </View>

            <View style={styles.permissionWrap}>
              {(user?.permissions || []).slice(0, 10).map((permission) => (
                <Badge key={permission} text={permission} type="default" />
              ))}
            </View>

            {canManageAccess && accessControl ? (
              <>
                <Divider />
                <Text style={styles.smallHeading}>System roles</Text>
                <View style={styles.permissionWrap}>
                  {accessControl.roles.slice(0, 6).map((roleItem) => (
                    <Badge key={roleItem.key} text={roleItem.name} type="info" />
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.helperText}>
                Access management is available to administrators and permission managers.
              </Text>
            )}
          </Card>

          {/* Audit Logs */}
          <Card>
            <Text style={styles.sectionHeading}>Audit Logs</Text>
            <Text style={styles.sectionDescription}>
              Recent administrative events and access changes.
            </Text>

            {canManageAccess && auditLogs ? (
              <View style={styles.auditList}>
                {auditLogs.logs.slice(0, 5).map((entry) => (
                  <View key={entry.id} style={styles.auditItem}>
                    <View style={styles.auditIcon}>
                      <Ionicons name="time" size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.auditContent}>
                      <Text style={styles.auditAction}>{entry.action}</Text>
                      <Text style={styles.auditMeta}>
                        {entry.actorUsername || "system"}
                        {entry.resource ? ` • ${entry.resource}` : ""}
                        {entry.targetUsername ? ` • ${entry.targetUsername}` : ""}
                      </Text>
                      <Text style={styles.auditTime}>{new Date(entry.createdAt).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.helperText}>
                Audit logs are visible to administrators only.
              </Text>
            )}
          </Card>

          {/* Privacy & Security */}
          <Card>
            <Text style={styles.sectionHeading}>Privacy & Security</Text>

            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          </Card>

          {/* About */}
          <Card>
            <Text style={styles.sectionHeading}>About</Text>

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>

            <Divider />

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>API Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>

            <Divider />

            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Check for Updates</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          </Card>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Button
              title={isSaving ? "Saving..." : "Save Settings"}
              variant="primary"
              full
              loading={isSaving}
              disabled={isSaving}
              onPress={() => saveSettings()}
            />

            <Button
              title="Logout"
              variant="danger"
              full
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },

  sectionDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md
  },

  smallHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textTransform: "uppercase"
  },

  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md
  },

  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },

  userInfo: {
    flex: 1
  },

  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary
  },

  userUsername: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs
  },

  userRole: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: SPACING.xs
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs
  },

  metaLabel: {
    fontSize: 13,
    color: COLORS.text.secondary
  },

  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text.primary
  },

  helperText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 18
  },

  permissionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.sm
  },

  auditList: {
    gap: SPACING.md
  },

  auditItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md
  },

  auditIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2
  },

  auditContent: {
    flex: 1
  },

  auditAction: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 2
  },

  auditMeta: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2
  },

  auditTime: {
    fontSize: 11,
    color: COLORS.text.tertiary
  },

  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.primary
  },

  settingDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs
  },

  themeButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md
  },

  themeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.background
  },

  themeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },

  themeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary
  },

  themeButtonTextActive: {
    color: COLORS.text.inverse
  },

  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md
  },

  linkText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600"
  },

  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.md
  },

  aboutLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500"
  },

  aboutValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: "600"
  },

  actionsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.xl
  }
});
