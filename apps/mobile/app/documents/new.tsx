import { useState } from "react";
import { router } from "expo-router";
import { Button, Text, TextInput, View } from "react-native";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function NewDocumentScreen() {
  const token = useAuthStore((state) => state.token);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    router.replace("/login" as never);
    return null;
  }

  const onSubmit = async () => {
    if (!title || !content) {
      setError("Title and content are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await api.post("/documents", {
        title,
        content
      });

      router.replace("/documents" as never);
    } catch {
      setError("Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 4 }}>New Document</Text>

      <TextInput
        placeholder="Document title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 6, padding: 12 }}
      />

      <TextInput
        placeholder="Document content"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={8}
        style={{
          borderWidth: 1,
          borderColor: "#CBD5E1",
          borderRadius: 6,
          padding: 12,
          minHeight: 160,
          textAlignVertical: "top"
        }}
      />

      {error ? <Text style={{ color: "#B91C1C" }}>{error}</Text> : null}

      <Button title={isSubmitting ? "Creating..." : "Create Document"} onPress={onSubmit} />
    </View>
  );
}
