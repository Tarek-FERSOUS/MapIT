import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Auth */}
      <Stack.Screen name="login" options={{ headerShown: false, animationEnabled: false }} />

      {/* Main App */}
      <Stack.Screen name="index" options={{ headerShown: false, animationEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Incidents */}
      <Stack.Screen name="incidents/index" options={{ title: "Incidents" }} />
      <Stack.Screen name="incidents/new" options={{ title: "New Incident" }} />
      <Stack.Screen name="incidents/[id]" options={{ title: "Incident Details" }} />

      {/* Documents */}
      <Stack.Screen name="documents/index" options={{ title: "Documents" }} />
      <Stack.Screen name="documents/new" options={{ title: "New Document" }} />
      <Stack.Screen name="documents/[id]" options={{ title: "Document Details" }} />

      {/* Assets */}
      <Stack.Screen name="assets/index" options={{ title: "Assets" }} />
      <Stack.Screen name="assets/new" options={{ title: "Create Asset" }} />
      <Stack.Screen name="assets/[id]" options={{ title: "Asset Details" }} />
      <Stack.Screen name="assets/[id]/edit" options={{ title: "Edit Asset" }} />

      {/* Problems */}
      <Stack.Screen name="problems/index" options={{ title: "Problems" }} />
      <Stack.Screen name="problems/new" options={{ title: "Create Problem" }} />
      <Stack.Screen name="problems/[id]" options={{ title: "Problem Details" }} />
      <Stack.Screen name="problems/[id]/edit" options={{ title: "Edit Problem" }} />

      {/* Relationships */}
      <Stack.Screen name="relationships/index" options={{ title: "Asset Relationships" }} />

      {/* Reports */}
      <Stack.Screen name="reports/index" options={{ title: "Reports" }} />

      {/* Settings */}
      <Stack.Screen name="settings/index" options={{ title: "Settings" }} />

      {/* Profile */}
      <Stack.Screen name="profile" options={{ title: "Profile" }} />

      {/* Search */}
      <Stack.Screen name="search/index" options={{ title: "Search" }} />

      {/* Modal */}
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}