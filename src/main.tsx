import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { signIn, signUp, signOut } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { getMyProfile, saveMyProfile, discoverProfiles, type Profile } from "./lib/profiles";
import { listConversations, listMessages, sendMessage, subscribeToConversation, createDirectConversation, type Message } from "./lib/messages";
import { listCommunities, joinCommunity, listCommunityMessages, sendCommunityMessage, subscribeToCommunity, type Community, type CommunityMessage } from "./lib/communities";
import { countries, getCountryStats, type CountryStat } from "./lib/countries";
import { listNotifications, markNotificationRead, subscribeToNotifications, type Notification } from "./lib/notifications";
import { getAdminStats, listOpenReports, updateReportStatus, listAdminUsers, setUserStatus, setUserRole, listAuditLogs, type AdminStats, type AdminUser, type AdminAuditLog } from "./lib/admin";
import { extendedFeatures, extendedFeed, extendedStories } from "./lib/extended";
import { listFeed, createPost, togglePostReaction, listPostReactionCounts, listMyPostReactions, createComment, savePost, listSavedPosts, type Post } from "./lib/social";
import { NextFeaturesPanel } from "./NextFeaturesPanel";
import { MessengerPanel, NotificationsPanel, GroupsPanel } from "./SocialPanels";
import "./styles.css";

const rooms = [["🌎","Global Lounge","12.4K online"],["💻","Technology","8.7K online"],["🎮","Gaming","6.2K online"],["💼","Business","4.8K online"],["🎵","Music","3.9K online"],["✈️","Travel","2.7K online"]];

function AuthScreen(){const[mode,setMode]=useState<"signin"|"signup">("signin");const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const r=mode==="signin"?await signIn(email,password):await signUp(email,password);if(r.error)throw r.error;setMessage(mode==="signup"?"Account created. Check your email if confirmation is enabled.":"Signed in successfully.");}catch(err){setMessage(err instanceof Error?err.message:"Authentication failed.");}finally{setBusy(false);}}return <div className="auth-shell"><div className="auth-card"><div className="brand"><span className="logo">◎</span><span>Global Chat</span></div><span className="eyebrow">{mode==="signin"?"WELCOME BACK":"JOIN THE WORLD"}</span><h1>{mode==="signin"?"Sign in":"Create your account"}</h1><p>{mode==="signin"?"Continue your conversations across borders.":"Create your identity and start meeting people globally."}</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary wide" disabled={busy}>{busy?"Please wait…":mode==="signin"?"Sign in →":"Create account →"}</button></form>{message&&<div className="notice">{message}</div>}<button className="switch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("")}}>{mode==="signin"?"New here? Create an account":"Already have an account? Sign in"}</button></div></div>}

function ProfileOnboarding({onComplete}:{onComplete:()=>void}){const[displayName,setDisplayName]=useState("");const[username,setUsername]=useState("");const[country,setCountry]=useState("UN");const[bio,setBio]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await saveMyProfile({display_name:displayName.trim(),username:username.trim().toLowerCase(),country_code:country.toUpperCase(),bio,interests:[],onboarding_complete:true});onComplete();}catch(err){setError(err instanceof Error?err.message:"Could not save profile.");}finally{setBusy(false);}}return <div className="auth-shell"><div className="auth-card"><div className="brand"><span className="logo">◎</span><span>Global Chat</span></div><span className="eyebrow">YOUR GLOBAL IDENTITY</span><h1>Complete your profile</h1><p>This information powers your public profile and discovery features.</p><form onSubmit={submit}><label>Display name<input required value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/></label><label>Username<input required pattern="[A-Za-z0-9_]{3,30}" value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username"/></label><label>Country code<input required maxLength={3} value={country} onChange={e=>setCountry(e.target.value)} placeholder="NG"/></label><label>Bio<textarea maxLength={500} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell the world a little about you"/></label><button className="primary wide" disabled={busy}>{busy?"Saving…":"Enter Global Chat →"}</button></form>{error&&<div className="notice error">{error}</div>}</div></div>}

function DiscoverPanel(){const[profiles,setProfiles]=useState<Profile[]>([]);const[search,setSearch]=useState("");const[country,setCountry]=useState("ALL");const[loading,setLoading]=useState(true);const[error,setError]=useState("");async function load(){setLoading(true);setError("");try{setProfiles(await discoverProfiles({search,countryCode:country,limit:30}));}catch(e){setError(e instanceof Error?e.message:"Could not load people.");}finally{setLoading(false);}}useEffect(()=>{void load();},[country]);return <section className="discover-panel"><div className="discover-hero"><span className="eyebrow">GLOBAL DISCOVERY</span><h1>Meet people from around the world.</h1><p>Search public profiles and discover new conversations by name, username, bio, or country.</p><div className="discover-controls"><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&void load()} placeholder="Search people…"/><select value={country} onChange={e=>setCountry(e.target.value)}><option value="ALL">All countries</option><option value="NG">Nigeria</option><option value="GB">United Kingdom</option><option value="US">United States</option><option value="ES">Spain</option><option value="NL">Netherlands</option><option value="CA">Canada</option><option value="DE">Germany</option><option value="FR">France</option></select><button className="primary" onClick={()=>void load()}>Search</button></div></div>{error&&<div className="notice error">{error}</div>}{loading?<div className="empty">Finding people…</div>:profiles.length===0?<div className="empty">No public profiles matched your search.</div>:<div className="profile-grid">{profiles.map(p=><article className="profile-card" key={p.id}><div className="avatar">{p.avatar_url?<img src={p.avatar_url} alt="" />:p.display_name.slice(0,2).toUpperCase()}</div><h3>{p.display_name}</h3><small>@{p.username} · {p.country_code}</small><p>{p.bio||"No bio yet."}</p><button className="secondary" onClick={async()=>{try{const conversation=await createDirectConversation(p.id);window.dispatchEvent(new CustomEvent("global-chat-open-conversation",{detail:conversation.id}));}catch(e){setError(e instanceof Error?e.message:"Could not start conversation.");}}}>Message →</button></article>)}</div>}</section>}

function ExplorePanel(){
  const[active,setActive]=useState("all");
  const[post,setPost]=useState("");
  const[posts,setPosts]=useState<Post[]>([]);
  const[counts,setCounts]=useState<Record<string,number>>({});
  const[liked,setLiked]=useState<string[]>([]);
  const[saved,setSaved]=useState<string[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const categories=[["all","All features"],["social","Social"],["community","Communities"],["professional","Opportunities"],["creator","Creators"]];
  async function loadFeed(){
    setLoading(true);setError("");
    try{
      const rows=await listFeed(30); setPosts(rows);
      const ids=rows.map(x=>x.id);
      const [reactionCounts,myReactions]=await Promise.all([listPostReactionCounts(ids),listMyPostReactions(ids)]);
      setCounts(reactionCounts);setLiked(myReactions);
    }catch(e){setError(e instanceof Error?e.message:"Could not load global feed.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void loadFeed();},[]);
  async function publish(e:React.FormEvent){
    e.preventDefault(); if(!post.trim())return;
    try{const created=await createPost({content:post});setPosts(x=>[created,...x]);setPost("");}
    catch(e){setError(e instanceof Error?e.message:"Could not publish post.");}
  }
  async function react(id:string){
    try{const active=await togglePostReaction(id);setLiked(x=>active?[...x,id]:x.filter(v=>v!==id));setCounts(x=>({...x,[id]:Math.max(0,(x[id]??0)+(active?1:-1))}));}
    catch(e){setError(e instanceof Error?e.message:"Reaction failed.");}
  }
  async function save(id:string){
    try{const active=await savePost(id);setSaved(x=>active?[...x,id]:x.filter(v=>v!==id));}
    catch(e){setError(e instanceof Error?e.message:"Save failed.");}
  }
  const visible=active==="all"?extendedFeatures:extendedFeatures.filter(f=>f.id===active);
  return <section className="explore-panel">
    <div className="explore-hero"><span className="eyebrow">GLOBAL CHAT ECOSYSTEM</span><h1>More than messaging. A global social network.</h1><p>Discover people, communities, creators and conversations across borders.</p><div className="feature-filters">{categories.map(([id,label])=><button key={id} className={active===id?"filter active":"filter"} onClick={()=>setActive(id)}>{label}</button>)}</div></div>
    <div className="feature-grid">{visible.map(f=><article className="feature-card" key={f.id}><div className="feature-icon">{f.icon}</div><span className={f.status==="available"?"status ready":"status"}>{f.status==="available"?"Available in app":"Expansion planned"}</span><h3>{f.title}</h3><p>{f.description}</p><button className="secondary" disabled={f.status==="coming-soon"}>{f.status==="available"?"Open feature":"Coming soon"}</button></article>)}</div>
    <div className="explore-columns"><section className="card feed-card"><div className="card-head"><div><span className="eyebrow">GLOBAL FEED</span><h2>What the world is talking about</h2></div><button className="secondary" onClick={()=>void loadFeed()}>Refresh</button></div>
      <form className="post-composer" onSubmit={publish}><textarea value={post} onChange={e=>setPost(e.target.value)} maxLength={10000} placeholder="Share something with the global community…"/><div><small>{post.length}/10000</small><button className="primary" disabled={!post.trim()}>Publish</button></div></form>
      {error&&<div className="notice error">{error}</div>}
      {loading?<div className="empty">Loading global feed…</div>:posts.length===0?<div className="empty">No public posts yet. Be the first to publish.</div>:posts.map(item=><article className="feed-post" key={item.id}><div className="post-avatar">GC</div><div className="post-body"><div className="post-meta"><strong>Global Chat member</strong><span>{new Date(item.created_at).toLocaleString()}</span></div><p>{item.content}</p><div className="post-actions"><button onClick={()=>void react(item.id)}>♡ {counts[item.id]??0}{liked.includes(item.id)?" · Liked":""}</button><button onClick={()=>{const text=window.prompt("Write a comment");if(text?.trim())void createComment(item.id,text).catch(e=>setError(e instanceof Error?e.message:"Comment failed."));}}>◌ Comment</button><button onClick={()=>void save(item.id)}>🔖 {saved.includes(item.id)?"Saved":"Save"}</button></div></div></article>)}
    </section><aside className="card stories-card"><div className="card-head"><div><span className="eyebrow">STORIES</span><h2>Explore moments</h2></div></div><div className="stories">{extendedStories.map(s=><button className="story" key={s.id}><span>{s.emoji}</span><strong>{s.name}</strong></button>)}</div><div className="mini-section"><span className="eyebrow">DISCOVER NEXT</span><h3>Build your global network</h3><p>Find language partners, communities, creators and professional connections based on interests.</p></div></aside></div>
  </section>
}

function SavedPanel(){
  const [posts,setPosts]=useState<Post[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  async function load(){
    setLoading(true);setError("");
    try{setPosts(await listSavedPosts(50));}
    catch(e){setError(e instanceof Error?e.message:"Could not load saved posts.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  return <section className="social-panel">
    <div className="panel-heading"><div><span className="eyebrow">SAVED</span><h1>Your saved library</h1><p>Keep useful Global Chat posts in one place.</p></div><button className="secondary" onClick={()=>void load()}>Refresh</button></div>
    {error&&<div className="notice error">{error}</div>}
    {loading?<div className="empty">Loading saved posts…</div>:posts.length===0?<div className="empty">You have no saved posts yet. Use Save on a feed post to keep it here.</div>:<div className="saved-list">{posts.map(item=><article className="feed-post" key={item.id}><div className="post-avatar">GC</div><div className="post-body"><div className="post-meta"><strong>Global Chat member</strong><span>{new Date(item.created_at).toLocaleString()}</span></div><p>{item.content}</p><div className="post-actions"><button onClick={async()=>{try{await savePost(item.id);setPosts(x=>x.filter(p=>p.id!==item.id));}catch(e){setError(e instanceof Error?e.message:"Could not remove saved post.");}}}>🔖 Remove from saved</button></div></div></article>)}</div>}
  </section>;
}

function AdminPanel(){const[stats,setStats]=useState<AdminStats|null>(null);const[reports,setReports]=useState<any[]>([]);const[users,setUsers]=useState<AdminUser[]>([]);const[logs,setLogs]=useState<AdminAuditLog[]>([]);const[tab,setTab]=useState<"overview"|"users"|"reports"|"audit">("overview");const[search,setSearch]=useState("");const[error,setError]=useState("");const[busy,setBusy]=useState(false);async function load(){setError("");try{const[s,r,u,l]=await Promise.all([getAdminStats(),listOpenReports(),listAdminUsers(search),listAuditLogs()]);setStats(s);setReports(r);setUsers(u);setLogs(l);}catch(e){setError(e instanceof Error?e.message:"Admin access denied.");}}useEffect(()=>{void load();},[]);async function status(id:string,s:"reviewing"|"resolved"|"dismissed"){setBusy(true);try{await updateReportStatus(id,s);await load();}catch(e){setError(e instanceof Error?e.message:"Could not update report.");}finally{setBusy(false);}}async function ban(u:AdminUser){setBusy(true);try{await setUserStatus(u.id,!u.is_banned,null,u.is_banned?"Reinstated by admin":"Banned by admin");await load();}catch(e){setError(e instanceof Error?e.message:"Could not update user.");}finally{setBusy(false);}}async function role(u:AdminUser,r:"student"|"university_admin"|"moderator"|"admin"){setBusy(true);try{await setUserRole(u.id,r);await load();}catch(e){setError(e instanceof Error?e.message:"Could not change role.");}finally{setBusy(false);}}return <section className="admin-panel"><div className="admin-hero"><span className="eyebrow">CONTROL CENTER</span><h1>Admin Control Center</h1><p>Platform operations, moderation, user access and audit activity.</p><div className="admin-tabs">{(["overview","users","reports","audit"] as const).map(x=><button className={tab===x?"filter active":"filter"} onClick={()=>setTab(x)} key={x}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div></div>{error&&<div className="notice error">{error}</div>}{tab==="overview"&&<><div className="admin-stats">{stats&&Object.entries(stats).map(([k,v])=><div className="admin-stat" key={k}><strong>{String(v)}</strong><span>{k}</span></div>)}</div><div className="admin-grid"><div className="admin-module"><span className="eyebrow">MODERATION</span><h2>{reports.length} open reports</h2><button className="primary" onClick={()=>setTab("reports")}>Open moderation queue →</button></div><div className="admin-module"><span className="eyebrow">USER OPERATIONS</span><h2>{users.length} users loaded</h2><button className="secondary" onClick={()=>setTab("users")}>Manage users →</button></div><div className="admin-module"><span className="eyebrow">AUDIT</span><h2>{logs.length} recent actions</h2><button className="secondary" onClick={()=>setTab("audit")}>View audit log →</button></div></div></>}{tab==="users"&&<div className="admin-module"><div className="admin-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, username or email…"/><button className="primary" onClick={()=>void load()}>Search</button></div><div className="admin-user-list">{users.map(u=><article className="admin-user" key={u.id}><div className="avatar">{(u.full_name||u.username||"U").slice(0,2).toUpperCase()}</div><div className="admin-user-main"><strong>{u.full_name||u.username||"Unnamed user"}</strong><small>@{u.username||"user"} · {u.email||"no email"} · {u.country||"—"}</small><span className={u.is_banned?"admin-badge danger":"admin-badge"}>{u.is_banned?"BANNED":u.role.toUpperCase()}</span></div><div className="admin-user-actions"><button disabled={busy} onClick={()=>void ban(u)}>{u.is_banned?"Reinstate":"Ban"}</button><select disabled={busy} value={u.role} onChange={e=>void role(u,e.target.value as "student"|"university_admin"|"moderator"|"admin")}><option value="student">Student</option><option value="university_admin">University Admin</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></div></article>)}</div></div>}{tab==="reports"&&<div className="admin-module"><h2>Moderation queue</h2>{reports.length===0?<div className="empty">No open reports.</div>:reports.map(r=><article className="report-card" key={r.id}><div><strong>{r.reason}</strong><span className="admin-badge">{r.status}</span></div><p>{r.details||"No additional details."}</p><small>{new Date(r.created_at).toLocaleString()}</small><div className="admin-actions"><button disabled={busy} onClick={()=>void status(r.id,"reviewing")}>Review</button><button disabled={busy} onClick={()=>void status(r.id,"resolved")}>Resolve</button><button disabled={busy} onClick={()=>void status(r.id,"dismissed")}>Dismiss</button></div></article>)}</div>}{tab==="audit"&&<div className="admin-module"><h2>Audit log</h2><div className="audit-list">{logs.map(l=><article className="audit-row" key={l.id}><strong>{l.action}</strong><small>{new Date(l.created_at).toLocaleString()}</small><code>{JSON.stringify(l.details)}</code></article>)}</div></div>}</section>}


function App(){
  const [session,setSession]=useState<any>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"explore"|"discover"|"messages"|"notifications"|"groups"|"events"|"saved"|"admin">("explore");
  const [error,setError]=useState("");
  useEffect(()=>{
    let mounted=true;
    async function boot(){
      try{
        if(!supabase){if(mounted)setLoading(false);return;}
        const {data}=await supabase.auth.getSession();
        if(!mounted)return;
        setSession(data.session);
        if(data.session){try{setProfile(await getMyProfile());}catch(e){setError(e instanceof Error?e.message:"Could not load your profile.");}}
      }catch(e){if(mounted)setError(e instanceof Error?e.message:"Could not initialize Global Chat.");}
      finally{if(mounted)setLoading(false);}
    }
    void boot();
    if(!supabase)return ()=>{mounted=false;};
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{
      if(!mounted)return;
      setSession(next);
      if(!next){setProfile(null);setView("explore");return;}
      void getMyProfile().then(setProfile).catch(e=>setError(e instanceof Error?e.message:"Could not load your profile."));
    });
    return ()=>{mounted=false;subscription.unsubscribe();};
  },[]);
  if(loading)return <div className="auth-shell"><div className="auth-card"><div className="brand"><span className="logo">◎</span><span>Global Chat</span></div><div className="empty">Loading Global Chat…</div></div></div>;
  if(!session)return <AuthScreen/>;
  if(!profile || !profile.onboarding_complete)return <ProfileOnboarding onComplete={()=>void getMyProfile().then(setProfile).catch(e=>setError(e instanceof Error?e.message:"Could not load profile."))}/>;
  const isAdmin=profile.role==="admin"||profile.role==="moderator";
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="logo">◎</span><span>Global Chat</span></div><nav className="main-nav">
      <button className={view==="explore"?"nav-button active":"nav-button"} onClick={()=>setView("explore")}>🏠 <span>Home</span></button>
      <button className={view==="discover"?"nav-button active":"nav-button"} onClick={()=>setView("discover")}>👥 <span>Friends</span></button>
      <button className={view==="messages"?"nav-button active":"nav-button"} onClick={()=>setView("messages")}>💬 <span>Messenger</span></button>
      <button className={view==="notifications"?"nav-button active":"nav-button"} onClick={()=>setView("notifications")}>🔔 <span>Notifications</span></button>
      <button className={view==="groups"?"nav-button active":"nav-button"} onClick={()=>setView("groups")}>👨‍👩‍👧 <span>Groups</span></button>
      <button className={view==="events"?"nav-button active":"nav-button"} onClick={()=>setView("events")}>📅 <span>Events</span></button>
      <button className={view==="saved"?"nav-button active":"nav-button"} onClick={()=>setView("saved")}>🔖 <span>Saved</span></button>
      {isAdmin&&<button className={view==="admin"?"nav-button active":"nav-button"} onClick={()=>setView("admin")}>⚙️ <span>Admin</span></button>}
    </nav><div className="topbar-actions"><span className="profile-chip">{profile.display_name||profile.username}</span><button className="secondary" onClick={async()=>{await signOut();setSession(null);setProfile(null);}}>Sign out</button></div></header>
    {error&&<div className="notice error" style={{margin:"16px auto",maxWidth:1200}}>{error}</div>}
    <main className="main-content">{view==="explore"?<ExplorePanel/>:view==="discover"?<DiscoverPanel/>:view==="messages"?<MessengerPanel currentUserId={profile.id}/>:view==="notifications"?<NotificationsPanel userId={profile.id}/>:view==="groups"?<GroupsPanel/>:view==="events"?<section className="social-panel"><div className="panel-heading"><div><span className="eyebrow">EVENTS</span><h1>Discover events</h1><p>Event creation, RSVP and reminders are ready for the next data layer.</p></div></div><div className="empty">Events module is not connected yet.</div></section>:view==="saved"?<SavedPanel/>:<AdminPanel/>}</main>
    <nav className="mobile-bottom-nav">
      <button className={view==="explore"?"active":""} onClick={()=>setView("explore")}><span>🏠</span>Home</button>
      <button className={view==="discover"?"active":""} onClick={()=>setView("discover")}><span>👥</span>Friends</button>
      <button className={view==="messages"?"active":""} onClick={()=>setView("messages")}><span>💬</span>Chat</button>
      <button className={view==="notifications"?"active":""} onClick={()=>setView("notifications")}><span>🔔</span>Alerts</button>
      <button className={view==="groups"?"active":""} onClick={()=>setView("groups")}><span>👥</span>Groups</button>
    </nav>
  </div>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
