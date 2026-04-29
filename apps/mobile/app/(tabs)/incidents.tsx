// This screen serves as a tab entry point for incidents
// It redirects to the main incidents list screen

import { Redirect } from "expo-router";

export default function IncidentsTabScreen() {
  return <Redirect href="/incidents" />;
}
