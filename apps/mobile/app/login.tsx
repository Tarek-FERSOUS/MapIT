import { useState } from "react";
import { Redirect, router } from "expo-router";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { isAxiosError } from "axios";

import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  if (token) {
    return <Redirect href="/incidents" />;
  }

  const onLogin = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setStatus("Submitting...");

      const res = await api.post("/auth/login", {
        username,
        password
      });

      setAuth({
        token: res.data.token,
        role: res.data.role || "User"
      });

      setStatus("Login successful. Redirecting...");
      router.replace("/incidents");
    } catch (e) {
      if (isAxiosError(e)) {
        if (!e.response) {
          setError(`Cannot reach API server at ${api.defaults.baseURL}. Please ensure API is running on port 3000.`);
        } else if (e.response.status === 401) {
          setError("Invalid username or password.");
        } else {
          setError(`Login failed (${e.response.status}).`);
        }
      } else {
        setError("Login failed. Verify your credentials and API URL.");
      }
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>MapIT</Text>
      <Text style={{ color: "#475569", marginBottom: 10 }}>
        Sign in with your Active Directory account
      </Text>

      <TextInput
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 6, padding: 12 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 6, padding: 12 }}
      />

      {error ? <Text style={{ color: "#B91C1C" }}>{error}</Text> : null}
      {status ? <Text style={{ color: "#0369A1" }}>{status}</Text> : null}

      <TouchableOpacity
        onPress={onLogin}
        disabled={isSubmitting}
        style={{
          backgroundColor: isSubmitting ? "#93C5FD" : "#1E40AF",
          borderRadius: 6,
          paddingVertical: 12,
          alignItems: "center"
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: "#64748B", fontSize: 12 }}>API: {String(api.defaults.baseURL || "")}</Text>
    </View>
  );
}