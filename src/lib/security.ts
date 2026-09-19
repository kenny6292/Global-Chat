import { supabase } from "./supabase";

export async function updatePassword(password: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOutOtherSessions() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) throw error;
}

export async function listMfaFactors() {
  if (!supabase) return { totp: [], phone: [] };
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
}

export async function enrollTotp(friendlyName = "Global Chat authenticator") {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });
  if (error) throw error;
  return data;
}

export async function unenrollMfa(factorId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
