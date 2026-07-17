import fs from "fs";

const sql = fs.readFileSync("supabase/migrations/033_world_currencies.sql", "utf8");
const insertMatch = sql.match(/INSERT INTO public\.fx_rates[\s\S]*?;/);
if (!insertMatch) throw new Error("INSERT not found");
fs.writeFileSync("supabase/seed-fx-only.sql", insertMatch[0] + "\n\n" + sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.normalize_account_currency")));
console.log("Wrote seed-fx-only.sql");
