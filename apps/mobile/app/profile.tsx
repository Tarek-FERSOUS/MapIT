import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { api, getApiErrorMessage } from "../services/apiClient";
import { useAuthStore } from "../store/authStore";
import { getFullName } from "../utils/formatting";
import {
  SafeAreaContainer,
  SectionHeader,
  Card,
  Badge,
  Button,
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  COLORS,
  SPACING
} from "../components/ui/common";

interface ProfileSettings {
  profile?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  notifications?: {
    email: boolean;
    inApp: boolean;
    critical: boolean;
  };
  theme?: "light" | "dark" | "auto";
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!token || !user?.username) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await api.settings.get(user.username);
      setSettings(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load profile"));
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.username]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login" as never);
      }
    }, [token, router])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          clearAuth();
          router.replace("/login" as never);
        }
      }
    ]);
  };

  if (!token) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const permissionCount = user?.permissions?.length || 0;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title="Profile" subtitle="Your account, role, and access" />

        <View style={styles.content}>
          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
          {showSaved && <SuccessAlert message="Profile loaded" onDismiss={() => setShowSaved(false)} />}

          <Card style={styles.heroCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={COLORS.text.inverse} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.name}>{getFullName(user?.firstName, user?.lastName, user?.username)}</Text>
              <Text style={styles.username}>@{user?.username}</Text>
              <View style={styles.heroBadges}>
                <Badge text={role || user?.role || "User"} type="info" />
                <Badge text={`${permissionCount} permissions`} type="default" />
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Account details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{settings?.profile?.email || user?.email || "Not set"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Theme</Text>
              <Text style={styles.detailValue}>{settings?.theme || "auto"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notifications</Text>
              <Text style={styles.detailValue}>
                {settings?.notifications?.email ? "Email, " : ""}
                {settings?.notifications?.inApp ? "In-app, " : ""}
                {settings?.notifications?.critical ? "Critical alerts" : "Default alerts"}
              </Text>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.permissionsWrap}>
              {(user?.permissions || []).slice(0, 12).map((permission) => (
                <Badge key={permission} text={permission} type="default" />
              ))}
              {!user?.permissions?.length && <Text style={styles.helperText}>No permissions found for this account.</Text>}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.actionRow}>
              <Button title="Open Settings" variant="primary" onPress={() => router.push("/settings" as never)} />
              <Button title="Go to Dashboard" variant="secondary" onPress={() => router.replace("/(tabs)" as never)} />
            </View>
            <Button title="Log Out" variant="danger" full onPress={handleLogout} />
          </Card>
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
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  heroText: {
    flex: 1
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },
  username: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
    paddingVertical: SPACING.sm
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    flex: 1
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text.primary,
    flex: 1,
    textAlign: "right"
  },
  permissionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm
  },
  helperText: {
    color: COLORS.text.secondary,
    fontSize: 13
  },
  actionRow: {
    gap: SPACING.sm,
    marginBottom: SPACING.md
  }
});