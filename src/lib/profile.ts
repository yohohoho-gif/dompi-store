import { createClient as createServerClient } from "@/lib/supabase/server";

export type AddressLabel = "Home" | "Work" | "Other";

export interface CustomerProfile {
  id: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  label: AddressLabel;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateInput {
  fullName?: string | null;
  phone?: string | null;
}

export interface AddressInput {
  recipientName: string;
  phone: string;
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  label?: AddressLabel;
  isDefault?: boolean;
}

/**
 * Server-side read function to fetch the authenticated customer's profile.
 * Resolves the authenticated user on the server using Supabase Auth.
 * Scopes the query strictly to the authenticated user's ID without accepting
 * external user_id parameters.
 *
 * Returns null if the user is unauthenticated, the profile does not exist,
 * or on database error. Does not perform runtime mutations or upserts.
 */
export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from("customer_profiles")
      .select("id, full_name, phone, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("Error fetching customer profile:", error.message);
      }
      return null;
    }

    return {
      id: data.id,
      fullName: data.full_name,
      phone: data.phone,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error("Unexpected error in getCustomerProfile:", err);
    return null;
  }
}

/**
 * Server-side read function to fetch all addresses for the authenticated customer.
 * Resolves the authenticated user on the server and scopes the query strictly
 * to the authenticated user's ID.
 *
 * Orders addresses with the default address first, followed by most recently
 * updated, then created.
 *
 * Returns an empty array if unauthenticated, no addresses found, or on database error.
 * Does not perform runtime mutations.
 */
export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from("customer_addresses")
      .select(
        "id, user_id, recipient_name, phone, address_line, subdistrict, district, province, postal_code, label, is_default, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error) {
        console.error("Error fetching customer addresses:", error.message);
      }
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      recipientName: item.recipient_name,
      phone: item.phone,
      addressLine: item.address_line,
      subdistrict: item.subdistrict,
      district: item.district,
      province: item.province,
      postalCode: item.postal_code,
      label: (item.label as AddressLabel) || "Home",
      isDefault: Boolean(item.is_default),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err) {
    console.error("Unexpected error in getCustomerAddresses:", err);
    return [];
  }
}
