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
