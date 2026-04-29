import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { COLORS } from "@/components/ui/common";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 4
        },
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.background,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons size={23} name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Incidents",
          tabBarIcon: ({ color }) => <Ionicons size={23} name="alert-circle" color={color} />,
          href: '/incidents'
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Docs",
          tabBarIcon: ({ color }) => <Ionicons size={23} name="document-text" color={color} />,
          href: '/documents'
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: "Assets",
          tabBarIcon: ({ color }) => <Ionicons size={23} name="server" color={color} />,
          href: '/assets'
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Menu",
          tabBarIcon: ({ color }) => <Ionicons size={23} name="menu" color={color} />
        }}
      />
    </Tabs>
  );
}
