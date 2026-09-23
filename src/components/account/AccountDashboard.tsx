"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerUser } from "@/lib/auth";
import { CustomerProfile, CustomerAddress } from "@/lib/profile";
import { customerLogoutAction } from "@/app/actions/auth";
import ProfileEditor from "@/components/account/ProfileEditor";
import AddressBook from "@/components/account/AddressBook";

interface AccountDashboardProps {
  customer: CustomerUser;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[];
}

export default function AccountDashboard({
  customer,
  profile,
  addresses,
}: AccountDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      const res = await customerLogoutAction();
      if (res.success) {
        router.push("/");
        router.refresh();
      }
    });
  };

  const formattedDate = new Date(customer.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Source of truth for editable name is customer_profiles; fallback to Auth metadata if null
  const displayName = profile?.fullName || customer.fullName || "Archive Member";

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white border border-neutral-200 rounded-[12px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.25em] text-neutral-400 uppercase block mb-1">
            DOMPI ARCHIVE MEMBER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            {displayName}
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            {customer.email}
          </p>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleSignOut}
          className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-[8px] transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          {isPending ? "Signing Out..." : "Sign Out"}
        </button>
      </div>

      {/* Account Details & Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Account Status
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold uppercase tracking-wider text-black">
              Active Member
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 pt-1">
            Authenticated via Supabase Auth
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Member Since
          </span>
          <div className="text-sm font-bold text-black pt-1">
            {formattedDate}
          </div>
          <p className="text-[11px] text-neutral-400 pt-1">
            Account creation date
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-[10px] p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Account Identifier
          </span>
          <div className="text-xs font-mono text-neutral-800 pt-1 truncate">
            {customer.id}
          </div>
          <p className="text-[11px] text-neutral-400 pt-1">
            Unique customer ID
          </p>
        </div>
      </div>

      {/* Profile Section (Source of truth: public.customer_profiles) */}
      <ProfileEditor
        email={customer.email}
        initialFullName={profile?.fullName || null}
        initialPhone={profile?.phone || null}
      />

      {/* Address Book Section (Source of truth: public.customer_addresses) */}
      <AddressBook addresses={addresses} />

      {/* Quick Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/shop"
          className="group bg-neutral-900 hover:bg-black text-white p-6 rounded-[12px] flex items-center justify-between transition-colors shadow-sm"
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
              Storefront
            </span>
            <span className="text-sm font-bold uppercase tracking-wider block">
              Browse Architectural Streetwear
            </span>
            <span className="text-xs text-neutral-400 block mt-1">
              Explore outerwear, track pants, and tees
            </span>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </Link>

        <Link
          href="/cart"
          className="group bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-black p-6 rounded-[12px] flex items-center justify-between transition-colors"
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
              Shopping Cart
            </span>
            <span className="text-sm font-bold uppercase tracking-wider block">
              View Active Bag
            </span>
            <span className="text-xs text-neutral-500 block mt-1">
              Review selected garments before checkout
            </span>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition-transform text-neutral-400 group-hover:text-black">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
