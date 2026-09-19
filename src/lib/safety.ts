import { supabase } from "./supabase";

export type Block = { blocker_id:string; blocked_id:string; created_at:string };
export type Report = { id:string; reporter_id:string; reported_user_id:string|null; message_id:string|null; reason:string; details:string; status:"open"|"reviewing"|"resolved"|"dismissed"; created_at:string };

export async function blockUser(blockedId:string){
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("You must be signed in.");
  if(user.id===blockedId) throw new Error("You cannot block yourself.");
  const {error}=await supabase.from("user_blocks").upsert({blocker_id:user.id,blocked_id:blockedId},{onConflict:"blocker_id,blocked_id",ignoreDuplicates:true});
  if(error) throw error;
}
export async function unblockUser(blockedId:string){
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("You must be signed in.");
  const {error}=await supabase.from("user_blocks").delete().eq("blocker_id",user.id).eq("blocked_id",blockedId);
  if(error) throw error;
}
export async function reportUser(input:{reportedUserId?:string;messageId?:string;reason:string;details?:string}){
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("You must be signed in.");
  const reason=input.reason.trim(); if(!reason) throw new Error("A report reason is required.");
  const {data,error}=await supabase.from("reports").insert({reporter_id:user.id,reported_user_id:input.reportedUserId??null,message_id:input.messageId??null,reason,details:(input.details??"").trim()}).select().single();
  if(error) throw error; return data as Report;
}
export async function listMyBlocks(){if(!supabase) throw new Error("Supabase is not configured yet.");const {data:{user}}=await supabase.auth.getUser();if(!user) throw new Error("You must be signed in.");const {data,error}=await supabase.from("user_blocks").select("*").eq("blocker_id",user.id);if(error)throw error;return(data??[]) as Block[];}
