"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";

export interface CheckoutItemInput {
  variantId?: string;
  productId?: string;
  color?: string;
  size?: string;
  quantity: number;
}

export interface CheckoutContactInput {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutShippingAddressInput {
  recipientName: string;
  phone: string;
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  country?: string;
}

export type CheckoutPaymentMethod = "bank_transfer" | "promptpay";

export interface PlaceOrderInput {
  items: CheckoutItemInput[];
  contact: CheckoutContactInput;
  shippingAddress: CheckoutShippingAddressInput;
  paymentMethod: CheckoutPaymentMethod;
  idempotencyKey: string;
}

export interface PlaceOrderResult {
  order_id: string;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency: string;
  is_idempotent_replay: boolean;
}

export interface CheckoutActionResult {
  success: boolean;
  data?: PlaceOrderResult;
  error?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Maps raw database and RPC error strings to clear, customer-friendly messages.
 */
function mapCheckoutError(rawError: string | undefined): string {
  if (!rawError) {
    return "An unexpected error occurred while placing your order. Please try again.";
  }

  const err = rawError.toUpperCase();

  if (err.includes("INSUFFICIENT_STOCK")) {
    return "One or more pieces in your bag has insufficient stock. Please adjust quantities.";
  }
  if (err.includes("PRODUCT_UNAVAILABLE")) {
    return "An item in your bag is currently unavailable or archived.";
  }
  if (err.includes("PRODUCT_NOT_FOUND")) {
    return "An item in your bag could not be located in the catalog. Please refresh your bag.";
  }
  if (err.includes("DUPLICATE_VARIANT")) {
    return "Duplicate pieces were detected in your bag. Please update your bag and try again.";
  }
  if (err.includes("INVALID_ITEM")) {
    return "Invalid piece or quantity requested. Quantities must be between 1 and 20.";
  }
  if (err.includes("UNSUPPORTED_PAYMENT_METHOD")) {
    return "Selected payment method is currently not supported. Please choose Bank Transfer or PromptPay.";
  }
  if (err.includes("IDEMPOTENCY_KEY_REUSED")) {
    return "This order submission has already been processed or belongs to another session. Please refresh the page.";
  }
  if (err.includes("INVALID_INPUT")) {
    if (err.includes("CONTACT NAME")) return "Please provide a valid full contact name (2-100 characters).";
    if (err.includes("CONTACT EMAIL")) return "Please provide a valid email address.";
    if (err.includes("CONTACT PHONE")) return "Please provide a valid phone number (e.g. 0812345678).";
    if (err.includes("SHIPPING RECIPIENT")) return "Please provide a recipient name for shipping.";
    if (err.includes("ADDRESS LINE")) return "Please provide a complete street address (minimum 5 characters).";
    if (err.includes("POSTAL CODE")) return "Please provide a valid 5-digit Thailand postal code.";
    if (err.includes("SUBDISTRICT") || err.includes("DISTRICT") || err.includes("PROVINCE")) {
      return "Please complete all Thailand locality fields (subdistrict, district, province).";
    }
    return "Please verify that all contact and shipping address fields are complete and valid.";
  }

  return "Unable to complete order placement at this time. Please review your details and try again.";
}

/**
 * Places an order securely by invoking the PostgreSQL create_order_secure RPC.
 * Does not calculate prices or shipping on client/server action; database is source of truth.
 */
export async function placeOrderAction(
  input: PlaceOrderInput
): Promise<CheckoutActionResult> {
  try {
    // 1. Validate Idempotency Key
    const idempotencyKey = String(input.idempotencyKey || "").trim();
    if (!idempotencyKey || !UUID_REGEX.test(idempotencyKey)) {
      return { success: false, error: "Invalid submission token. Please refresh the page." };
    }

    // 2. Validate Payment Method
    if (input.paymentMethod !== "bank_transfer" && input.paymentMethod !== "promptpay") {
      return {
        success: false,
        error: "Please select a supported payment method (Bank Transfer or PromptPay).",
      };
    }

    // 3. Validate Items Array
    if (!Array.isArray(input.items) || input.items.length === 0) {
      return { success: false, error: "Your shopping bag is empty." };
    }
    if (input.items.length > 50) {
      return { success: false, error: "Bag exceeds maximum limit of 50 lines." };
    }

    const supabase = await createServerClient();

    // 4. Resolve Variant IDs for each item
    const resolvedItems: { variant_id: string; quantity: number }[] = [];

    for (const item of input.items) {
      const qty = Math.floor(Number(item.quantity));
      if (isNaN(qty) || qty < 1 || qty > 20) {
        return {
          success: false,
          error: "Quantities must be between 1 and 20 pieces per item.",
        };
      }

      let variantId = item.variantId ? String(item.variantId).trim() : "";

      // Fallback: If variantId is not directly attached, resolve via product_id + color + size
      if (!variantId || !UUID_REGEX.test(variantId)) {
        if (item.productId && item.color && item.size) {
          const { data: vRecord, error: vLookupErr } = await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", item.productId)
            .ilike("color", item.color.trim())
            .ilike("size", item.size.trim())
            .maybeSingle();

          if (!vLookupErr && vRecord?.id) {
            variantId = vRecord.id;
          }
        }
      }

      if (!variantId || !UUID_REGEX.test(variantId)) {
        return {
          success: false,
          error: "Unable to identify product variant. Please remove and re-add the item to your bag.",
        };
      }

      resolvedItems.push({
        variant_id: variantId,
        quantity: qty,
      });
    }

    // 5. Structure Canonical Payloads for RPC
    const p_contact = {
      name: String(input.contact?.name || "").trim(),
      email: String(input.contact?.email || "").trim().toLowerCase(),
      phone: String(input.contact?.phone || "").trim(),
    };

    const p_shipping_address = {
      recipient_name: String(input.shippingAddress?.recipientName || "").trim(),
      phone: String(input.shippingAddress?.phone || "").trim(),
      address_line: String(input.shippingAddress?.addressLine || "").trim(),
      subdistrict: String(input.shippingAddress?.subdistrict || "").trim(),
      district: String(input.shippingAddress?.district || "").trim(),
      province: String(input.shippingAddress?.province || "").trim(),
      postal_code: String(input.shippingAddress?.postalCode || "").trim(),
      country: "TH",
    };

    // 6. Invoke Database Transaction RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_order_secure",
      {
        p_items: resolvedItems,
        p_contact,
        p_shipping_address,
        p_payment_method: input.paymentMethod,
        p_idempotency_key: idempotencyKey,
      }
    );

    if (rpcError) {
      console.error("create_order_secure RPC error:", rpcError);
      return {
        success: false,
        error: mapCheckoutError(rpcError.message),
      };
    }

    if (!rpcData || !rpcData.order_id || !rpcData.order_number) {
      return {
        success: false,
        error: "Failed to receive order confirmation. Please check your account or try again.",
      };
    }

    return {
      success: true,
      data: rpcData as PlaceOrderResult,
    };
  } catch (err: unknown) {
    console.error("placeOrderAction exception:", err);
    return {
      success: false,
      error: "A network error occurred while processing your checkout. Please try again.",
    };
  }
}
