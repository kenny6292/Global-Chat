import { supabase } from "./supabase";

export type Notification = {
  id: string;
  user_id: string;
  type: "message" | "community" | "system";
  title: string;
  body: string;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(limit = 50) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data, error } = await client.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

export function subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void) {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client.channel(`notifications:${userId}`).on("postgres_changes", {
    event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}`,
  }, payload => onNotification(payload.new as Notification)).subscribe();
  return () => { void client.removeChannel(channel); };
}
