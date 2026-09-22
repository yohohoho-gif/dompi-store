"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { customerSignupAction } from "@/app/actions/auth";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("next", nextPath);

      const result = await customerSignupAction(formData);

      if (result.success) {
        if (result.data?.needsEmailConfirmation) {
          setNeedsConfirmation(true);
        } else if (result.data?.redirectUrl) {
          router.push(result.data.redirectUrl);
          router.refresh();
        }
      } else {
        setErrorMessage(
          result.error || "Registration failed. Please check your information."
        );
      }
    });
  };

  if (needsConfirmation) {
    return (
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm text-center">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-black mb-2">
          Verify Your Email
        </h2>
        <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
          We have sent a verification link to <strong className="text-black font-semibold">{email}</strong>.
          Please click the confirmation link in your email to activate your account.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[6px] hover:bg-neutral-800 transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">
          DOMPI ARCHIVAL
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
          CREATE ACCOUNT
        </h1>
        <p className="mt-2 text-xs text-neutral-500 max-w-xs mx-auto">
          Register with DOMPI to manage your profile, streamline checkout, and receive archival releases.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[8px] text-xs font-bold text-red-700 leading-snug">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="signup-name"
            className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
          >
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-[8px] text-sm text-black placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
          >
            Email Address
          </label>
          <input
            id="signup-email"
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
          <label
            htmlFor="signup-password"
            className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5"
          >
            Password (min 6 characters)
          </label>
          <input
            id="signup-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-[8px] text-sm text-black placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-[8px] disabled:opacity-50 transition-colors shadow-sm mt-2"
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col gap-2 text-center text-xs text-neutral-500">
        <div>
          Already have an account?{" "}
          <Link
            href={`/login${nextPath !== "/account" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
            className="font-bold text-black underline underline-offset-4 hover:opacity-75"
          >
            Sign In
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
