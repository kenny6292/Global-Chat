import { supabase } from "./supabase";

export type Call = {
  id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  kind: "voice" | "video";
  status: "ringing" | "accepted" | "declined" | "ended";
  created_at: string;
  ended_at: string | null;
};

export async function startCall(conversationId: string, calleeId: string, kind: "voice" | "video") {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (user.id === calleeId) throw new Error("You cannot call yourself.");
  const { data, error } = await client.from("calls").insert({
    conversation_id: conversationId, caller_id: user.id, callee_id: calleeId, kind, status: "ringing",
  }).select().single();
  if (error) throw error;
  return data as Call;
}

export async function updateCall(id: string, status: Call["status"]) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const client = supabase;
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  const { data, error } = await client.from("calls").update({
    status, ended_at: status === "ended" || status === "declined" ? new Date().toISOString() : null,
  }).eq("id", id).or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`).select().single();
  if (error) throw error;
  return data as Call;
}

export async function getMediaStream(video: boolean) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera/microphone access is not supported.");
  return navigator.mediaDevices.getUserMedia({ audio: true, video });
}

export function subscribeToCall(callId: string, onCall: (call: Call) => void) {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client.channel(`call:${callId}`).on("postgres_changes", {
    event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${callId}`,
  }, payload => onCall(payload.new as Call)).subscribe();
  return () => { void client.removeChannel(channel); };
}
