import { supabase } from "./supabase";

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  country_code: string;
  owner_id: string;
  created_at: string;
};

export type CommunityMessage = {
  id: string;
  community_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function listCommunities() {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data, error } = await client.from("communities").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Community[];
}

export async function joinCommunity(communityId: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { error } = await client.from("community_members").upsert(
    { community_id: communityId, user_id: user.id },
    { onConflict: "community_id,user_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function listCommunityMessages(communityId: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data, error } = await client.from("community_messages").select("*").eq("community_id", communityId).order("created_at", { ascending: true }).limit(200);
  if (error) throw error;
  return (data ?? []) as CommunityMessage[];
}

export async function sendCommunityMessage(communityId: string, body: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error("Message cannot be empty.");
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data, error } = await client.from("community_messages").insert({
    community_id: communityId,
    sender_id: user.id,
    body: cleanBody,
  }).select().single();
  if (error) throw error;
  return data as CommunityMessage;
}

export function subscribeToCommunity(communityId: string, onMessage: (message: CommunityMessage) => void) {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client.channel(`community:${communityId}`).on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "community_messages",
    filter: `community_id=eq.${communityId}`,
  }, payload => onMessage(payload.new as CommunityMessage)).subscribe();
  return () => { void client.removeChannel(channel); };
}
