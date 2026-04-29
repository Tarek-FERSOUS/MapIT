import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  SafeAreaContainer,
  SectionHeader,
  LoadingSpinner,
  ErrorAlert,
  Button,
  Card,
  StatusBadge,
  Divider,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { useQuery } from "../../hooks/useApi";
import { api } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";

interface ProblemParams {
  id: string;
}

export default function ProblemDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ProblemParams>();
  const token = useAuthStore((state) => state.token);

  const id = params?.id as string;

  const { data: problem, isLoading, error, refetch } = useQuery(
    () => api.problems.get(id),
    [id, token]
  );

  useFocusEffect(
    useCallback(() => {
      if (token && id) {
        refetch();
      }
    }, [token, id, refetch])
  );

  if (!token || !id) return null;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!problem) return <ErrorAlert message="Problem not found" />;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title={problem.title} subtitle="Problem Details" />

        <View style={styles.contentContainer}>
          <Card>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Severity</Text>
              <StatusBadge status={problem.severity} type="problem" />
            </View>

            <Divider />

            <View style={styles.statusSection}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{problem.status}</Text>
            </View>
          </Card>

          <Card>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>{problem.description}</Text>
          </Card>

          {problem.solution && (
            <Card>
              <Text style={styles.label}>Solution</Text>
              <Text style={styles.solution}>{problem.solution}</Text>
            </Card>
          )}

          {problem.affectedAssets && problem.affectedAssets.length > 0 && (
            <Card>
              <Text style={styles.label}>Affected Assets</Text>
              <View style={styles.assetsList}>
                {problem.affectedAssets.map((asset, idx) => (
                  <Text key={idx} style={styles.assetItem}>
                    • {asset}
                  </Text>
                ))}
              </View>
            </Card>
          )}

          {problem.resolvedAt && (
            <Card>
              <Text style={styles.label}>Resolved At</Text>
              <Text style={styles.value}>{new Date(problem.resolvedAt).toLocaleString()}</Text>
            </Card>
          )}

          <Divider />

          <View style={styles.actionsContainer}>
            <Button
              title="Edit Problem"
              variant="primary"
              full
              onPress={() => router.push(`/problems/${id}/edit` as never)}
            />

            <Button
              title="Go Back"
              variant="secondary"
              full
              onPress={() => router.back()}
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
    paddingBottom: SPACING.xl
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md
  },

  statusSection: {
    marginTop: SPACING.md
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary
  },

  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 21,
    marginVertical: SPACING.md
  },

  solution: {
    fontSize: 14,
    color: COLORS.status.success,
    lineHeight: 21,
    fontWeight: "500",
    marginVertical: SPACING.md,
    backgroundColor: COLORS.status.success + "10",
    padding: SPACING.md,
    borderRadius: 6
  },

  assetsList: {
    marginTop: SPACING.md,
    gap: SPACING.sm
  },

  assetItem: {
    fontSize: 14,
    color: COLORS.text.secondary
  },

  actionsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.xl
  }
});
