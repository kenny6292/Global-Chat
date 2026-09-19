import { supabase } from "./supabase";

export type UserPreferences = {
  user_id: string;
  email_notifications: boolean;
  message_notifications: boolean;
  community_activity: boolean;
  reduce_motion: boolean;
  discoverable_profile: boolean;
  allow_connection_requests: boolean;
  show_online_status: boolean;
  language: string;
  updated_at: string;
};

const defaults = {
  email_notifications: true,
  message_notifications: true,
  community_activity: true,
  reduce_motion: false,
  discoverable_profile: true,
  allow_connection_requests: true,
  show_online_status: true,
  language: "en",
};

export async function getMyPreferences() {
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data as UserPreferences | null;
}

export async function saveMyPreferences(
  values: Partial<Omit<UserPreferences, "user_id" | "updated_at">>,
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required.");
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userData.user.id, ...defaults, ...values }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as UserPreferences;
}
