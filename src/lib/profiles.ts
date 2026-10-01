import { supabase } from "./supabase";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  country_code: string;
  avatar_url: string | null;
  cover_url?: string | null;
  interests: string[];
  onboarding_complete: boolean;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

function mapProfile(row: any): Profile {
  return {
    ...row,
    display_name: row.display_name ?? row.full_name ?? "",
    country_code: row.country_code ?? row.country ?? "UN",
    interests: Array.isArray(row.interests) ? row.interests : [],
    onboarding_complete: row.onboarding_complete ?? Boolean(row.username && row.full_name),
  };
}

export async function getMyProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function saveMyProfile(profile: Partial<Omit<Profile, "id">>) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const payload: Record<string, unknown> = { id: user.id };
  if (profile.username !== undefined) payload.username = profile.username;
  if (profile.display_name !== undefined) payload.full_name = profile.display_name;
  if (profile.bio !== undefined) payload.bio = profile.bio;
  if (profile.country_code !== undefined) payload.country = profile.country_code;
  if (profile.avatar_url !== undefined) payload.avatar_url = profile.avatar_url;
  if (profile.cover_url !== undefined) payload.cover_url = profile.cover_url;
  if (profile.interests !== undefined) payload.interests = profile.interests;

  const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select().single();
  if (error) throw error;
  return mapProfile(data);
}

export async function discoverProfiles(options: { query?: string; search?: string; countryCode?: string; limit?: number } = {}): Promise<Profile[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  let query = supabase.from("profiles").select("*").neq("id", user.id).order("created_at", { ascending: false }).limit(limit);
  const search = (options.search ?? options.query)?.trim();
  if (search) {
    const safe = search.replace(/[%_]/g, "\\$&");
    query = query.or(`username.ilike.%${safe}%,full_name.ilike.%${safe}%,bio.ilike.%${safe}%`);
  }
  if (options.countryCode && options.countryCode !== "ALL") query = query.eq("country", options.countryCode.toUpperCase());
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProfile);
}
