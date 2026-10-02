import { supabase } from "./supabase";

export type Post = {
  id:string;
  author_id:string;
  content:string;
  visibility:"public"|"connections"|"private";
  media_url:string|null;
  media_type:string|null;
  feeling:string|null;
  created_at:string;
  updated_at:string;
};

export async function listFeed(limit=30):Promise<Post[]>{
  if(!supabase) return [];
  const {data,error}=await supabase.from("posts").select("*").eq("visibility","public").order("created_at",{ascending:false}).limit(Math.min(Math.max(limit,1),100));
  if(error) throw error;
  return (data??[]) as Post[];
}

export async function createPost(input:{content:string;visibility?:Post["visibility"];media_url?:string|null;media_type?:string|null;feeling?:string|null}):Promise<Post>{
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("You must be signed in.");
  const content=input.content.trim();
  if(!content) throw new Error("Post content is required.");
  const {data,error}=await supabase.from("posts").insert({author_id:user.id,content,visibility:input.visibility??"public",media_url:input.media_url??null,media_type:input.media_type??null,feeling:input.feeling??null}).select().single();
  if(error) throw error;
  return data as Post;
}

export async function togglePostReaction(postId:string):Promise<boolean>{
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("You must be signed in.");
  const {data:existing,error:readError}=await supabase.from("post_reactions").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
  if(readError) throw readError;
  if(existing){
    const {error}=await supabase.from("post_reactions").delete().eq("post_id",postId).eq("user_id",user.id);
    if(error) throw error;
    return false;
  }
  const {error}=await supabase.from("post_reactions").insert({post_id:postId,user_id:user.id});
  if(error) throw error;
  return true;
}

export async function listPostReactionCounts(postIds:string[]):Promise<Record<string,number>>{
  if(!supabase || postIds.length===0) return {};
  const {data,error}=await supabase.from("post_reactions").select("post_id").in("post_id",postIds);
  if(error) throw error;
  return (data??[]).reduce<Record<string,number>>((acc,row)=>{acc[row.post_id]=(acc[row.post_id]??0)+1;return acc;},{});
}

export async function listMyPostReactions(postIds:string[]):Promise<string[]>{
  if(!supabase || postIds.length===0) return [];
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return [];
  const {data,error}=await supabase.from("post_reactions").select("post_id").eq("user_id",user.id).in("post_id",postIds);
  if(error) throw error;
  return (data??[]).map(row=>row.post_id);
}

export async function createComment(postId:string,content:string,parentId?:string|null){
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("You must be signed in.");
  const {data,error}=await supabase.from("comments").insert({post_id:postId,author_id:user.id,content:content.trim(),parent_id:parentId??null}).select().single();
  if(error) throw error;
  return data;
}

export async function savePost(postId:string):Promise<boolean>{
  if(!supabase) throw new Error("Supabase is not configured yet.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("You must be signed in.");
  const {data:existing,error:readError}=await supabase.from("saved_posts").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
  if(readError) throw readError;
  if(existing){const {error}=await supabase.from("saved_posts").delete().eq("post_id",postId).eq("user_id",user.id);if(error) throw error;return false;}
  const {error}=await supabase.from("saved_posts").insert({post_id:postId,user_id:user.id});
  if(error) throw error;
  return true;
}


export async function listSavedPosts(limit=50):Promise<Post[]>{
  if(!supabase) return [];
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) throw new Error("You must be signed in.");
  const {data,error}=await supabase.from("saved_posts").select("post_id, posts(*)").eq("user_id",user.id).order("created_at",{ascending:false}).limit(Math.min(Math.max(limit,1),100));
  if(error) throw error;
  return (data??[]).map((row:any)=>row.posts).filter(Boolean) as Post[];
}
