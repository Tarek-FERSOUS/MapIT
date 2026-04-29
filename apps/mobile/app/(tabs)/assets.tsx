// This screen serves as a tab entry point for assets
// It redirects to the main assets list screen

import { Redirect } from "expo-router";

export default function AssetsTabScreen() {
  return <Redirect href="/assets" />;
}
