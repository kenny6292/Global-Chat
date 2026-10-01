import { supabase } from "./supabase";

export type AdminStats={users:number;communities:number;messages:number;openReports:number};

export async function getAdminStats():Promise<AdminStats>{
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.rpc("get_admin_stats");
 if(error) throw error;
 return data as AdminStats;
}

export async function listOpenReports(){
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.from("reports").select("*").eq("status","open").order("created_at",{ascending:false}).limit(100);
 if(error) throw error; return data??[];
}

export async function updateReportStatus(id:string,status:"reviewing"|"resolved"|"dismissed"){
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.rpc("moderate_report",{report_id:id,new_status:status});
 if(error) throw error; return data;
}


export type AdminUser={id:string;username:string|null;full_name:string;email:string|null;country:string|null;role:string;is_banned:boolean;suspended_until:string|null;created_at:string};
export type AdminAuditLog={id:string;actor_id:string;action:string;target_user_id:string|null;target_report_id:string|null;details:Record<string,unknown>;created_at:string};

export async function listAdminUsers(searchTerm="",pageSize=50,pageOffset=0):Promise<AdminUser[]>{
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.rpc("admin_list_users",{search_term:searchTerm,page_size:pageSize,page_offset:pageOffset});
 if(error) throw error; return (data??[]) as AdminUser[];
}
export async function setUserStatus(targetUser:string,ban=false,suspendUntil:string|null=null,note:string|null=null){
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.rpc("admin_set_user_status",{target_user:targetUser,ban,suspend_until:suspendUntil,note});
 if(error) throw error; return data;
}
export async function setUserRole(targetUser:string,newRole:"student"|"university_admin"|"moderator"|"admin"){
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.rpc("admin_set_user_role",{target_user:targetUser,new_role:newRole});
 if(error) throw error; return data;
}
export async function listAuditLogs(limit=100):Promise<AdminAuditLog[]>{
 if(!supabase) throw new Error("Supabase is not configured yet.");
 const {data,error}=await supabase.rpc("admin_list_audit_logs",{page_size:limit});
 if(error) throw error; return (data??[]) as AdminAuditLog[];
}
