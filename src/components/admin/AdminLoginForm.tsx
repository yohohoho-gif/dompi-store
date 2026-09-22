"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLoginAction } from "@/app/admin/actions";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await adminLoginAction(formData);

      if (result.success) {
        router.push(nextPath);
        router.refresh();
      } else {
        setErrorMessage(result.error || "Authentication failed. Please check your credentials.");
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">
          DOMPI STUDIO
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          ADMIN AUTHENTICATION
        </h1>
        <p className="mt-2 text-xs text-neutral-500 max-w-xs mx-auto">
          Authorized console access for catalog administration, inventory control, and asset configuration.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[8px] text-xs font-bold text-red-700 leading-snug">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="admin-email"
            className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
          >
            Admin Email Address
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@dompi.store"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-medium text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-[8px] text-xs font-medium text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-[8px] disabled:opacity-50 transition-colors shadow-sm mt-2"
        >
          {isPending ? "Authenticating..." : "Sign In to Console"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
        <span className="text-[11px] text-neutral-400 block">
          Protected by Supabase Auth & PostgreSQL Row Level Security
        </span>
      </div>
    </div>
  );
}
