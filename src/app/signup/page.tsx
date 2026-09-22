import { Suspense } from "react";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account | DOMPI Customer Archive",
  description: "Register for an official DOMPI account for streamlined checkout and archival updates.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-20 px-4">
        <Suspense
          fallback={
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Loading registration form...
            </div>
          }
        >
          <SignupForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
