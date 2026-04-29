// This screen serves as a tab entry point for documents
// It redirects to the main documents list screen

import { Redirect } from "expo-router";

export default function DocumentsTabScreen() {
  return <Redirect href="/documents" />;
}
