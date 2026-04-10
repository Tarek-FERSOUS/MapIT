import SidebarLayout from "@/components/layout/sidebar-layout";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
