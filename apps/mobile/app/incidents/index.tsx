import { useCallback, useEffect, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

function IncidentItem({ item }) {
  return (
    <Link href={`/incidents/${item.id}` as never} asChild>
      <Pressable
        style={{
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 8,
          padding: 12,
          marginBottom: 10
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
        <Text style={{ color: "#475569", marginTop: 4 }}>{item.description}</Text>
        <Text style={{ color: "#64748B", marginTop: 8, fontSize: 12 }}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function IncidentsScreen() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await api.get("/incidents");
      setItems(res.data.items || []);
    } catch {
      setError("Failed to load incidents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }

    loadIncidents();
  }, [token, loadIncidents]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadIncidents();
      }
    }, [token, loadIncidents])
  );

  if (!token) {
    return null;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Incidents</Text>
        <Link href={"/incidents/new" as never} style={{ color: "#1E40AF", marginTop: 6 }}>
          + New
        </Link>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          {error ? <Text style={{ color: "#B91C1C", marginBottom: 8 }}>{error}</Text> : null}

          {!items.length && !error ? (
            <Text style={{ color: "#475569" }}>No incidents yet.</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <IncidentItem item={item} />}
            />
          )}
        </>
      )}

      <Pressable
        onPress={loadIncidents}
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: "#CBD5E1",
          paddingVertical: 10,
          borderRadius: 6,
          alignItems: "center"
        }}
      >
        <Text>Refresh</Text>
      </Pressable>
    </View>
  );
}
