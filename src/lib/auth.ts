import { supabase } from "./supabase";

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  return supabase.auth.signOut();
}
