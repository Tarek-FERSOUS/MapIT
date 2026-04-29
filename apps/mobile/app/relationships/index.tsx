import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  SectionHeader,
  Card,
  SafeAreaContainer,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { useQuery } from "../../hooks/useApi";
import { api, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { Relationship } from "../../types/api";

export default function RelationshipsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    () => api.relationships.list(),
    [token]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login" as never);
      } else {
        refetch();
      }
    }, [token, router, refetch])
  );

  if (!token) return null;

  const relationships = (data as { items: Relationship[] })?.items || [];

  return (
    <SafeAreaContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.container}
      >
        <SectionHeader
          title="Relationships"
          subtitle="Asset dependencies and connections"
        />

        {error && (
          <View style={styles.errorContainer}>
            <ErrorAlert message={error} onDismiss={() => {}} />
          </View>
        )}

        {isLoading && !relationships.length ? (
          <LoadingSpinner />
        ) : relationships.length === 0 ? (
          <EmptyState
            title="No relationships"
            description="No asset relationships have been defined yet"
          />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={relationships}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card>
                <View style={styles.relationshipContainer}>
                  <View style={styles.assetBox}>
                    <Text style={styles.assetLabel}>From</Text>
                    <Text style={styles.assetName}>{item.sourceAssetId}</Text>
                  </View>

                  <View style={styles.arrow}>
                    <Text style={styles.arrowText}>→</Text>
                    <Text style={styles.relationshipType}>{item.relationshipType}</Text>
                  </View>

                  <View style={styles.assetBox}>
                    <Text style={styles.assetLabel}>To</Text>
                    <Text style={styles.assetName}>{item.targetAssetId}</Text>
                  </View>
                </View>

                {item.label && (
                  <Text style={styles.relationshipLabel}>Label: {item.label}</Text>
                )}
              </Card>
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

  errorContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },

  relationshipContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.md
  },

  assetBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: "center"
  },

  assetLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textTransform: "uppercase",
    marginBottom: SPACING.xs
  },

  assetName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text.primary,
    textAlign: "center"
  },

  arrow: {
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm
  },

  arrowText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: "bold"
  },

  relationshipType: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text.secondary,
    textTransform: "uppercase"
  },

  relationshipLabel: {
    marginTop: SPACING.md,
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: "500"
  }
});
