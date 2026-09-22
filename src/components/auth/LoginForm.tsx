"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerLoginAction } from "@/app/actions/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "Verification link expired or invalid. Please sign in with your credentials."
      : null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("next", nextPath);

      const result = await customerLoginAction(formData);

      if (result.success && result.data?.redirectUrl) {
        router.push(result.data.redirectUrl);
        router.refresh();
      } else {
        setErrorMessage(
          result.error || "Authentication failed. Please verify your credentials."
        );
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">
          DOMPI ARCHIVAL
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          CUSTOMER SIGN IN
        </h1>
        <p className="mt-2 text-xs text-neutral-500 max-w-xs mx-auto">
          Access your personal account profile, manage your session, and streamline your shopping experience.
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
            htmlFor="customer-email"
            className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
          >
            Email Address
          </label>
          <input
            id="customer-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-[8px] text-sm text-black placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="customer-password"
              className="block text-xs font-bold uppercase tracking-wider text-black"
            >
              Password
            </label>
          </div>
          <input
            id="customer-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-[8px] text-sm text-black placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-[8px] disabled:opacity-50 transition-colors shadow-sm"
        >
          {isPending ? "Signing In..." : "Sign In to Account"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col gap-2 text-center text-xs text-neutral-500">
        <div>
          New to DOMPI?{" "}
          <Link
            href={`/signup${nextPath !== "/account" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
            className="font-bold text-black underline underline-offset-4 hover:opacity-75"
          >
            Create an Account
          </Link>
        </div>
        <div>
          <Link
            href="/shop"
            className="font-medium text-neutral-400 hover:text-black transition-colors"
          >
            &larr; Continue browsing as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
