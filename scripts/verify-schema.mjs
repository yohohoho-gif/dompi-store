import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually if running outside Next.js
const envPath = path.resolve(process.cwd(), ".env.local");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...val] = trimmed.split("=");
      if (key && val.length > 0) {
        envVars[key.trim()] = val.join("=").trim();
      }
    }
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("Checking Supabase connection to:", supabaseUrl);
  const tables = [
    "categories",
    "products",
    "product_images",
    "product_variants",
    "orders",
    "order_items",
  ];

  let missing = [];
  let available = [];

  for (const t of tables) {
    const { error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      if (error.code === "PGRST204" || error.message.includes("Could not find the table")) {
        missing.push({ table: t, message: error.message });
      } else {
        // Table exists but RLS returned empty or other policy result
        available.push({ table: t, status: "EXISTS (RLS active)" });
      }
    } else {
      available.push({ table: t, status: "EXISTS (Accessible)" });
    }
  }

  console.log("\n--- Verification Results ---");
  console.log("Found tables (" + available.length + "/" + tables.length + "):");
  for (const item of available) {
    console.log("  ✓ " + item.table + ": " + item.status);
  }

  if (missing.length > 0) {
    console.log("\nPending tables to be created (" + missing.length + "/" + tables.length + "):");
    for (const item of missing) {
      console.log("  ✗ " + item.table);
    }
  } else {
    console.log("\nAll 6 tables are verified and active on Supabase!");
  }
}

verify().catch(console.error);
