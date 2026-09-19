import { supabase } from "./supabase";

export type ConnectionStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

export async function listMyConnections() {
  if (!supabase) return [] as Connection[];
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Connection[];
}

export async function sendConnectionRequest(addresseeId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required.");
  const { data, error } = await supabase
    .from("connections")
    .insert({ requester_id: userData.user.id, addressee_id: addresseeId })
    .select()
    .single();
  if (error) throw error;
  return data as Connection;
}

export async function updateConnection(id: string, status: ConnectionStatus) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("connections")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Connection;
}
