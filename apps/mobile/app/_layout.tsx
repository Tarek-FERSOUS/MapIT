import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="index" options={{ title: "MapIT" }} />
      <Stack.Screen name="incidents/index" options={{ title: "Incidents" }} />
      <Stack.Screen name="incidents/new" options={{ title: "New Incident" }} />
      <Stack.Screen name="incidents/[id]" options={{ title: "Incident" }} />
      <Stack.Screen name="documents/index" options={{ title: "Documents" }} />
      <Stack.Screen name="documents/new" options={{ title: "New Document" }} />
      <Stack.Screen name="documents/[id]" options={{ title: "Document" }} />
    </Stack>
  );
}