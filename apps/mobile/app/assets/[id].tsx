import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";
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
import { useQuery, useMutation } from "../../hooks/useApi";
import { api } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { formatDate } from "../../utils/formatting";

interface AssetParams {
  id: string;
}

export default function AssetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<AssetParams>();
  const token = useAuthStore((state) => state.token);
  const canEdit = useAuthStore((state) => state.canAccess("asset", "update"));
  const canDelete = useAuthStore((state) => state.canAccess("asset", "delete"));

  const id = params?.id as string;

  const { data: asset, isLoading, error, refetch } = useQuery(
    () => api.assets.get(id),
    [id, token]
  );

  const { execute: handleDelete, isLoading: isDeleting } = useMutation(
    () => api.assets.delete(id),
    {
      onSuccess: () => {
        Alert.alert("Success", "Asset deleted successfully", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    }
  );

  useFocusEffect(
    useCallback(() => {
      if (token && id) {
        refetch();
      }
    }, [token, id, refetch])
  );

  const confirmDelete = () => {
    Alert.alert(
      "Delete Asset",
      "Are you sure you want to delete this asset? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete()
        }
      ]
    );
  };

  if (!token || !id) return null;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!asset) return <ErrorAlert message="Asset not found" />;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title={asset.name} subtitle={asset.type} />

        <View style={styles.contentContainer}>
          <Card>
            <View style={styles.headerRow}>
              <Text style={styles.label}>Status</Text>
              <StatusBadge status={asset.status} type="asset" />
            </View>
          </Card>

          {asset.ipAddress && (
            <Card>
              <Text style={styles.label}>IP Address</Text>
              <Text style={styles.value}>{asset.ipAddress}</Text>
            </Card>
          )}

          {asset.location && (
            <Card>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{asset.location}</Text>
            </Card>
          )}

          {asset.os && (
            <Card>
              <Text style={styles.label}>Operating System</Text>
              <Text style={styles.value}>{asset.os}</Text>
            </Card>
          )}

          {asset.cpu && (
            <Card>
              <Text style={styles.label}>CPU</Text>
              <Text style={styles.value}>{asset.cpu}</Text>
            </Card>
          )}

          {asset.memory && (
            <Card>
              <Text style={styles.label}>Memory</Text>
              <Text style={styles.value}>{asset.memory}</Text>
            </Card>
          )}

          {asset.tags && asset.tags.length > 0 && (
            <Card>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsContainer}>
                {asset.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {asset.createdAt && (
            <Card>
              <Text style={styles.label}>Created</Text>
              <Text style={styles.value}>{formatDate(asset.createdAt)}</Text>
            </Card>
          )}

          <Divider />

          <View style={styles.actionsContainer}>
            {canEdit && (
              <Button
                title="Edit Asset"
                variant="primary"
                full
                onPress={() => router.push(`/assets/${id}/edit` as never)}
              />
            )}

            {canDelete && (
              <Button
                title={isDeleting ? "Deleting..." : "Delete Asset"}
                variant="danger"
                full
                loading={isDeleting}
                disabled={isDeleting}
                onPress={confirmDelete}
              />
            )}

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
    alignItems: "center"
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginVertical: SPACING.xs
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md
  },

  tagBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  tagText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: "500"
  },

  actionsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.xl
  }
});
