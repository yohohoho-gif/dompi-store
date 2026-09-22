import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface CustomerUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

/**
 * Validates a redirect path against open-redirect attacks.
 * Strictly permits only relative paths starting with a single '/' and disallows protocol-relative URLs ('//').
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/account"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Must start with a single '/' and not start with '//' (protocol-relative)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Prevent backslash evasion (e.g. /\evil.com)
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Disallow javascript:, data:, or other scheme injections
  if (trimmed.toLowerCase().includes("javascript:") || trimmed.toLowerCase().includes("data:")) {
    return fallback;
  }

  return trimmed;
}

/**
 * Server-side route guard for customer-only pages (e.g. /account).
 * Validates the user's session with the Supabase Auth server.
 * If unauthenticated, redirects to /login with a safe 'next' parameter.
 */
export async function requireCustomer(currentPath = "/account") {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const safeNext = encodeURIComponent(getSafeRedirectUrl(currentPath, "/account"));
    redirect(`/login?next=${safeNext}`);
  }

  const fullName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "Customer";

  const customer: CustomerUser = {
    id: user.id,
    email: user.email || "",
    fullName,
    createdAt: user.created_at,
  };

  return { user, customer, supabase };
}

/**
 * Safe server-side helper to get the currently authenticated customer without redirecting.
 * Returns null if the user is a guest.
 */
export async function getCurrentCustomer(): Promise<CustomerUser | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const fullName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Customer";

    return {
      id: user.id,
      email: user.email || "",
      fullName,
      createdAt: user.created_at,
    };
  } catch {
    return null;
  }
}
