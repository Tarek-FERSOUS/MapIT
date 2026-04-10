import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

type Incident = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.token);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }

    if (!id) {
      setError("Invalid incident ID");
      setIsLoading(false);
      return;
    }

    const loadIncident = async () => {
      try {
        setIsLoading(true);
        setError("");

        const res = await api.get(`/incidents/${id}`);
        setIncident(res.data);
      } catch {
        setError("Failed to load incident");
      } finally {
        setIsLoading(false);
      }
    };

    loadIncident();
  }, [token, id]);

  if (!token) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "#B91C1C", fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "#475569", fontSize: 16 }}>Incident not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 8 }}>{incident.title}</Text>
      <Text style={{ color: "#64748B", marginBottom: 16, fontSize: 12 }}>
        {new Date(incident.createdAt).toLocaleString()}
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 24, color: "#1E293B" }}>{incident.description}</Text>
    </ScrollView>
  );
}
