import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Text
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaContainer,
  SectionHeader,
  Input,
  Button,
  ErrorAlert,
  SuccessAlert,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { useForm, useMutation } from "../../hooks/useApi";
import { api } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../services/apiClient";

interface AssetFormData {
  name: string;
  type: string;
  ipAddress: string;
  location: string;
  status: string;
  os: string;
  cpu: string;
  memory: string;
  tags: string;
}

const ASSET_TYPES = ["Server", "Workstation", "Network", "Storage", "Printer", "Other"];
const ASSET_STATUSES = ["Active", "Inactive", "Maintenance", "Decommissioned"];

export default function CreateAssetScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [showSuccess, setShowSuccess] = useState(false);

  const { execute: handleSubmit, isLoading, error } = useMutation(
    async () => {
      const tagsArray = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      return api.assets.create({
        name: values.name,
        type: values.type,
        ipAddress: values.ipAddress || undefined,
        location: values.location || undefined,
        status: values.status,
        os: values.os || undefined,
        cpu: values.cpu || undefined,
        memory: values.memory || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined
      });
    },
    {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/assets" as never);
        }, 1500);
      }
    }
  );

  const { values, errors, handleChangeField, isSubmitting } = useForm<AssetFormData>(
    {
      name: "",
      type: ASSET_TYPES[0],
      ipAddress: "",
      location: "",
      status: ASSET_STATUSES[0],
      os: "",
      cpu: "",
      memory: "",
      tags: ""
    },
    handleSubmit
  );

  if (!token) return null;

  const onSubmit = async () => {
    if (!values.name.trim()) {
      Alert.alert("Validation Error", "Asset name is required");
      return;
    }
    await handleSubmit();
  };

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title="Create Asset" subtitle="Add a new asset to inventory" />

        <View style={styles.contentContainer}>
          {error && (
            <ErrorAlert
              message={getApiErrorMessage(error)}
              onDismiss={() => {}}
            />
          )}

          {showSuccess && (
            <SuccessAlert
              message="Asset created successfully!"
              onDismiss={() => setShowSuccess(false)}
            />
          )}

          <Input
            label="Asset Name *"
            placeholder="e.g., Server-01"
            value={values.name}
            onChangeText={(text) => handleChangeField("name", text)}
            error={errors.name}
          />

          <View>
            <Text style={styles.label}>Asset Type *</Text>
            <View style={styles.typeGrid}>
              {ASSET_TYPES.map((type) => (
                <Button
                  key={type}
                  title={type}
                  variant={values.type === type ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => handleChangeField("type", type)}
                />
              ))}
            </View>
          </View>

          <Input
            label="IP Address"
            placeholder="192.168.1.100"
            value={values.ipAddress}
            onChangeText={(text) => handleChangeField("ipAddress", text)}
            keyboardType="numeric"
          />

          <Input
            label="Location"
            placeholder="e.g., Building A, Floor 3"
            value={values.location}
            onChangeText={(text) => handleChangeField("location", text)}
          />

          <View>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.statusGrid}>
              {ASSET_STATUSES.map((status) => (
                <Button
                  key={status}
                  title={status}
                  variant={values.status === status ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => handleChangeField("status", status)}
                />
              ))}
            </View>
          </View>

          <Input
            label="Operating System"
            placeholder="e.g., Ubuntu 22.04"
            value={values.os}
            onChangeText={(text) => handleChangeField("os", text)}
          />

          <Input
            label="CPU"
            placeholder="e.g., Intel Xeon 2x8 core"
            value={values.cpu}
            onChangeText={(text) => handleChangeField("cpu", text)}
          />

          <Input
            label="Memory"
            placeholder="e.g., 64 GB"
            value={values.memory}
            onChangeText={(text) => handleChangeField("memory", text)}
          />

          <Input
            label="Tags (comma-separated)"
            placeholder="e.g., production,critical,web-server"
            value={values.tags}
            onChangeText={(text) => handleChangeField("tags", text)}
            multiline
            numberOfLines={2}
          />

          <View style={styles.actions}>
            <Button
              title={isSubmitting ? "Creating..." : "Create Asset"}
              variant="primary"
              full
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={onSubmit}
            />

            <Button
              title="Cancel"
              variant="secondary"
              full
              disabled={isSubmitting}
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

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg
  },

  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.lg
  },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.lg
  },

  actions: {
    gap: SPACING.md,
    marginTop: SPACING.xl
  }
});
