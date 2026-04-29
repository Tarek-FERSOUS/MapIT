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
import { apiClient, getApiErrorMessage, api } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { Asset } from "../../types/api";
import { truncate } from "../../utils/formatting";

export default function AssetsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const canCreate = useAuthStore((state) => state.canAccess("asset", "create"));

  const [items, setItems] = useState<Asset[]>([]);
  const [filteredItems, setFilteredItems] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await api.assets.list({
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      const data = response as { items: Asset[] };
      setItems(data.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load assets"));
    } finally {
      setIsLoading(false);
    }
  }, [token, typeFilter, statusFilter, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  }, [loadAssets]);

  useEffect(() => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }
    loadAssets();
  }, [token, loadAssets]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadAssets();
      }
    }, [token, loadAssets])
  );

  // Filter assets based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = search.toLowerCase();
    setFilteredItems(
      items.filter((item) =>
        [item.name, item.type, item.ipAddress, item.location].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      )
    );
  }, [items, search]);

  if (!token) {
    return null;
  }

  return (
    <SafeAreaContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.container}
      >
        <SectionHeader
          title="Assets"
          subtitle="Infrastructure inventory"
          action={
            canCreate && (
              <Link href="/assets/new" asChild>
                <Button title="+ New" variant="primary" size="sm" onPress={() => {}} />
              </Link>
            )
          }
        />

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search assets..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.text.tertiary}
          />
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
            title={search ? "No matching assets" : "No assets yet"}
            description={search ? "Try a different keyword" : "Create your first asset to get started"}
          />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Link href={`/assets/${item.id}` as never} asChild>
                <Card onPress={() => router.push(`/assets/${item.id}` as never)}>
                  <View style={styles.assetHeader}>
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetName}>{item.name}</Text>
                      <Text style={styles.assetType}>{item.type}</Text>
                    </View>
                    <StatusBadge status={item.status} type="asset" />
                  </View>

                  {item.ipAddress && (
                    <Text style={styles.assetDetail}>IP: {item.ipAddress}</Text>
                  )}

                  {item.location && (
                    <Text style={styles.assetDetail}>Location: {item.location}</Text>
                  )}

                  {item.os && (
                    <Text style={styles.assetDetail}>OS: {item.os}</Text>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <Text key={idx} style={styles.tag}>
                          {tag}
                        </Text>
                      ))}
                      {item.tags.length > 3 && (
                        <Text style={styles.tag}>+{item.tags.length - 3}</Text>
                      )}
                    </View>
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

  errorContainer: {
    paddingHorizontal: SPACING.lg
  },

  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md
  },

  assetInfo: {
    flex: 1
  },

  assetName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },

  assetType: {
    fontSize: 14,
    color: COLORS.text.secondary
  },

  assetDetail: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginVertical: SPACING.xs
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: SPACING.md,
    gap: SPACING.sm
  },

  tag: {
    fontSize: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    overflow: "hidden"
  }
});
