import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Share
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  SafeAreaContainer,
  SectionHeader,
  Button,
  Card,
  LoadingSpinner,
  ErrorAlert,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { useMutation } from "../../hooks/useApi";
import { api, getApiErrorMessage } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";

interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
}

const AVAILABLE_REPORTS: Report[] = [
  {
    id: "incident-summary",
    title: "Incident Summary",
    description: "Overview of all incidents, status distribution, and trends",
    type: "incident"
  },
  {
    id: "asset-inventory",
    title: "Asset Inventory",
    description: "Complete list of all assets with status and details",
    type: "asset"
  },
  {
    id: "problem-analysis",
    title: "Problem Analysis",
    description: "Problems and their solutions with affected assets",
    type: "problem"
  },
  {
    id: "resolution-time",
    title: "Resolution Time Analytics",
    description: "Average resolution times and performance metrics",
    type: "incident"
  },
  {
    id: "asset-health",
    title: "Asset Health Report",
    description: "Asset status distribution and maintenance schedule",
    type: "asset"
  }
];

export default function ReportsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const { execute: generateReport, isLoading } = useMutation(
    async () => {
      if (!selectedReport) throw new Error("No report selected");
      const response = await api.reports.generate(selectedReport);
      return response;
    },
    {
      onSuccess: (data) => {
        // In a real app, this would be the report data
        // For now, we'll just show a success message
        setSelectedReport(null);
      }
    }
  );

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace("/login" as never);
      }
    }, [token, router])
  );

  if (!token) return null;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader
          title="Reports"
          subtitle="Generate and view system reports"
        />

        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
          <Text style={styles.sectionDescription}>
            Select a report to generate a detailed analysis
          </Text>

          <FlatList
            scrollEnabled={false}
            data={AVAILABLE_REPORTS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card
                onPress={() => setSelectedReport(item.id)}
                style={[
                  styles.reportCard,
                  selectedReport === item.id && styles.reportCardSelected
                ]}
              >
                <View style={styles.reportCardContent}>
                  <Text style={styles.reportTitle}>{item.title}</Text>
                  <Text style={styles.reportDescription}>{item.description}</Text>

                  <View style={styles.reportMeta}>
                    <Text style={styles.reportType}>{item.type}</Text>
                  </View>
                </View>

                {selectedReport === item.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Card>
            )}
          />

          <View style={styles.actions}>
            {selectedReport && (
              <>
                <Button
                  title={isLoading ? "Generating..." : "Generate Report"}
                  variant="primary"
                  full
                  loading={isLoading}
                  disabled={isLoading}
                  onPress={() => generateReport()}
                />

                <Button
                  title="Clear Selection"
                  variant="secondary"
                  full
                  disabled={isLoading}
                  onPress={() => setSelectedReport(null)}
                />
              </>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Report Tips</Text>
            <Text style={styles.infoText}>
              • Reports are generated in real-time based on current data{"\n"}
              • Results are available in PDF and CSV formats{"\n"}
              • Large reports may take a few moments to generate{"\n"}
              • You can schedule reports to be generated automatically
            </Text>
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm
  },

  sectionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg
  },

  reportCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border
  },

  reportCardSelected: {
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.surface
  },

  reportCardContent: {
    flex: 1
  },

  reportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },

  reportDescription: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md
  },

  reportMeta: {
    flexDirection: "row",
    gap: SPACING.md
  },

  reportType: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text.tertiary,
    textTransform: "uppercase",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4
  },

  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },

  checkmarkText: {
    color: COLORS.text.inverse,
    fontSize: 18,
    fontWeight: "bold"
  },

  actions: {
    gap: SPACING.md,
    marginTop: SPACING.xl
  },

  infoBox: {
    backgroundColor: COLORS.status.info + "10",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.status.info,
    padding: SPACING.lg,
    marginTop: SPACING.xl
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
  }
});
