import { supabase } from "./supabase";

export type Topic = {
  id: string;
  slug: string;
  name: string;
  description: string;
  follower_count: number;
  created_at: string;
};

async function requireUserId() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication required.");
  return data.user.id;
}

export async function listTopics(limit = 30) {
  if (!supabase) return [] as Topic[];
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("follower_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function listMyTopicFollows() {
  if (!supabase) return [] as string[];
  const { data, error } = await supabase
    .from("topic_follows")
    .select("topic_id");
  if (error) throw error;
  return (data ?? []).map((row) => row.topic_id as string);
}

export async function followTopic(topicId: string) {
  await requireUserId();
  const { error } = await supabase!.from("topic_follows").insert({ topic_id: topicId, user_id: (await requireUserId()) });
  if (error) throw error;
}

export async function unfollowTopic(topicId: string) {
  await requireUserId();
  const { error } = await supabase!.from("topic_follows").delete().eq("topic_id", topicId);
  if (error) throw error;
}
