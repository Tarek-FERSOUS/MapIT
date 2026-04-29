import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import { useDebounce } from "../../hooks/useApi";
import { api, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { GlobalSearchResultItem } from "../../types/api";

export default function SearchScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    if (!token) return;

    try {
      setIsLoading(true);
      setError("");
      const response = await api.search.global(debouncedQuery);
      const data = response as { results: GlobalSearchResultItem[] };
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Search failed"));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, token]);

  useEffect(() => {
    performSearch();
  }, [debouncedQuery, performSearch]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login" as never);
      }
    }, [token, router])
  );

  if (!token) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "incident":
        return "alert-circle";
      case "document":
        return "document-text";
      case "asset":
        return "server";
      case "problem":
        return "bug";
      default:
        return "help";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleResultPress = (item: GlobalSearchResultItem) => {
    const routeMap: Record<string, string> = {
      incident: `/incidents/${item.id}`,
      document: `/documents/${item.id}`,
      asset: `/assets/${item.id}`,
      problem: `/problems/${item.id}`
    };

    const route = routeMap[item.type];
    if (route) {
      router.push(route as never);
    }
  };

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title="Search" subtitle="Find incidents, documents, assets, and problems" />

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search everything..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={COLORS.text.tertiary}
            autoFocus
          />
          {query && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <ErrorAlert message={error} onDismiss={() => setError("")} />
          </View>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : !searched ? (
          <EmptyState
            title="Enter a search query"
            description="Search across all incidents, documents, assets, and problems"
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No results found"
            description={`No results for "${query}"`}
          />
        ) : (
          <>
            <Text style={styles.resultCount}>
              Found {results.length} result{results.length !== 1 ? "s" : ""}
            </Text>

            <FlatList
              scrollEnabled={false}
              data={results}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleResultPress(item)}>
                  <Card>
                    <View style={styles.resultRow}>
                      <View style={styles.resultIcon}>
                        <Ionicons name={getIcon(item.type)} size={20} color={COLORS.primary} />
                      </View>

                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>{item.title}</Text>
                        {item.subtitle && (
                          <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                        )}
                        <Text style={styles.resultType}>
                          {getTypeLabel(item.type)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
            />
          </>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background
  },

  searchIcon: {
    marginRight: SPACING.md
  },

  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary
  },

  clearButton: {
    padding: SPACING.sm
  },

  errorContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },

  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textTransform: "uppercase",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md
  },

  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center"
  },

  resultInfo: {
    flex: 1
  },

  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },

  resultSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs
  },

  resultType: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase"
  }
});
