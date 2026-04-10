import SidebarLayout from "@/components/layout/sidebar-layout";

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
