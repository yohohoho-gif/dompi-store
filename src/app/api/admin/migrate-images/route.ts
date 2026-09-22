import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import * as fs from "fs";
import * as path from "path";

const BUCKET_NAME = "product-images";
const BACKUP_FILE = path.resolve(
  process.cwd(),
  "supabase",
  "migrations",
  "storage_migration_backup.json"
);

export async function POST() {
  try {
    // 1. Verify Admin Authentication & Role
    const { user } = await requireAdmin();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required." },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 2. Fetch all product images
    const { data: images, error: fetchErr } = await supabase
      .from("product_images")
      .select("id, product_id, image_url, alt_text, sort_order")
      .order("product_id")
      .order("sort_order");

    if (fetchErr) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch images: ${fetchErr.message}` },
        { status: 500 }
      );
    }

    const allImages = images || [];
    const externalImages = allImages.filter(
      (img) => !img.image_url.includes(`/${BUCKET_NAME}/`)
    );
    const alreadyMigrated = allImages.filter((img) =>
      img.image_url.includes(`/${BUCKET_NAME}/`)
    );

    if (externalImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All catalog images are already in Supabase Storage.",
        total: allImages.length,
        migrated: 0,
        failed: 0,
        skipped: alreadyMigrated.length,
      });
    }

interface BackupItem {
  id: string;
  product_id: string;
  original_url: string;
  new_url?: string;
  storage_path?: string;
  migrated_at?: string;
  verified_accessible?: boolean;
}

interface MigrationLogItem {
  id: string;
  productId: string;
  status: "migrated" | "failed";
  newUrl?: string;
  error?: string;
  keptOriginalUrl?: string;
}

    // 3. Load existing backup manifest
    let existingBackup: BackupItem[] = [];
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        existingBackup = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
      } catch {
        existingBackup = [];
      }
    }
    const backupMap = new Map<string, BackupItem>();
    existingBackup.forEach((b) => backupMap.set(b.id, b));

    let successCount = 0;
    let failureCount = 0;
    const migrationLog: MigrationLogItem[] = [];

    // 4. Process each image sequentially
    for (const img of externalImages) {
      try {
        // Step A: Download external image
        const response = await fetch(img.image_url);
        if (!response.ok) {
          throw new Error(`External image download failed: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const extension = contentType.includes("png")
          ? "png"
          : contentType.includes("webp")
          ? "webp"
          : contentType.includes("avif")
          ? "avif"
          : "jpg";

        // Step B: Generate isolated path
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const storagePath = `products/${img.product_id}/${timestamp}_${randomSuffix}_editorial_${img.sort_order + 1}.${extension}`;

        // Step C: Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, buffer, {
            contentType,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Step D: Get Public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);

        if (!urlData?.publicUrl) {
          throw new Error("Failed to generate public URL");
        }

        const publicUrl = urlData.publicUrl;

        // Step E: VERIFY accessibility BEFORE modifying database
        const verifyRes = await fetch(publicUrl, { method: "HEAD" });
        if (!verifyRes.ok) {
          throw new Error(
            `Verification HEAD request returned HTTP ${verifyRes.status}. Storage image not accessible.`
          );
        }

        // Step F: Update product_images table record
        const { error: updateError } = await supabase
          .from("product_images")
          .update({ image_url: publicUrl })
          .eq("id", img.id);

        if (updateError) {
          throw new Error(`Database record update failed: ${updateError.message}`);
        }

        // Step G: Record backup
        backupMap.set(img.id, {
          id: img.id,
          product_id: img.product_id,
          original_url: img.image_url,
          new_url: publicUrl,
          storage_path: storagePath,
          migrated_at: new Date().toISOString(),
          verified_accessible: true,
        });

        successCount++;
        migrationLog.push({
          id: img.id,
          productId: img.product_id,
          status: "migrated",
          newUrl: publicUrl,
        });
      } catch (err: unknown) {
        failureCount++;
        const message = err instanceof Error ? err.message : "Unknown error";
        migrationLog.push({
          id: img.id,
          productId: img.product_id,
          status: "failed",
          error: message,
          keptOriginalUrl: img.image_url,
        });
      }
    }

    // 5. Save updated backup file
    const finalBackup = Array.from(backupMap.values());
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(finalBackup, null, 2), "utf-8");

    // 6. Revalidate cache
    revalidatePath("/admin");
    revalidatePath("/shop");
    revalidatePath("/shop/[slug]", "page");

    return NextResponse.json({
      success: true,
      total: allImages.length,
      migrated: successCount,
      failed: failureCount,
      skipped: alreadyMigrated.length,
      backupEntries: finalBackup.length,
      details: migrationLog,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
