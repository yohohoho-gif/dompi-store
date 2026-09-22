import { Suspense } from "react";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | DOMPI Customer Archive",
  description: "Sign in to your DOMPI customer account to access your profile and streamlined shopping.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-20 px-4">
        <Suspense
          fallback={
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Loading sign in form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
