/**
 * DOMPI Image Migration Pipeline: External URLs -> Supabase Storage
 * 
 * Strict Production Requirements:
 * 1. Migrates existing catalog images to "product-images" bucket.
 * 2. Preserves product_id and sort_order.
 * 3. Path convention: products/{product_id}/{timestamp}_{random}_editorial_{sort_order+1}.{ext}
 * 4. Downloads external image -> uploads to storage -> verifies HTTP 200 via HEAD request.
 * 5. ONLY updates product_images.image_url after verified accessibility.
 * 6. Keeps original URL on any failure and continues safely.
 * 7. Safe to rerun: skips already migrated images, retryable on failure.
 * 8. Maintains backup manifest in supabase/migrations/storage_migration_backup.json.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export const BUCKET_NAME = "product-images";
export const BACKUP_FILE = path.resolve(
  process.cwd(),
  "supabase",
  "migrations",
  "storage_migration_backup.json"
);

export interface ProductImageRecord {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface BackupEntry {
  id: string;
  product_id: string;
  original_url: string;
  new_url?: string;
  storage_path?: string;
  migrated_at?: string;
  verified_accessible?: boolean;
}

export async function getSupabaseClient() {
  if (SERVICE_ROLE_KEY) {
    console.log("-> Authenticating with SUPABASE_SERVICE_ROLE_KEY.");
    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  }

  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY);

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    console.log(`-> Authenticating admin session for ${ADMIN_EMAIL}...`);
    const { error } = await client.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (error) {
      throw new Error(`Admin authentication failed: ${error.message}`);
    }
    console.log("-> Admin session established successfully.");
    return client;
  }

  return client;
}

export async function runMigration(supabaseClient?: SupabaseClient) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isRollback = args.includes("--rollback");

  console.log("=================================================");
  console.log("   DOMPI PRODUCT IMAGES PRODUCTION MIGRATION");
  console.log("=================================================");

  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or publishable key in .env.local");
  }

  const supabase = supabaseClient || (await getSupabaseClient());

  // Handle Rollback
  if (isRollback) {
    console.log("Initiating Rollback from:", BACKUP_FILE);
    if (!fs.existsSync(BACKUP_FILE)) {
      throw new Error("Backup file not found. Cannot rollback.");
    }
    const backupData: BackupEntry[] = JSON.parse(
      fs.readFileSync(BACKUP_FILE, "utf-8")
    );
    console.log(`Found ${backupData.length} records in backup.`);

    let restored = 0;
    for (const item of backupData) {
      const { error } = await supabase
        .from("product_images")
        .update({ image_url: item.original_url })
        .eq("id", item.id);

      if (error) {
        console.error(`Failed to restore image ${item.id}:`, error.message);
      } else {
        restored++;
      }
    }
    console.log(`Rollback completed: ${restored}/${backupData.length} images restored.`);
    return { restored, total: backupData.length };
  }

  // Fetch all product images
  const { data: images, error: fetchErr } = await supabase
    .from("product_images")
    .select("id, product_id, image_url, alt_text, sort_order")
    .order("product_id")
    .order("sort_order");

  if (fetchErr) {
    throw new Error(`Failed to query product_images: ${fetchErr.message}`);
  }

  if (!images || images.length === 0) {
    console.log("No product images found in database.");
    return { total: 0, migrated: 0, failed: 0, skipped: 0 };
  }

  const allImages = images as ProductImageRecord[];
  const externalImages = allImages.filter(
    (img) => !img.image_url.includes(`/${BUCKET_NAME}/`)
  );
  const alreadyMigratedImages = allImages.filter((img) =>
    img.image_url.includes(`/${BUCKET_NAME}/`)
  );

  console.log(`Total database images: ${allImages.length}`);
  console.log(`Already in Supabase Storage: ${alreadyMigratedImages.length}`);
  console.log(`Pending migration: ${externalImages.length}`);

  if (externalImages.length === 0) {
    console.log("All catalog images are already hosted in Supabase Storage!");
    return {
      total: allImages.length,
      migrated: 0,
      failed: 0,
      skipped: alreadyMigratedImages.length,
    };
  }

  // Dry run
  if (isDryRun) {
    console.log("\n[DRY RUN MODE] Checking URL accessibility and target paths...\n");
    let verifiedCount = 0;

    for (let i = 0; i < externalImages.length; i++) {
      const img = externalImages[i];
      const filename = `editorial_${img.sort_order + 1}.jpg`;
      const targetPath = `products/${img.product_id}/${filename}`;

      try {
        const headRes = await fetch(img.image_url, { method: "HEAD" });
        const size = headRes.headers.get("content-length") || "unknown";
        console.log(
          `[${i + 1}/${externalImages.length}] OK (HTTP ${headRes.status}) | Size: ${size} | Target: ${targetPath}`
        );
        verifiedCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error";
        console.warn(`[${i + 1}/${externalImages.length}] Warning: ${img.image_url} (${message})`);
      }
    }

    console.log(`\nDry run completed: ${verifiedCount}/${externalImages.length} images verified accessible.`);
    return {
      total: allImages.length,
      verifiedAccessible: verifiedCount,
      pending: externalImages.length,
    };
  }

  // Live Migration
  if (
    !supabaseClient &&
    !SERVICE_ROLE_KEY &&
    (!ADMIN_EMAIL || !ADMIN_PASSWORD)
  ) {
    console.warn("\nNOTICE: Direct CLI execution requires admin credentials.");
    console.warn("Set $env:ADMIN_EMAIL and $env:ADMIN_PASSWORD or run via authenticated Admin Console.");
    throw new Error("Missing admin authentication for direct CLI execution.");
  }

  console.log("\nStarting Live Migration to Supabase Storage...");

  // Load existing backup to avoid overwriting previous entries
  let existingBackup: BackupEntry[] = [];
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      existingBackup = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
    } catch {
      existingBackup = [];
    }
  }
  const backupMap = new Map<string, BackupEntry>();
  existingBackup.forEach((b) => backupMap.set(b.id, b));

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < externalImages.length; i++) {
    const img = externalImages[i];
    console.log(
      `\n[${i + 1}/${externalImages.length}] Migrating product ${img.product_id} (Angle ${img.sort_order + 1})...`
    );

    try {
      // Step 1: Download external image
      const response = await fetch(img.image_url);
      if (!response.ok) {
        throw new Error(`Download failed with HTTP ${response.status}`);
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

      // Step 2: Generate isolated, collision-resistant path
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const storagePath = `products/${img.product_id}/${timestamp}_${randomSuffix}_editorial_${img.sort_order + 1}.${extension}`;

      // Step 3: Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }

      // Step 4: Resolve public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error(`Failed to resolve public URL for ${storagePath}`);
      }

      const publicUrl = urlData.publicUrl;

      // Step 5: VERIFY accessibility BEFORE updating database
      const verifyRes = await fetch(publicUrl, { method: "HEAD" });
      if (!verifyRes.ok) {
        throw new Error(
          `Post-upload verification failed with HTTP ${verifyRes.status}. Storage object not accessible.`
        );
      }

      // Step 6: Update product_images table
      const { error: updateError } = await supabase
        .from("product_images")
        .update({ image_url: publicUrl })
        .eq("id", img.id);

      if (updateError) {
        throw new Error(`Database update failed for record ${img.id}: ${updateError.message}`);
      }

      // Step 7: Record backup entry
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
      console.log(`-> SUCCESS: Migrated & verified: ${publicUrl}`);
    } catch (err: unknown) {
      failureCount++;
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`-> FAILED: Image ${img.id} kept original external URL. Error: ${message}`);
    }
  }

  // Persist updated backup manifest
  const finalBackup = Array.from(backupMap.values());
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(finalBackup, null, 2), "utf-8");

  console.log(`\n=================================================`);
  console.log(`MIGRATION SUMMARY:`);
  console.log(`Total Images Processed: ${externalImages.length}`);
  console.log(`Successfully Migrated:  ${successCount}`);
  console.log(`Failed (Kept Original): ${failureCount}`);
  console.log(`Backup Manifest:        ${BACKUP_FILE} (${finalBackup.length} entries)`);
  console.log(`=================================================`);

  return {
    total: allImages.length,
    migrated: successCount,
    failed: failureCount,
    skipped: alreadyMigratedImages.length,
  };
}

// Execute if run directly via CLI
if (
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").includes("scripts/migrate-images-to-storage")
) {
  runMigration().catch((err) => {
    console.error("Migration fatal error:", err);
    process.exit(1);
  });
}
