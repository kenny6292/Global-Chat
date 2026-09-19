import React, { useEffect, useMemo, useState } from "react";
import "./next-features.css";
import { supabase } from "./lib/supabase";
import { discoverProfiles, type Profile } from "./lib/profiles";
import { listMyConnections, sendConnectionRequest, updateConnection, type Connection } from "./lib/network";
import { listTopics, listMyTopicFollows, followTopic, unfollowTopic, type Topic } from "./lib/topics";
import { getMyPreferences, saveMyPreferences, type UserPreferences } from "./lib/preferences";
import { startGlobalPresence, stopPresence, type PresenceStatus } from "./lib/presence";
import { enrollTotp, listMfaFactors, signOutOtherSessions, unenrollMfa, updatePassword } from "./lib/security";

type Tab = "network" | "trending" | "security" | "settings";

const fallbackPeople = [
  {name:"Amina Yusuf", handle:"@aminay", country:"NG", role:"Product Designer", status:"Online", interests:["Design","Tech"]},
  {name:"Daniel Brooks", handle:"@danbrooks", country:"GB", role:"Developer", status:"Away", interests:["JavaScript","AI"]},
  {name:"Sofia Martins", handle:"@sofia_m", country:"BR", role:"Creator", status:"Online", interests:["Travel","Music"]},
  {name:"Noah Chen", handle:"@noahc", country:"CA", role:"Founder", status:"Busy", interests:["Business","Startups"]}
];

const fallbackTrends = [
  ["#BuildInPublic","18.4K posts","Creators are sharing what they are building."],
  ["#TechAcrossBorders","12.8K posts","Global developers are connecting around technology."],
  ["#LanguageExchange","9.6K posts","Find conversation partners and practice together."],
  ["#WorldTravel","7.2K posts","Share destinations, tips and experiences."]
];

export function NextFeaturesPanel(){
  const [tab,setTab]=useState<Tab>("network");
  const [query,setQuery]=useState("");
  const [people,setPeople]=useState<Profile[]>([]);
  const [connections,setConnections]=useState<Connection[]>([]);
  const [topics,setTopics]=useState<Topic[]>([]);
  const [follows,setFollows]=useState<string[]>([]);
  const [prefs,setPrefs]=useState<Partial<UserPreferences>>({});
  const [status,setStatus]=useState<PresenceStatus>("online");
  const [mfaFactors,setMfaFactors]=useState<{totp?: unknown[]} | null>(null);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const totpFactors = mfaFactors?.totp ?? [];

  useEffect(()=>{ let mounted=true;
    (async()=>{
      try {
        const [p,c,t,f,pr] = await Promise.all([
          discoverProfiles({query:"",limit:30}),
          listMyConnections(), listTopics(), listMyTopicFollows(), getMyPreferences()
        ]);
        if(mounted){setPeople(p);setConnections(c);setTopics(t);setFollows(f);if(pr)setPrefs(pr);}
      } catch(e){ if(mounted)setNotice(e instanceof Error?e.message:"Unable to load network data."); }
    })();
    return()=>{mounted=false};
  },[]);

  useEffect(()=>{
    let channel: Awaited<ReturnType<typeof startGlobalPresence>> = null;
    if(!supabase)return;
    (async()=>{try{const {data}=await supabase.auth.getUser();if(data.user)channel=await startGlobalPresence(data.user.id,status);}catch{}})();
    return()=>{if(channel)void stopPresence(channel);};
  },[status]);

  const filtered=useMemo(()=>{
    if(people.length===0)return fallbackPeople.filter(p=>!query.trim()||(p.name+" "+p.handle+" "+p.role+" "+p.country+" "+p.interests.join(" ")).toLowerCase().includes(query.toLowerCase()));
    return people.filter(p=>!query.trim()||(p.display_name+" @"+p.username+" "+(p.bio??"")+" "+p.country_code+" "+p.interests.join(" ")).toLowerCase().includes(query.toLowerCase()));
  },[people,query]);

  const connectionFor=(id:string)=>connections.find(c=>c.requester_id===id||c.addressee_id===id);
  const connect=async(id:string)=>{
    if(!supabase){setNotice("Connect Supabase to send real connection requests.");return;}
    setBusy(true);try{const c=await sendConnectionRequest(id);setConnections(x=>[c,...x]);setNotice("Connection request sent.");}catch(e){setNotice(e instanceof Error?e.message:"Connection request failed.");}finally{setBusy(false);}
  };
  const changePref=async(key:keyof UserPreferences,value:boolean|string)=>{
    const next={...prefs,[key]:value};setPrefs(next);
    if(!supabase){setNotice("Preference saved locally until Supabase is connected.");return;}
    try{const saved=await saveMyPreferences(next);setPrefs(saved);}catch(e){setNotice(e instanceof Error?e.message:"Preference save failed.");}
  };
  const toggleTopic=async(id:string)=>{
    if(!supabase){setNotice("Connect Supabase to follow topics.");return;}
    try{if(follows.includes(id)){await unfollowTopic(id);setFollows(x=>x.filter(v=>v!==id));}else{await followTopic(id);setFollows(x=>[...x,id]);}}catch(e){setNotice(e instanceof Error?e.message:"Topic update failed.");}
  };

  return <section className="next-features-panel">
    <div className="next-hero"><div><span className="eyebrow">GLOBAL NETWORK</span><h1>Your world, organized in one place.</h1><p>Discover people, follow global trends, manage your presence and review account security from a single workspace.</p></div><div className="status-control"><span className="status-dot"></span><select value={status} onChange={e=>setStatus(e.target.value as PresenceStatus)}><option value="online">Online</option><option value="away">Away</option><option value="busy">Busy</option><option value="invisible">Invisible</option></select></div></div>
    {notice&&<div className="card next-card"><p className="muted">{notice}</p></div>}
    <div className="next-tabs">{([["network","People & Connections"],["trending","Trending"],["security","Security Center"],["settings","Preferences"]] as [Tab,string][]).map(([id,label])=><button className={tab===id?"next-tab active":"next-tab"} key={id} onClick={()=>setTab(id)}>{label}</button>)}</div>

    {tab==="network"&&<div className="next-grid"><section className="card next-card"><div className="card-head"><div><span className="eyebrow">DISCOVER PEOPLE</span><h2>Build your network</h2></div></div><input className="next-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, skill, interest or country…"/><div className="connection-list">{filtered.map((p:any)=>{const id=p.id??p.handle;const c=connectionFor(id);return <article className="connection-card" key={id}><div className="connection-avatar">{(p.display_name??p.name).slice(0,2).toUpperCase()}</div><div className="connection-info"><strong>{p.display_name??p.name}</strong><small>{p.username?"@"+p.username:p.handle} · {p.country_code??p.country}</small><p>{p.bio||p.role}</p><div className="chips">{(p.interests??[]).map((i:string)=><span key={i}>{i}</span>)}</div></div>{c?.status==="accepted"?<button className="secondary connected">Connected</button>:c?.status==="pending"?<button className="secondary" disabled>Pending</button>:<button className="primary" disabled={busy||!p.id} onClick={()=>connect(p.id)}>Connect</button>}</article>})}</div></section><aside className="card next-card"><span className="eyebrow">YOUR NETWORK</span><h2>Connection activity</h2><div className="network-stat"><strong>{connections.filter(c=>c.status==="accepted").length}</strong><span>accepted connections</span></div><div className="network-stat"><strong>{connections.filter(c=>c.status==="pending").length}</strong><span>pending requests</span></div><div className="network-stat"><strong>{status}</strong><span>current presence</span></div></aside></div>}

    {tab==="trending"&&<section className="card next-card"><div className="card-head"><div><span className="eyebrow">GLOBAL TRENDS</span><h2>Topics people are exploring</h2></div></div><div className="trend-grid">{(topics.length?topics:fallbackTrends.map(([tag,count,desc])=>({id:tag,slug:tag.slice(1).toLowerCase(),name:tag,description:desc,follower_count:count,created_at:""} as any))).map((t:any)=><article className="trend-card" key={t.id}><strong>{t.name}</strong><span>{typeof t.follower_count==="number"?t.follower_count+" followers":t.follower_count}</span><p>{t.description}</p><button className="secondary" onClick={()=>toggleTopic(t.id)}>{follows.includes(t.id)?"Following":"Follow topic"}</button></article>)}</div></section>}

    {tab==="security"&&<div className="next-grid"><section className="card next-card"><span className="eyebrow">ACCOUNT PROTECTION</span><h2>Security Center</h2><div className="security-row"><span>🔐 Password authentication</span><b>Enabled</b></div><div className="security-row"><span>📱 Other sessions</span><button className="secondary" onClick={async()=>{try{await signOutOtherSessions();setNotice("Other sessions signed out.");}catch(e){setNotice(e instanceof Error?e.message:"Unable to sign out other sessions.");}}}>Sign out others</button></div><div className="security-row"><span>🛡️ Two-factor authentication</span><button className="secondary" onClick={async()=>{try{const f=await listMfaFactors();setMfaFactors(f);if(!f.totp?.length){await enrollTotp();setNotice("TOTP enrollment started. Finish verification in your authenticator flow.");}else setNotice("TOTP factor is already enrolled.");}catch(e){setNotice(e instanceof Error?e.message:"MFA setup failed.");}}}>{totpFactors.length?"Enabled":"Set up"}</button></div>{totpFactors.length>0&&<button className="secondary" onClick={async()=>{try{await unenrollMfa((totpFactors[0] as any).id);setMfaFactors(null);setNotice("MFA factor removed.");}catch(e){setNotice(e instanceof Error?e.message:"Unable to remove MFA.");}}}>Remove TOTP</button>}<div className="security-row"><span>🔑 Passkeys</span><b>Auth provider dependent</b></div></section><section className="card next-card"><span className="eyebrow">PASSWORD</span><h2>Change password</h2><button className="secondary" onClick={async()=>{const password=window.prompt("Enter a new password (minimum 8 characters):");if(password)try{await updatePassword(password);setNotice("Password updated.");}catch(e){setNotice(e instanceof Error?e.message:"Password update failed.");}}}>Change password</button></section></div>}

    {tab==="settings"&&<div className="next-grid"><section className="card next-card"><span className="eyebrow">PREFERENCES</span><h2>Personalize Global Chat</h2>{([["email_notifications","Email notifications"],["message_notifications","Message notifications"],["community_activity","Community activity"],["reduce_motion","Reduce motion"],["discoverable_profile","Discoverable profile"],["allow_connection_requests","Allow connection requests"],["show_online_status","Show online status"]] as [keyof UserPreferences,string][]).map(([key,label])=><label className="toggle-row" key={key}>{label}<input type="checkbox" checked={Boolean(prefs[key]??(key!=="reduce_motion"))} onChange={e=>void changePref(key,e.target.checked)}/></label>)}</section><section className="card next-card"><span className="eyebrow">LANGUAGE</span><h2>Global communication</h2><select className="next-search" value={String(prefs.language??"en")} onChange={e=>void changePref("language",e.target.value)}><option value="en">English</option><option value="fr">French</option><option value="es">Spanish</option><option value="pt">Portuguese</option><option value="ar">Arabic</option><option value="de">German</option></select><p className="muted">Language preference is persisted when the Global Chat backend is connected.</p></section></div>}
  </section>
}
