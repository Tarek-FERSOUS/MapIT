import { useCallback, useEffect, useState } from "react";
import { Link, Redirect } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import api from "../services/api";
import { useAuthStore } from "../store/authStore";

type DashboardSummary = {
  kpis: {
    incidents: number;
    documents: number;
    users: number;
  };
  recentActivity: {
    id: string;
    title: string;
    createdAt: string;
    type: "incident" | "document";
  }[];
};

export default function Home() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/dashboard/summary");
      setSummary(res.data);
    } catch {
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadSummary();
    }
  }, [token, loadSummary]);

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>MapIT Dashboard</Text>
      <Text style={{ marginTop: 6, color: "#475569" }}>Authenticated as: {role || "User"}</Text>

      {isLoading ? (
        <View style={{ marginTop: 24 }}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <View style={{ flex: 1, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: "#64748B", fontSize: 12 }}>Incidents</Text>
              <Text style={{ fontSize: 22, fontWeight: "700" }}>{summary?.kpis.incidents ?? 0}</Text>
            </View>
            <View style={{ flex: 1, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: "#64748B", fontSize: 12 }}>Documents</Text>
              <Text style={{ fontSize: 22, fontWeight: "700" }}>{summary?.kpis.documents ?? 0}</Text>
            </View>
            <View style={{ flex: 1, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 12 }}>
              <Text style={{ color: "#64748B", fontSize: 12 }}>Users</Text>
              <Text style={{ fontSize: 22, fontWeight: "700" }}>{summary?.kpis.users ?? 0}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8 }}>
            Recent Activity
          </Text>

          {!summary?.recentActivity?.length ? (
            <Text style={{ color: "#64748B" }}>No recent activity yet.</Text>
          ) : (
            summary.recentActivity.map((activity) => (
              <Text key={`${activity.type}-${activity.id}`} style={{ marginBottom: 6, color: "#334155" }}>
                {activity.type === "incident" ? "Incident" : "Document"}: {activity.title}
              </Text>
            ))
          )}
        </>
      )}

      <View style={{ marginTop: 24, gap: 12 }}>
        <Link href={"/incidents" as never} style={{ color: "#1E40AF", fontSize: 16, fontWeight: "500" }}>
          → Incidents
        </Link>
        <Link href={"/documents" as never} style={{ color: "#1E40AF", fontSize: 16, fontWeight: "500" }}>
          → Documents
        </Link>
      </View>

      <Pressable
        onPress={clearAuth}
        style={{
          marginTop: 32,
          backgroundColor: "#1E40AF",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 6
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Log Out</Text>
      </Pressable>
    </View>
  );
}
