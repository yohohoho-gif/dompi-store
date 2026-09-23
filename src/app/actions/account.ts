"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { AddressLabel, AddressInput, ProfileUpdateInput } from "@/lib/profile";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^[0-9+() -]{7,25}$/;
const POSTAL_CODE_REGEX = /^[0-9]{5}$/;
const VALID_LABELS = new Set<AddressLabel>(["Home", "Work", "Other"]);

function parseString(val: unknown): string {
  if (typeof val === "string") return val.trim();
  return "";
}

function parseAddressId(
  input: string | FormData | { id?: string; addressId?: string }
): string {
  if (typeof input === "string") return input.trim();
  if (input instanceof FormData) {
    const fromId = input.get("id") ?? input.get("addressId");
    return typeof fromId === "string" ? fromId.trim() : "";
  }
  if (typeof input === "object" && input !== null) {
    return (input.id || input.addressId || "").trim();
  }
  return "";
}

interface ValidatedAddressFields {
  recipientName: string;
  phone: string;
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  label: AddressLabel;
}

function validateAddressFields(
  payload: FormData | AddressInput
): { valid: true; data: ValidatedAddressFields } | { valid: false; error: string } {
  let recipientName = "";
  let phone = "";
  let addressLine = "";
  let subdistrict = "";
  let district = "";
  let province = "";
  let postalCode = "";
  let labelRaw = "";

  if (payload instanceof FormData) {
    recipientName = parseString(payload.get("recipientName") ?? payload.get("recipient_name"));
    phone = parseString(payload.get("phone"));
    addressLine = parseString(payload.get("addressLine") ?? payload.get("address_line"));
    subdistrict = parseString(payload.get("subdistrict"));
    district = parseString(payload.get("district"));
    province = parseString(payload.get("province"));
    postalCode = parseString(payload.get("postalCode") ?? payload.get("postal_code"));
    labelRaw = parseString(payload.get("label"));
  } else if (typeof payload === "object" && payload !== null) {
    recipientName = parseString(payload.recipientName);
    phone = parseString(payload.phone);
    addressLine = parseString(payload.addressLine);
    subdistrict = parseString(payload.subdistrict);
    district = parseString(payload.district);
    province = parseString(payload.province);
    postalCode = parseString(payload.postalCode);
    labelRaw = parseString(payload.label);
  } else {
    return { valid: false, error: "Invalid form payload." };
  }

  if (!recipientName || recipientName.length < 2) {
    return { valid: false, error: "Recipient name must be at least 2 characters." };
  }
  if (recipientName.length > 100) {
    return { valid: false, error: "Recipient name cannot exceed 100 characters." };
  }

  if (!phone || !PHONE_REGEX.test(phone)) {
    return { valid: false, error: "Please enter a valid phone number (7 to 25 characters, digits, +, -)." };
  }

  if (!addressLine || addressLine.length < 5) {
    return { valid: false, error: "Address line must be at least 5 characters." };
  }
  if (addressLine.length > 250) {
    return { valid: false, error: "Address line cannot exceed 250 characters." };
  }

  if (!subdistrict || subdistrict.length < 2) {
    return { valid: false, error: "Subdistrict is required (at least 2 characters)." };
  }
  if (subdistrict.length > 100) {
    return { valid: false, error: "Subdistrict cannot exceed 100 characters." };
  }

  if (!district || district.length < 2) {
    return { valid: false, error: "District is required (at least 2 characters)." };
  }
  if (district.length > 100) {
    return { valid: false, error: "District cannot exceed 100 characters." };
  }

  if (!province || province.length < 2) {
    return { valid: false, error: "Province is required (at least 2 characters)." };
  }
  if (province.length > 100) {
    return { valid: false, error: "Province cannot exceed 100 characters." };
  }

  if (!postalCode || !POSTAL_CODE_REGEX.test(postalCode)) {
    return { valid: false, error: "Postal code must be exactly 5 digits." };
  }

  if (labelRaw && !VALID_LABELS.has(labelRaw as AddressLabel)) {
    return { valid: false, error: "Address label must be Home, Work, or Other." };
  }

  const label: AddressLabel = (labelRaw as AddressLabel) || "Home";

  return {
    valid: true,
    data: {
      recipientName,
      phone,
      addressLine,
      subdistrict,
      district,
      province,
      postalCode,
      label,
    },
  };
}

function validateProfileFields(
  payload: FormData | ProfileUpdateInput
): { valid: true; fullName: string | null; phone: string | null } | { valid: false; error: string } {
  let rawFullName: string | null = null;
  let rawPhone: string | null = null;

  if (payload instanceof FormData) {
    const fn = payload.get("fullName") ?? payload.get("full_name");
    const ph = payload.get("phone");
    rawFullName = typeof fn === "string" ? fn.trim() : null;
    rawPhone = typeof ph === "string" ? ph.trim() : null;
  } else if (typeof payload === "object" && payload !== null) {
    rawFullName = typeof payload.fullName === "string" ? payload.fullName.trim() : null;
    rawPhone = typeof payload.phone === "string" ? payload.phone.trim() : null;
  } else {
    return { valid: false, error: "Invalid profile payload." };
  }

  const fullName = rawFullName && rawFullName.length > 0 ? rawFullName : null;
  if (fullName && fullName.length > 100) {
    return { valid: false, error: "Full name cannot exceed 100 characters." };
  }

  const phone = rawPhone && rawPhone.length > 0 ? rawPhone : null;
  if (phone && !PHONE_REGEX.test(phone)) {
    return { valid: false, error: "Please enter a valid phone number (7 to 25 characters, digits, +, -)." };
  }

  return {
    valid: true,
    fullName,
    phone,
  };
}

/**
 * Server Action: Update Customer Profile
 * Scopes update strictly to auth.uid() on customer_profiles.
 * Allows only full_name and phone. Does not upsert or create missing rows.
 */
export async function updateCustomerProfileAction(
  payload: FormData | ProfileUpdateInput
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be signed in to update your profile." };
    }

    const validation = validateProfileFields(payload);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data, error: updateError } = await supabase
      .from("customer_profiles")
      .update({
        full_name: validation.fullName,
        phone: validation.phone,
      })
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      console.error("Customer profile update failed:", updateError.message);
      return { success: false, error: "Unable to update profile. Please try again." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Customer profile record not found." };
    }

    revalidatePath("/account");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in updateCustomerProfileAction:", err);
    return { success: false, error: "An unexpected error occurred while updating profile." };
  }
}

/**
 * Server Action: Create Customer Address
 * Scopes insert strictly to auth.uid().
 * Allowlisted fields only; default status is governed by database lifecycle trigger.
 */
export async function createCustomerAddressAction(
  payload: FormData | AddressInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be signed in to add an address." };
    }

    const validation = validateAddressFields(payload);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data, error: insertError } = await supabase
      .from("customer_addresses")
      .insert({
        user_id: user.id,
        recipient_name: validation.data.recipientName,
        phone: validation.data.phone,
        address_line: validation.data.addressLine,
        subdistrict: validation.data.subdistrict,
        district: validation.data.district,
        province: validation.data.province,
        postal_code: validation.data.postalCode,
        label: validation.data.label,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      console.error("Address creation failed:", insertError?.message);
      return {
        success: false,
        error: "Unable to save address. Please check your information and try again.",
      };
    }

    revalidatePath("/account");
    return { success: true, data: { id: data.id } };
  } catch (err: unknown) {
    console.error("Unexpected error in createCustomerAddressAction:", err);
    return { success: false, error: "An unexpected error occurred while saving address." };
  }
}

/**
 * Server Action: Update Customer Address
 * Scopes update to both id AND auth.uid().
 * Disallows manipulating user_id or is_default directly.
 */
export async function updateCustomerAddressAction(
  addressIdOrPayload: string | FormData | (AddressInput & { id: string }),
  maybePayload?: FormData | AddressInput
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be signed in to edit an address." };
    }

    let addressId = "";
    let payload: FormData | AddressInput;

    if (typeof addressIdOrPayload === "string") {
      addressId = addressIdOrPayload.trim();
      if (!maybePayload) {
        return { success: false, error: "Missing address update data." };
      }
      payload = maybePayload;
    } else if (addressIdOrPayload instanceof FormData) {
      addressId = parseAddressId(addressIdOrPayload);
      payload = addressIdOrPayload;
    } else if (typeof addressIdOrPayload === "object" && addressIdOrPayload !== null) {
      addressId = parseAddressId(addressIdOrPayload);
      payload = addressIdOrPayload;
    } else {
      return { success: false, error: "Invalid address request." };
    }

    if (!addressId || !UUID_REGEX.test(addressId)) {
      return { success: false, error: "Invalid address identifier." };
    }

    const validation = validateAddressFields(payload);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data, error: updateError } = await supabase
      .from("customer_addresses")
      .update({
        recipient_name: validation.data.recipientName,
        phone: validation.data.phone,
        address_line: validation.data.addressLine,
        subdistrict: validation.data.subdistrict,
        district: validation.data.district,
        province: validation.data.province,
        postal_code: validation.data.postalCode,
        label: validation.data.label,
      })
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select("id");

    if (updateError) {
      console.error("Address update failed:", updateError.message);
      return { success: false, error: "Unable to update address. Please try again." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Address not found or you are not authorized to edit it." };
    }

    revalidatePath("/account");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in updateCustomerAddressAction:", err);
    return { success: false, error: "An unexpected error occurred while updating address." };
  }
}

/**
 * Server Action: Delete Customer Address
 * Scopes delete strictly to both id AND auth.uid().
 * Default address auto-promotion is handled safely by database deletion trigger.
 */
export async function deleteCustomerAddressAction(
  addressIdOrPayload: string | FormData | { id?: string; addressId?: string }
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be signed in to delete an address." };
    }

    const addressId = parseAddressId(addressIdOrPayload);
    if (!addressId || !UUID_REGEX.test(addressId)) {
      return { success: false, error: "Invalid address identifier." };
    }

    const { data, error: deleteError } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select("id");

    if (deleteError) {
      console.error("Address deletion failed:", deleteError.message);
      return { success: false, error: "Unable to delete address. Please try again." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Address not found or you are not authorized to delete it." };
    }

    revalidatePath("/account");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in deleteCustomerAddressAction:", err);
    return { success: false, error: "An unexpected error occurred while deleting address." };
  }
}

/**
 * Server Action: Set Default Customer Address
 * Validates identifier and executes atomic public.set_default_customer_address RPC.
 */
export async function setDefaultCustomerAddressAction(
  addressIdOrPayload: string | FormData | { id?: string; addressId?: string }
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "You must be signed in to set a default address." };
    }

    const addressId = parseAddressId(addressIdOrPayload);
    if (!addressId || !UUID_REGEX.test(addressId)) {
      return { success: false, error: "Invalid address identifier." };
    }

    const { error: rpcError } = await supabase.rpc("set_default_customer_address", {
      p_address_id: addressId,
    });

    if (rpcError) {
      console.error("Set default address RPC error:", rpcError.message);
      if (rpcError.message.includes("unauthorized") || rpcError.code === "P0002") {
        return {
          success: false,
          error: "Address not found or you are not authorized to set it as default.",
        };
      }
      return { success: false, error: "Unable to set default address. Please try again." };
    }

    revalidatePath("/account");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in setDefaultCustomerAddressAction:", err);
    return { success: false, error: "An unexpected error occurred while setting default address." };
  }
}
