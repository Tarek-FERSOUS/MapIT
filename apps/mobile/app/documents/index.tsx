import { useCallback, useEffect, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

type Document = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

function DocumentItem({ item }: { item: Document }) {
  return (
    <Link href={`/documents/${item.id}` as never} asChild>
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
        <Text style={{ color: "#64748B", marginTop: 8, fontSize: 12 }}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function DocumentsScreen() {
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await api.get("/documents", {
        params: search ? { q: search } : undefined
      });
      setItems(res.data.items || []);
    } catch {
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!token) {
      router.replace("/login" as never);
      return;
    }

    loadDocuments();
  }, [token, loadDocuments]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadDocuments();
      }
    }, [token, loadDocuments])
  );

  if (!token) {
    return null;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Documents</Text>
        <Link href={"/documents/new" as never} style={{ color: "#1E40AF", marginTop: 6 }}>
          + New
        </Link>
      </View>

      <TextInput
        placeholder="Search title/content"
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          borderColor: "#CBD5E1",
          borderRadius: 6,
          padding: 10,
          marginBottom: 12
        }}
      />

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          {error ? <Text style={{ color: "#B91C1C", marginBottom: 8 }}>{error}</Text> : null}

          {!items.length && !error ? (
            <Text style={{ color: "#475569" }}>No documents yet.</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <DocumentItem item={item} />}
            />
          )}
        </>
      )}

      <Pressable
        onPress={loadDocuments}
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
