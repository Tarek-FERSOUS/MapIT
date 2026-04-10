import SidebarLayout from "@/components/layout/sidebar-layout";

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
