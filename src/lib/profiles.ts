import { supabase } from "./supabase";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  country_code: string;
  avatar_url: string | null;
  interests: string[];
  onboarding_complete: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function getMyProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function saveMyProfile(profile: Partial<Omit<Profile, "id">>) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data, error } = await supabase.from("profiles").upsert({ id: user.id, ...profile }, { onConflict: "id" }).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function discoverProfiles(options: { query?: string; search?: string; countryCode?: string; limit?: number } = {}): Promise<Profile[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  let query = supabase.from("profiles").select("*").eq("onboarding_complete", true).neq("id", user.id).order("created_at", { ascending: false }).limit(limit);
  const search = (options.search ?? options.query)?.trim();
  if (search) {
    const safe = search.replace(/[%_]/g, "\\$&");
    query = query.or(`username.ilike.%${safe}%,display_name.ilike.%${safe}%,bio.ilike.%${safe}%`);
  }
  if (options.countryCode && options.countryCode !== "ALL") query = query.eq("country_code", options.countryCode.toUpperCase());
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}
