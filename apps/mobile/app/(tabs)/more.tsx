import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaContainer, SectionHeader, Card, Badge, COLORS, SPACING } from "../../components/ui/common";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    description: "Problems, solutions, and known issues",
    icon: "bug",
    route: "/problems",
    tone: "warning"
  },
  {
    id: "relationships",
    title: "Relationships",
    description: "Asset dependencies",
    icon: "git-network",
    route: "/relationships",
    tone: "info"
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate system reports",
    icon: "bar-chart",
    route: "/reports",
    tone: "success"
  },
  {
    id: "search",
    title: "Search",
    description: "Global search",
    icon: "search",
    route: "/search",
    tone: "info"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Profile, access control, and audit logs",
    icon: "settings",
    route: "/settings",
    tone: "default"
  },
  {
    id: "profile",
    title: "Profile",
    description: "Your account and permissions",
    icon: "person-circle",
    route: "/profile",
    tone: "default"
  },
  {
    id: "assets",
    title: "Assets",
    description: "Infrastructure inventory",
    icon: "server",
    route: "/assets",
    tone: "success"
  },
  {
    id: "documents",
    title: "Documents",
    description: "Runbooks and knowledge articles",
    icon: "document-text",
    route: "/documents",
    tone: "info"
  }
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader
          title="Menu"
          subtitle="Everything that doesn't fit in the bottom tabs"
        />

        <View style={styles.promoRow}>
          <Card style={styles.promoCard}>
            <Text style={styles.promoLabel}>Fast access</Text>
            <Text style={styles.promoTitle}>Dashboard, assets, docs, and admin tools</Text>
            <Text style={styles.promoBody}>Use this hub to jump to the full mobile experience without hunting through nested screens.</Text>
          </Card>
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(item.route as never)}
              style={styles.menuItem}
              activeOpacity={0.75}
            >
              <View style={[styles.menuItemIcon, item.tone === "warning" && styles.menuIconWarning, item.tone === "success" && styles.menuIconSuccess, item.tone === "info" && styles.menuIconInfo]}>
                <Ionicons name={item.icon as never} size={22} color={COLORS.primary} />
              </View>

              <View style={styles.menuItemContent}>
                <View style={styles.menuTitleRow}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Badge text="Open" type="default" />
                </View>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          ))}
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

  promoRow: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md
  },

  promoCard: {
    borderColor: COLORS.border,
    borderWidth: 1
  },

  promoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: SPACING.xs
  },

  promoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm
  },

  promoBody: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text.secondary
  },

  menuContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md
  },

  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center"
  },

  menuIconWarning: {
    backgroundColor: "#FFF7ED"
  },

  menuIconSuccess: {
    backgroundColor: "#ECFDF5"
  },

  menuIconInfo: {
    backgroundColor: "#EFF6FF"
  },

  menuItemContent: {
    flex: 1
  },

  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs
  },

  menuItemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },

  menuItemDescription: {
    fontSize: 13,
    color: COLORS.text.secondary
  }
});
