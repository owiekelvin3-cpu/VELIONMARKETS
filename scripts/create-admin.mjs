/**
 * Creates the default admin user in Supabase.
 *
 * Requires in .env:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role — keep secret)
 *
 * Usage: npm run create-admin
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tradno.admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Tradno@Admin2026!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Tradno Admin";

if (!url || !serviceKey) {
  console.error(`
Missing Supabase credentials.

Add to your .env file:
  VITE_SUPABASE_URL=your-project-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

Get the service role key from:
  Supabase Dashboard → Settings → API → service_role (secret)
`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Creating admin: ${ADMIN_EMAIL}`);

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (existing) {
    if (existing.role !== "admin") {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin", full_name: ADMIN_NAME })
        .eq("id", existing.id);
      if (error) throw error;
      console.log("Existing user promoted to admin.");
    } else {
      console.log("Admin user already exists.");
    }
    console.log("\nLogin at: /admin-auth");
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    return;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (createError) throw createError;
  if (!created.user) throw new Error("User creation returned no user.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", full_name: ADMIN_NAME, email: ADMIN_EMAIL })
    .eq("id", created.user.id);

  if (profileError) {
    // Profile row may be created by trigger; try upsert
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: created.user.id,
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: "admin",
    });
    if (upsertError) throw upsertError;
  }

  console.log("\nAdmin created successfully.\n");
  console.log("Login at: http://localhost:5173/admin-auth");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log("\nCreate this Gmail at https://accounts.google.com/signup if you want a real Gmail inbox.");
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
