import React, { useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaContainer,
  Card,
  COLORS,
  SPACING,
  LoadingSpinner,
  ErrorAlert
} from "../../components/ui/common";
import { useQuery } from "../../hooks/useApi";
import { api, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { getFullName } from "../../utils/formatting";

interface DashboardStats {
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

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "new-incident", title: "New Incident", icon: "alert-circle", route: "/incidents/new", color: COLORS.status.warning },
  { id: "new-document", title: "New Document", icon: "document-text", route: "/documents/new", color: COLORS.status.info },
  { id: "new-asset", title: "New Asset", icon: "server", route: "/assets/new", color: COLORS.primary },
  { id: "search", title: "Search", icon: "search", route: "/search", color: COLORS.status.success }
];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const { data: stats, isLoading, error } = useQuery<DashboardStats>(() => api.dashboard.getSummary(), [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login" as never);
      }
    }, [token, router])
  );

  if (!token) return null;
  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>IT Operations</Text>
          <Text style={styles.heroTitle}>MapIT Dashboard</Text>
          <Text style={styles.heroSubtitle}>Live incident, asset, and document activity for your workspace.</Text>
        </View>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{getFullName(user?.firstName, user?.lastName, user?.username)}</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={COLORS.text.inverse} />
          </View>
        </View>

        {error && <ErrorAlert message={getApiErrorMessage(error)} />}

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickActionButton} onPress={() => router.push(action.route as never)} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon as never} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, styles.statCardHalf]}>
              <View style={styles.statHeader}>
                <Ionicons name="alert-circle" size={24} color={COLORS.status.warning} />
                <Text style={styles.statValue}>{stats?.kpis.incidents || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Total Incidents</Text>
            </Card>

            <Card style={[styles.statCard, styles.statCardHalf]}>
              <View style={styles.statHeader}>
                <Ionicons name="alert" size={24} color={COLORS.status.error} />
                <Text style={styles.statValue}>{stats?.kpis.openProblems || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Active Problems</Text>
            </Card>

            <Card style={[styles.statCard, styles.statCardHalf]}>
              <View style={styles.statHeader}>
                <Ionicons name="server" size={24} color={COLORS.primary} />
                <Text style={styles.statValue}>{stats?.kpis.totalAssets || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Assets</Text>
            </Card>

            <Card style={[styles.statCard, styles.statCardHalf]}>
              <View style={styles.statHeader}>
                <Ionicons name="build" size={24} color={COLORS.status.info} />
                <Text style={styles.statValue}>{stats?.kpis.activeServers || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Maintenance</Text>
            </Card>

            <Card style={[styles.statCard, styles.statCardHalf]}>
              <View style={styles.statHeader}>
                <Ionicons name="document-text" size={24} color={COLORS.status.success} />
                <Text style={styles.statValue}>{stats?.kpis.documents || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Documents</Text>
            </Card>

            <Card style={[styles.statCard, styles.statCardHalf]}>
              <View style={styles.statHeader}>
                <Ionicons name="people" size={24} color={COLORS.status.warning} />
                <Text style={styles.statValue}>{stats?.kpis.users || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Users</Text>
            </Card>
          </View>
        </View>

        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {!stats?.recentActivity?.length ? (
            <Text style={styles.emptyText}>No recent activity yet.</Text>
          ) : (
            stats.recentActivity.slice(0, 6).map((activity) => (
              <View key={`${activity.type}-${activity.id}`} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>
                  {activity.type === "incident" ? "Incident" : "Document"}: {activity.title}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <TouchableOpacity style={styles.navLink} onPress={() => router.push("/incidents" as never)} activeOpacity={0.7}>
            <Ionicons name="alert-circle" size={20} color={COLORS.primary} />
            <Text style={styles.navLinkText}>View All Incidents</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navLink} onPress={() => router.push("/assets" as never)} activeOpacity={0.7}>
            <Ionicons name="server" size={20} color={COLORS.primary} />
            <Text style={styles.navLinkText}>View All Assets</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navLink} onPress={() => router.push("/problems" as never)} activeOpacity={0.7}>
            <Ionicons name="bug" size={20} color={COLORS.primary} />
            <Text style={styles.navLinkText}>Knowledge Base</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
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
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLORS.primary,
    marginBottom: SPACING.xs
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text.secondary
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg
  },
  greeting: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text.primary
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  quickActionsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    justifyContent: "space-between"
  },
  quickActionButton: {
    width: "48%",
    alignItems: "center",
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "center"
  },
  statsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.md
  },
  statCard: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    alignItems: "center"
  },
  statCardHalf: {
    width: "48%"
  },
  statHeader: {
    alignItems: "center",
    marginBottom: SPACING.md
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text.primary,
    marginTop: SPACING.xs
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: "600",
    textAlign: "center"
  },
  activityContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary
  },
  activityText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 19
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.text.secondary
  },
  navLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.md,
    gap: SPACING.md
  },
  navLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.primary
  }
});
