"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CustomerAddress } from "@/lib/profile";
import {
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
} from "@/app/actions/account";
import AddressForm from "@/components/account/AddressForm";

interface AddressBookProps {
  addresses: CustomerAddress[];
}

export default function AddressBook({ addresses }: AddressBookProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null
  );
  const [deletingAddress, setDeletingAddress] =
    useState<CustomerAddress | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  const handleSetDefault = (addressId: string) => {
    if (isPending) return;
    setActionPendingId(addressId);
    setFeedback(null);

    startTransition(async () => {
      const res = await setDefaultCustomerAddressAction(addressId);
      setActionPendingId(null);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "Default shipping address updated.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Unable to update default address.",
        });
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingAddress || isPending) return;
    const target = deletingAddress;
    setActionPendingId(target.id);
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteCustomerAddressAction(target.id);
      setActionPendingId(null);
      setDeletingAddress(null);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "Shipping address deleted successfully.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Unable to delete address.",
        });
      }
    });
  };

  return (
    <section
      aria-labelledby="addresses-heading"
      className="bg-white border border-neutral-200 rounded-[10px] p-6 sm:p-8 space-y-6"
    >
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            LOGISTICS & DISPATCH
          </span>
          <h2
            id="addresses-heading"
            className="text-lg sm:text-xl font-black uppercase tracking-tight text-black"
          >
            Saved Shipping Addresses
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your personal delivery destinations for streamlined checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Address</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-[8px] text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase ml-4 opacity-60 hover:opacity-100"
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Address Cards Grid or Empty State */}
      {addresses.length === 0 ? (
        <div className="py-12 px-4 text-center border border-dashed border-neutral-300 rounded-[10px] bg-neutral-50/50 space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              No Addresses Saved Yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Add your primary shipping destination to enable accelerated one-click checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-2 px-5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors inline-block"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isDefault = addr.isDefault;
            const isProcessingThis = actionPendingId === addr.id;

            return (
              <div
                key={addr.id}
                className={`p-5 rounded-[10px] border transition-colors flex flex-col justify-between space-y-4 ${
                  isDefault
                    ? "border-black bg-white shadow-xs"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider rounded-[4px]">
                      {addr.label}
                    </span>

                    {isDefault && (
                      <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-[4px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        DEFAULT
                      </span>
                    )}
                  </div>

                  {/* Recipient info */}
                  <div>
                    <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                      {addr.recipientName}
                    </h3>
                    <p className="text-xs font-mono text-neutral-500 mt-0.5">
                      {addr.phone}
                    </p>
                  </div>

                  {/* Address lines */}
                  <div className="text-xs text-neutral-700 leading-relaxed space-y-0.5">
                    <p>{addr.addressLine}</p>
                    <p className="text-neutral-500">
                      {addr.subdistrict}, {addr.district}
                    </p>
                    <p className="text-neutral-500 font-medium">
                      {addr.province} {addr.postalCode}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
                  <div>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        disabled={isPending || isProcessingThis}
                        className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black underline underline-offset-4 disabled:opacity-50 transition-colors"
                      >
                        {isProcessingThis ? "Updating..." : "Set as Default"}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addr)}
                      disabled={isPending || isProcessingThis}
                      className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() => setDeletingAddress(addr)}
                      disabled={isPending || isProcessingThis}
                      className="text-[11px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal Form */}
      {isFormOpen && (
        <AddressForm
          initialAddress={editingAddress}
          onClose={handleCloseForm}
        />
      )}

      {/* Explicit Delete Confirmation Dialog */}
      {deletingAddress && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white border border-neutral-200 rounded-[12px] w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-600 block mb-1">
                CONFIRM DELETION
              </span>
              <h3
                id="delete-dialog-title"
                className="text-lg font-black uppercase tracking-tight text-black"
              >
                Delete Shipping Address?
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Are you sure you want to remove the address for{" "}
                <strong className="text-black">
                  {deletingAddress.recipientName}
                </strong>{" "}
                ({deletingAddress.addressLine})? This action cannot be undone.
              </p>
              {deletingAddress.isDefault && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[6px] p-2.5 mt-3">
                  This is currently your default shipping address. If deleted, another saved address will automatically be selected as default.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setDeletingAddress(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
