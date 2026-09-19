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

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function saveMyProfile(profile: Partial<Omit<Profile, "id">>) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...profile }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
