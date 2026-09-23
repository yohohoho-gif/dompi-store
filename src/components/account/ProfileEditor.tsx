"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerProfileAction } from "@/app/actions/account";

interface ProfileEditorProps {
  email: string;
  initialFullName: string | null;
  initialPhone: string | null;
}

export default function ProfileEditor({
  email,
  initialFullName,
  initialPhone,
}: ProfileEditorProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const hasChanges =
    fullName.trim() !== (initialFullName || "").trim() ||
    phone.trim() !== (initialPhone || "").trim();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setFeedback(null);

    const formData = new FormData();
    formData.set("fullName", fullName.trim());
    formData.set("phone", phone.trim());

    startTransition(async () => {
      const result = await updateCustomerProfileAction(formData);
      if (result.success) {
        setFeedback({
          type: "success",
          message: "Profile updated successfully.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Unable to update profile. Please try again.",
        });
      }
    });
  };

  const handleReset = () => {
    setFullName(initialFullName || "");
    setPhone(initialPhone || "");
    setFeedback(null);
  };

  return (
    <section
      aria-labelledby="profile-heading"
      className="bg-white border border-neutral-200 rounded-[10px] p-6 sm:p-8"
    >
      <div className="mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
          PERSONAL IDENTITY
        </span>
        <h2
          id="profile-heading"
          className="text-lg sm:text-xl font-black uppercase tracking-tight text-black"
        >
          Customer Profile
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Update your contact information for order communication and deliveries.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mb-6 p-3.5 rounded-[8px] text-xs font-medium flex items-center justify-between ${
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
            aria-label="Dismiss feedback"
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name (Editable) */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-full-name"
              className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block"
            >
              Full Name
            </label>
            <input
              id="profile-full-name"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isPending}
              maxLength={100}
              placeholder="e.g. Alex Mercer"
              className="w-full bg-white border border-neutral-300 rounded-[8px] px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black disabled:bg-neutral-50 transition-colors"
            />
          </div>

          {/* Email (Read-only, sourced strictly from Auth) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="profile-email"
                className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block"
              >
                Email Address
              </label>
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                Read-only
              </span>
            </div>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              readOnly
              className="w-full bg-neutral-100 border border-neutral-200 rounded-[8px] px-3.5 py-2.5 text-xs text-neutral-600 font-mono cursor-not-allowed select-all"
            />
            <p className="text-[10px] text-neutral-400">
              Primary login credential managed by authentication service.
            </p>
          </div>

          {/* Phone (Editable) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="profile-phone"
              className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block"
            >
              Contact Phone
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isPending}
              maxLength={25}
              placeholder="+66 81 234 5678"
              className="w-full max-w-sm bg-white border border-neutral-300 rounded-[8px] px-3.5 py-2.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black disabled:bg-neutral-50 transition-colors"
            />
            <p className="text-[10px] text-neutral-400">
              Used for courier parcel delivery coordination (7 to 25 characters).
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || !hasChanges}
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </button>

          {hasChanges && !isPending && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-neutral-500 hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Discard
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
