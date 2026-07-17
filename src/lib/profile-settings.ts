import { supabase } from "@/lib/supabase";

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) throw profileError;
  return url;
}

export async function removeAvatar(userId: string) {
  const { data: files } = await supabase.storage.from("avatars").list(userId);
  if (files?.length) {
    await supabase.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
  }
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateProfileFields(
  userId: string,
  fields: {
    full_name?: string;
    phone?: string | null;
    bio?: string | null;
    wallet_address?: string | null;
    wallet_label?: string | null;
    preferred_currency?: string;
  }
) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateUserCurrency(_userId: string, currency: string) {
  const { error } = await supabase.rpc("update_user_currency", { p_currency: currency });
  if (error) throw error;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
      isMetaMask?: boolean;
    };
  }
}

export async function connectBrowserWallet(): Promise<{ address: string; label: string } | null> {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const address = accounts[0];
  if (!address) return null;
  const label = window.ethereum.isMetaMask ? "MetaMask" : "Web3 Wallet";
  return { address, label };
}
