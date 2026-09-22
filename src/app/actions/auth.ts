"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSafeRedirectUrl } from "@/lib/auth";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Customer Sign-In Server Action
 */
export async function customerLoginAction(
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const rawNext = String(formData.get("next") || "");

    if (!email || !password) {
      return { success: false, error: "Please provide both email and password." };
    }

    const supabase = await createServerClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Return generic failure message to avoid account enumeration
      return {
        success: false,
        error: "Invalid email or password. Please verify your credentials and try again.",
      };
    }

    const redirectUrl = getSafeRedirectUrl(rawNext, "/account");

    revalidatePath("/account");
    revalidatePath("/");

    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return { success: false, error: message };
  }
}

/**
 * Customer Sign-Up Server Action
 */
export async function customerSignupAction(
  formData: FormData
): Promise<
  ActionResult<{ needsEmailConfirmation?: boolean; redirectUrl?: string }>
> {
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const rawNext = String(formData.get("next") || "");

    if (!email) {
      return { success: false, error: "Email address is required." };
    }

    if (!fullName) {
      return { success: false, error: "Full name is required." };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters in length.",
      };
    }

    const supabase = await createServerClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    // Check if session is already active (e.g. Email confirmation disabled in Supabase)
    if (data.session) {
      const redirectUrl = getSafeRedirectUrl(rawNext, "/account");
      revalidatePath("/account");
      revalidatePath("/");
      return {
        success: true,
        data: { redirectUrl },
      };
    }

    // Email confirmation is required by Supabase project settings
    return {
      success: true,
      data: { needsEmailConfirmation: true },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration error";
    return { success: false, error: message };
  }
}

/**
 * Customer Sign-Out Server Action
 */
export async function customerLogoutAction(): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();

    revalidatePath("/");
    revalidatePath("/account");
    revalidatePath("/shop");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sign out error";
    return { success: false, error: message };
  }
}
