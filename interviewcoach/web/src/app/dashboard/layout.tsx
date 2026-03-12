import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
