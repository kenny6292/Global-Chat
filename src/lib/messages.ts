import { supabase } from "./supabase";

export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function listConversations() {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data, error } = await client
    .from("conversations")
    .select("id, created_at, updated_at, conversation_participants!inner(user_id)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Conversation[];
}

export async function listMessages(conversationId: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data, error } = await client
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(conversationId: string, body: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error("Message cannot be empty.");

  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data, error } = await client
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: cleanBody })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export function subscribeToConversation(conversationId: string, onMessage: (message: Message) => void) {
  if (!supabase) return () => {};
  const client = supabase;

  const channel = client
    .channel(`conversation:${conversationId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    }, payload => onMessage(payload.new as Message))
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export async function createDirectConversation(otherUserId: string) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (user.id === otherUserId) throw new Error("You cannot message yourself.");

  const { data: conversation, error: conversationError } = await client
    .from("conversations")
    .insert({ created_by: user.id })
    .select("id, created_at, updated_at")
    .single();
  if (conversationError) throw conversationError;

  const { error: participantsError } = await client
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);
  if (participantsError) throw participantsError;

  return conversation as Conversation;
}
