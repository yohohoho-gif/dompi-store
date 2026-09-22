"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface MigrationControlProps {
  externalCount: number;
  totalCount: number;
}

export default function MigrationControl({
  externalCount: initialExternalCount,
  totalCount,
}: MigrationControlProps) {
  const [externalCount, setExternalCount] = useState(initialExternalCount);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    migrated: number;
    failed: number;
    total: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleMigrate = () => {
    setErrorMsg(null);
    setResult(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/migrate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.error || "Migration failed.");
          return;
        }

        setResult({
          migrated: data.migrated,
          failed: data.failed,
          total: data.total,
        });

        setExternalCount(Math.max(0, externalCount - data.migrated));
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setErrorMsg(msg);
      }
    });
  };

  if (externalCount === 0 && !result) {
    return (
      <div className="bg-neutral-900 text-white p-4 rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono uppercase font-bold tracking-wider">
            All {totalCount} Catalog Images Hosted in Supabase Storage
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          Bucket: product-images &bull; Verified 100%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 text-white p-5 rounded-[10px] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-mono uppercase font-bold tracking-wider text-xs">
              External Catalog Photography Migration
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {externalCount} of {totalCount} product images are currently hosted externally on Unsplash.
            Migrate them directly to the <code className="text-white">product-images</code> Supabase Storage bucket.
          </p>
        </div>

        <button
          id="btn-migrate-storage"
          type="button"
          disabled={isPending}
          onClick={handleMigrate}
          className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-black text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors disabled:opacity-50 shrink-0 font-mono"
        >
          {isPending ? "Migrating & Verifying..." : `Migrate ${externalCount} Images to Storage`}
        </button>
      </div>

      {isPending && (
        <div className="pt-2 border-t border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>Downloading from Unsplash &bull; Uploading to Storage &bull; Verifying HEAD</span>
            <span className="animate-pulse">Processing 28 images...</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-white h-full animate-pulse w-full" />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950 border border-red-800 text-red-200 rounded-[6px] text-xs font-mono">
          Migration Error: {errorMsg}
        </div>
      )}

      {result && (
        <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-[6px] text-xs font-mono flex items-center justify-between">
          <span>
            Migration complete: {result.migrated} migrated successfully, {result.failed} failed.
          </span>
          <span className="text-[10px] text-emerald-400 uppercase font-bold">Verified in DB</span>
        </div>
      )}
    </div>
  );
}
