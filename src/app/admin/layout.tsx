"use client";

import { AdminGuard } from "@/components/dashboard/admin/admin-guard";
import { AdminNav } from "@/components/dashboard/admin/admin-nav";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <DashboardLayout>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AdminNav />
            {children}
          </div>
        </main>
      </DashboardLayout>
    </AdminGuard>
  );
}
