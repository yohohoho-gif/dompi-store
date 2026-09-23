"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CustomerAddress, AddressLabel } from "@/lib/profile";
import {
  createCustomerAddressAction,
  updateCustomerAddressAction,
} from "@/app/actions/account";
import ThailandAddressSelector from "@/components/common/ThailandAddressSelector";

interface AddressFormProps {
  initialAddress?: CustomerAddress | null;
  onClose: () => void;
}

const VALID_LABELS: AddressLabel[] = ["Home", "Work", "Other"];

export default function AddressForm({
  initialAddress,
  onClose,
}: AddressFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialAddress);

  const [recipientName, setRecipientName] = useState(
    initialAddress?.recipientName || ""
  );
  const [phone, setPhone] = useState(initialAddress?.phone || "");
  const [addressLine, setAddressLine] = useState(
    initialAddress?.addressLine || ""
  );
  const [subdistrict, setSubdistrict] = useState(
    initialAddress?.subdistrict || ""
  );
  const [district, setDistrict] = useState(initialAddress?.district || "");
  const [province, setProvince] = useState(initialAddress?.province || "");
  const [postalCode, setPostalCode] = useState(
    initialAddress?.postalCode || ""
  );
  const [label, setLabel] = useState<AddressLabel>(
    initialAddress?.label || "Home"
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);

    const trimmedRecipient = recipientName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = addressLine.trim();
    const trimmedSubdistrict = subdistrict.trim();
    const trimmedDistrict = district.trim();
    const trimmedProvince = province.trim();
    const trimmedPostalCode = postalCode.trim();

    // Client-side validation aligned with Server Action constraints
    if (!trimmedRecipient || trimmedRecipient.length < 2) {
      setError("Recipient name must be at least 2 characters.");
      return;
    }
    if (trimmedRecipient.length > 100) {
      setError("Recipient name cannot exceed 100 characters.");
      return;
    }

    if (!trimmedPhone || !/^[0-9+() -]{7,25}$/.test(trimmedPhone)) {
      setError("Please enter a valid phone number (7 to 25 characters, digits, +, -).");
      return;
    }

    if (!trimmedAddress || trimmedAddress.length < 5) {
      setError("Address line must be at least 5 characters.");
      return;
    }
    if (trimmedAddress.length > 250) {
      setError("Address line cannot exceed 250 characters.");
      return;
    }

    if (!trimmedSubdistrict || trimmedSubdistrict.length < 2) {
      setError("Subdistrict is required (at least 2 characters).");
      return;
    }
    if (trimmedSubdistrict.length > 100) {
      setError("Subdistrict cannot exceed 100 characters.");
      return;
    }

    if (!trimmedDistrict || trimmedDistrict.length < 2) {
      setError("District is required (at least 2 characters).");
      return;
    }
    if (trimmedDistrict.length > 100) {
      setError("District cannot exceed 100 characters.");
      return;
    }

    if (!trimmedProvince || trimmedProvince.length < 2) {
      setError("Province is required (at least 2 characters).");
      return;
    }
    if (trimmedProvince.length > 100) {
      setError("Province cannot exceed 100 characters.");
      return;
    }

    if (!trimmedPostalCode || !/^[0-9]{5}$/.test(trimmedPostalCode)) {
      setError("Postal code must be exactly 5 numeric digits.");
      return;
    }

    const payload = {
      recipientName: trimmedRecipient,
      phone: trimmedPhone,
      addressLine: trimmedAddress,
      subdistrict: trimmedSubdistrict,
      district: trimmedDistrict,
      province: trimmedProvince,
      postalCode: trimmedPostalCode,
      label,
    };

    startTransition(async () => {
      let result;
      if (isEditing && initialAddress) {
        result = await updateCustomerAddressAction(initialAddress.id, payload);
      } else {
        result = await createCustomerAddressAction(payload);
      }

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Unable to save address. Please try again.");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white border border-neutral-200 rounded-[12px] w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-0.5">
              SHIPPING DESTINATION
            </span>
            <h3
              id="address-form-title"
              className="text-lg font-black uppercase tracking-tight text-black"
            >
              {isEditing ? "Edit Shipping Address" : "Add New Shipping Address"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-neutral-400 hover:text-black transition-colors rounded-[6px]"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-[8px] text-xs font-medium text-red-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
              Address Label
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VALID_LABELS.map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setLabel(lbl)}
                  disabled={isPending}
                  className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-[8px] border transition-colors ${
                    label === lbl
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recipient Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="addr-recipient-name"
                className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block"
              >
                Recipient Name *
              </label>
              <input
                id="addr-recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                disabled={isPending}
                maxLength={100}
                placeholder="Full recipient name"
                required
                className="w-full bg-white border border-neutral-300 rounded-[8px] px-3.5 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black disabled:bg-neutral-50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="addr-phone"
                className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block"
              >
                Contact Phone *
              </label>
              <input
                id="addr-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPending}
                maxLength={25}
                placeholder="e.g. 0812345678"
                required
                className="w-full bg-white border border-neutral-300 rounded-[8px] px-3.5 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black disabled:bg-neutral-50"
              />
            </div>
          </div>

          {/* Address Line */}
          <div className="space-y-1.5">
            <label
              htmlFor="addr-line"
              className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block"
            >
              Street Address / Building / Unit *
            </label>
            <input
              id="addr-line"
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              disabled={isPending}
              maxLength={250}
              placeholder="House/Unit #, Street, Soi, Village"
              required
              className="w-full bg-white border border-neutral-300 rounded-[8px] px-3.5 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black disabled:bg-neutral-50"
            />
          </div>

          {/* Thailand Administrative Address Selector (Hierarchical + Postal Lookup + Manual Fallback) */}
          <ThailandAddressSelector
            value={{
              province,
              district,
              subdistrict,
              postalCode,
            }}
            onChange={(next) => {
              setProvince(next.province);
              setDistrict(next.district);
              setSubdistrict(next.subdistrict);
              setPostalCode(next.postalCode);
            }}
            disabled={isPending}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                "Update Address"
              ) : (
                "Save Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
