import { Suspense } from "react";
import { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | DOMPI Studio",
  description: "Secure administrator sign-in for DOMPI catalog and inventory management.",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<div className="text-xs uppercase font-bold text-neutral-400">Loading sign-in console...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
