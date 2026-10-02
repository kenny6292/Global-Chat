import { supabase } from "./supabase";

export type FriendRequest = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type Group = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  privacy?: string;
  created_at: string;
  [key: string]: unknown;
};

export type EventItem = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  location?: string;
  starts_at: string;
  ends_at?: string | null;
  created_at: string;
  [key: string]: unknown;
};

async function userId() {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return user.id;
}

export async function listFriendRequests() {
  const id = await userId();
  const { data, error } = await supabase!.from("connections").select("*")
    .or(`requester_id.eq.${id},addressee_id.eq.${id}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FriendRequest[];
}

export async function sendFriendRequest(addresseeId: string) {
  const id = await userId();
  if (id === addresseeId) throw new Error("You cannot add yourself.");
  const { data: existing, error: readError } = await supabase!.from("connections").select("*")
    .or(`and(requester_id.eq.${id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${id})`)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) {
    if (existing.status === "accepted") return existing;
    throw new Error("A connection request already exists.");
  }
  const { data, error } = await supabase!.from("connections")
    .insert({ requester_id: id, addressee_id: addresseeId, status: "pending" })
    .select().single();
  if (error) throw error;
  return data as FriendRequest;
}

export async function respondToFriendRequest(requestId: string, status: "accepted" | "declined") {
  const id = await userId();
  const { data, error } = await supabase!.from("connections").update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId).eq("addressee_id", id).select().single();
  if (error) throw error;
  return data as FriendRequest;
}

export async function listGroups() {
  const { data, error } = await supabase!.from("groups").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as Group[];
}

export async function joinGroup(groupId: string) {
  const id = await userId();
  const { error } = await supabase!.from("group_members").upsert(
    { group_id: groupId, user_id: id },
    { onConflict: "group_id,user_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}

export async function listEvents() {
  const { data, error } = await supabase!.from("events").select("*").order("starts_at", { ascending: true }).limit(50);
  if (error) throw error;
  return (data ?? []) as EventItem[];
}

export async function attendEvent(eventId: string, status: "interested" | "going" = "interested") {
  const id = await userId();
  const { error } = await supabase!.from("event_attendees").upsert(
    { event_id: eventId, user_id: id, status },
    { onConflict: "event_id,user_id" }
  );
  if (error) throw error;
}

export async function createStory(input: { content: string; mediaUrl?: string | null; mediaType?: string }) {
  const id = await userId();
  const content = input.content.trim();
  if (!content && !input.mediaUrl) throw new Error("Add text or a media URL to your story.");
  const { data, error } = await supabase!.from("posts").insert({
    author_id: id,
    content,
    visibility: "public",
    media_url: input.mediaUrl ?? null,
    media_type: "story",
    feeling: input.mediaType ?? null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function listStories(limit = 30) {
  const { data, error } = await supabase!.from("posts").select("*")
    .eq("visibility", "public").eq("media_type", "story")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export function subscribeToSocial(callback: () => void) {
  if (!supabase) return () => {};
  const channel = supabase.channel("global-chat-social")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, callback)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "connections" }, callback)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "connections" }, callback)
    .subscribe();
  return () => { void supabase!.removeChannel(channel); };
}
