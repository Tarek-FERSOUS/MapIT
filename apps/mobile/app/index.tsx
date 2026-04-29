import { Redirect } from "expo-router";

import { useAuthStore } from "../store/authStore";

export default function Home() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
