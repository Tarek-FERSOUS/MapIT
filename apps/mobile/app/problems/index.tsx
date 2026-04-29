import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import {
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  SectionHeader,
  Button,
  Card,
  StatusBadge,
  SafeAreaContainer,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { api, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { Problem } from "../../types/api";

export default function ProblemsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const canCreate = useAuthStore((state) => state.canAccess("problem", "create"));

  const [items, setItems] = useState<Problem[]>([]);
  const [filteredItems, setFilteredItems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const loadProblems = useCallback(async () => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await api.problems.list({
        ...(severityFilter && { severity: severityFilter })
      });
      const data = response as { items: Problem[] };
      setItems(data.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load problems"));
    } finally {
      setIsLoading(false);
    }
  }, [token, severityFilter, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProblems();
    setRefreshing(false);
  }, [loadProblems]);

  useEffect(() => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }
    loadProblems();
  }, [token, loadProblems]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadProblems();
      }
    }, [token, loadProblems])
  );

  // Filter problems based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = search.toLowerCase();
    setFilteredItems(
      items.filter((item) =>
        [item.title, item.description, item.solution].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      )
    );
  }, [items, search]);

  if (!token) {
    return null;
  }

  const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  return (
    <SafeAreaContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.container}
      >
        <SectionHeader
          title="Problems"
          subtitle="Knowledge base & solutions"
          action={
            canCreate && (
              <Link href="/problems/new" asChild>
                <Button title="+ New" variant="primary" size="sm" onPress={() => {}} />
              </Link>
            )
          }
        />

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search problems..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.text.tertiary}
          />
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Filter by severity:</Text>
          <View style={styles.filterButtons}>
            <Button
              title="All"
              variant={severityFilter === null ? "primary" : "secondary"}
              size="sm"
              onPress={() => setSeverityFilter(null)}
            />
            {SEVERITIES.map((severity) => (
              <Button
                key={severity}
                title={severity}
                variant={severityFilter === severity ? "primary" : "secondary"}
                size="sm"
                onPress={() => setSeverityFilter(severity)}
              />
            ))}
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <ErrorAlert message={error} onDismiss={() => setError("")} />
          </View>
        )}

        {isLoading && !items.length ? (
          <LoadingSpinner />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={search ? "No matching problems" : "No problems yet"}
            description={search ? "Try a different keyword" : "Create your first problem to get started"}
          />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Link href={`/problems/${item.id}` as never} asChild>
                <Card onPress={() => router.push(`/problems/${item.id}` as never)}>
                  <View style={styles.problemHeader}>
                    <View style={styles.problemInfo}>
                      <Text style={styles.problemTitle}>{item.title}</Text>
                      <Text style={styles.problemDescription}>{item.description}</Text>
                    </View>
                    <StatusBadge status={item.severity} type="problem" />
                  </View>

                  {item.solution && (
                    <Text style={styles.problemSolution}>
                      ✓ Solution available
                    </Text>
                  )}

                  {item.affectedAssets && item.affectedAssets.length > 0 && (
                    <Text style={styles.affectedCount}>
                      Affects {item.affectedAssets.length} asset{item.affectedAssets.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </Card>
              </Link>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },

  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background
  },

  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },

  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textTransform: "uppercase",
    marginBottom: SPACING.md
  },

  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm
  },

  errorContainer: {
    paddingHorizontal: SPACING.lg
  },

  problemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md
  },

  problemInfo: {
    flex: 1,
    marginRight: SPACING.md
  },

  problemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },

  problemDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20
  },

  problemSolution: {
    fontSize: 13,
    color: COLORS.status.success,
    fontWeight: "600",
    marginVertical: SPACING.md
  },

  affectedCount: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: SPACING.md
  }
});
