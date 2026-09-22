import { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "DOMPI Studio Admin Console",
  description: "Administrative catalog, inventory, and variant control dashboard.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col antialiased">
      <AdminHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-neutral-200 bg-white py-4 text-center text-xs text-neutral-400">
        DOMPI Streetwear &bull; Administrative Systems v1.0 &bull; Connected to PostgreSQL
      </footer>
    </div>
  );
}
