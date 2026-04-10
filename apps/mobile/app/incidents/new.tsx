import { useState } from "react";
import { router } from "expo-router";
import { Button, Text, TextInput, View } from "react-native";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function NewIncidentScreen() {
  const token = useAuthStore((state) => state.token);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    router.replace("/login" as never);
    return null;
  }

  const onSubmit = async () => {
    if (!title || !description) {
      setError("Title and description are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await api.post("/incidents", {
        title,
        description
      });

      router.replace("/incidents" as never);
    } catch {
      setError("Failed to create incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 4 }}>New Incident</Text>

      <TextInput
        placeholder="Incident title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 6, padding: 12 }}
      />

      <TextInput
        placeholder="Describe the issue"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={6}
        style={{
          borderWidth: 1,
          borderColor: "#CBD5E1",
          borderRadius: 6,
          padding: 12,
          minHeight: 120,
          textAlignVertical: "top"
        }}
      />

      {error ? <Text style={{ color: "#B91C1C" }}>{error}</Text> : null}

      <Button title={isSubmitting ? "Creating..." : "Create Incident"} onPress={onSubmit} />
    </View>
  );
}
