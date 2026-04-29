import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput as RNTextInput
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaContainer,
  SectionHeader,
  Button,
  Input,
  Card,
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  COLORS,
  SPACING,
  Badge
} from "../../components/ui/common";
import { useMutation } from "../../hooks/useApi";
import { api, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";

const SEVERITY_LEVELS = [
  { id: "LOW", label: "Low", color: COLORS.status.success },
  { id: "MEDIUM", label: "Medium", color: COLORS.status.warning },
  { id: "HIGH", label: "High", color: "#FF9800" },
  { id: "CRITICAL", label: "Critical", color: COLORS.status.danger }
];

interface FormData {
  title: string;
  description: string;
  severity: string;
  solution: string;
  affectedAssets: string[];
}

export default function NewProblemScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    severity: "MEDIUM",
    solution: "",
    affectedAssets: []
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [assetInput, setAssetInput] = useState("");

  const { execute: createProblem, isLoading, error } = useMutation(
    () => api.problems.create(formData),
    {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    }
  );

  const handleAddAsset = () => {
    if (assetInput.trim() && !formData.affectedAssets.includes(assetInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        affectedAssets: [...prev.affectedAssets, assetInput.trim()]
      }));
      setAssetInput("");
    }
  };

  const handleRemoveAsset = (asset: string) => {
    setFormData((prev) => ({
      ...prev,
      affectedAssets: prev.affectedAssets.filter((a) => a !== asset)
    }));
  };

  const isFormValid = formData.title.trim() && formData.description.trim();

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Create Problem" subtitle="Add a new problem to the knowledge base" />

        <View style={styles.contentContainer}>
          {error && <ErrorAlert message={getApiErrorMessage(error)} />}
          {showSuccess && <SuccessAlert message="Problem created successfully!" />}

          {/* Title */}
          <View>
            <Text style={styles.label}>Problem Title*</Text>
            <Input
              placeholder="Enter problem title"
              value={formData.title}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
              maxLength={100}
            />
            <Text style={styles.charCount}>{formData.title.length}/100</Text>
          </View>

          {/* Description */}
          <View>
            <Text style={styles.label}>Description*</Text>
            <View style={styles.textAreaContainer}>
              <RNTextInput
                style={styles.textArea}
                placeholder="Describe the problem in detail"
                value={formData.description}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
            <Text style={styles.charCount}>{formData.description.length}/500</Text>
          </View>

          {/* Severity Selection */}
          <View>
            <Text style={styles.label}>Severity Level*</Text>
            <View style={styles.severityGrid}>
              {SEVERITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.severityButton,
                    formData.severity === level.id && styles.severityButtonSelected
                  ]}
                  onPress={() => setFormData((prev) => ({ ...prev, severity: level.id }))}
                >
                  <Badge
                    label={level.label}
                    variant={
                      level.id === "LOW"
                        ? "success"
                        : level.id === "MEDIUM"
                        ? "warning"
                        : level.id === "HIGH"
                        ? "warning"
                        : "danger"
                    }
                  />
                  {formData.severity === level.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={level.color}
                      style={styles.severityCheckmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Solution */}
          <View>
            <Text style={styles.label}>Solution (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <RNTextInput
                style={styles.textArea}
                placeholder="Describe the solution to resolve this problem"
                value={formData.solution}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, solution: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
            <Text style={styles.charCount}>{formData.solution.length}/500</Text>
          </View>

          {/* Affected Assets */}
          <View>
            <Text style={styles.label}>Affected Assets (Optional)</Text>
            <View style={styles.assetInputContainer}>
              <RNTextInput
                style={styles.assetInput}
                placeholder="Enter asset name or ID"
                value={assetInput}
                onChangeText={setAssetInput}
                placeholderTextColor={COLORS.text.tertiary}
              />
              <TouchableOpacity
                style={styles.addAssetButton}
                onPress={handleAddAsset}
                disabled={!assetInput.trim()}
              >
                <Ionicons name="add" size={24} color={COLORS.text.inverse} />
              </TouchableOpacity>
            </View>

            {formData.affectedAssets.length > 0 && (
              <View style={styles.assetsContainer}>
                {formData.affectedAssets.map((asset) => (
                  <View key={asset} style={styles.assetTag}>
                    <Text style={styles.assetTagText}>{asset}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveAsset(asset)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color={COLORS.text.inverse} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Form Validation Info */}
          <Card style={styles.infoBox}>
            <Text style={styles.infoTitle}>📝 Form Tips</Text>
            <Text style={styles.infoText}>
              • Title and description are required{"\n"}
              • Choose an appropriate severity level{"\n"}
              • Solution helps other users resolve the same issue{"\n"}
              • Tag affected assets for better organization
            </Text>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={isLoading ? "Creating..." : "Create Problem"}
              variant="primary"
              full
              loading={isLoading}
              disabled={!isFormValid || isLoading}
              onPress={() => createProblem()}
            />

            <Button
              title="Cancel"
              variant="secondary"
              full
              disabled={isLoading}
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
    paddingBottom: SPACING.xl,
    gap: SPACING.lg
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },

  charCount: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
    textAlign: "right"
  },

  textAreaContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    overflow: "hidden"
  },

  textArea: {
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 100
  },

  severityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md
  },

  severityButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center"
  },

  severityButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10"
  },

  severityCheckmark: {
    marginTop: SPACING.xs
  },

  assetInputContainer: {
    flexDirection: "row",
    gap: SPACING.md
  },

  assetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.surface
  },

  addAssetButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },

  assetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md
  },

  assetTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 16
  },

  assetTagText: {
    fontSize: 13,
    color: COLORS.text.inverse,
    fontWeight: "600"
  },

  infoBox: {
    backgroundColor: COLORS.status.info + "10",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.status.info,
    padding: SPACING.lg
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },

  infoText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20
  },

  actions: {
    gap: SPACING.md,
    marginTop: SPACING.lg
  }
});
