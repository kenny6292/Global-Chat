import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { signIn, signUp, signOut } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { getMyProfile, saveMyProfile } from "./lib/profiles";
import "./styles.css";

const rooms = [["🌎","Global Lounge","12.4K online"],["💻","Technology","8.7K online"],["🎮","Gaming","6.2K online"],["💼","Business","4.8K online"],["🎵","Music","3.9K online"],["✈️","Travel","2.7K online"]];
const people = [["AM","Amara","🇳🇬"],["JK","James","🇬🇧"],["SM","Sofia","🇪🇸"],["DK","Daniel","🇺🇸"]];

function AuthScreen() {
  const [mode,setMode] = useState<"signin"|"signup">("signin");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = mode === "signin" ? await signIn(email,password) : await signUp(email,password);
      if (result.error) throw result.error;
      setMessage(mode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Signed in successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  return <div className="auth-shell"><div className="auth-card">
    <div className="brand"><span className="logo">◎</span><span>Global Chat</span></div>
    <span className="eyebrow">{mode === "signin" ? "WELCOME BACK" : "JOIN THE WORLD"}</span>
    <h1>{mode === "signin" ? "Sign in" : "Create your account"}</h1>
    <p>{mode === "signin" ? "Continue your conversations across borders." : "Create your identity and start meeting people globally."}</p>
    <form onSubmit={submit}>
      <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
      <button className="primary wide" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in →" : "Create account →"}</button>
    </form>
    {message && <div className="notice">{message}</div>}
    <button className="switch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("")}}>
      {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
    </button>
  </div></div>;
}

function ProfileOnboarding({ onComplete }: {onComplete:()=>void}) {
  const [displayName,setDisplayName]=useState("");
  const [username,setUsername]=useState("");
  const [country,setCountry]=useState("UN");
  const [bio,setBio]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await saveMyProfile({display_name:displayName.trim(),username:username.trim().toLowerCase(),country_code:country.toUpperCase(),bio,interests:[],onboarding_complete:true}); onComplete(); }
    catch(err){ setError(err instanceof Error ? err.message : "Could not save profile."); }
    finally{setBusy(false);}
  }
  return <div className="auth-shell"><div className="auth-card">
    <div className="brand"><span className="logo">◎</span><span>Global Chat</span></div>
    <span className="eyebrow">YOUR GLOBAL IDENTITY</span><h1>Complete your profile</h1>
    <p>This information powers your public profile and future discovery features.</p>
    <form onSubmit={submit}>
      <label>Display name<input required value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/></label>
      <label>Username<input required pattern="[A-Za-z0-9_]{3,30}" value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username"/></label>
      <label>Country code<input required maxLength={3} value={country} onChange={e=>setCountry(e.target.value)} placeholder="NG"/></label>
      <label>Bio<textarea maxLength={500} value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell the world a little about you"/></label>
      <button className="primary wide" disabled={busy}>{busy ? "Saving…" : "Enter Global Chat →"}</button>
    </form>
    {error && <div className="notice error">{error}</div>}
  </div></div>;
}

function App() {
  const [session,setSession]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [needsProfile,setNeedsProfile]=useState(false);

  useEffect(()=>{
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({data})=>{
      setSession(data.session);
      if(data.session){ const profile=await getMyProfile(); setNeedsProfile(!profile?.onboarding_complete); }
      setLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async (_event,next)=>{
      setSession(next);
      if(next){ const profile=await getMyProfile(); setNeedsProfile(!profile?.onboarding_complete); } else setNeedsProfile(false);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  if(loading) return <div className="loading">Loading Global Chat…</div>;
  if(!supabase) return <AuthScreen />;
  if(!session) return <AuthScreen />;
  if(needsProfile) return <ProfileOnboarding onComplete={()=>setNeedsProfile(false)} />;

  return <div className="app"><aside className="sidebar"><div className="brand"><span className="logo">◎</span><span>Global Chat</span></div><nav>
    <a className="active">⌂ <span>Home</span></a><a>◉ <span>Discover</span></a><a>▣ <span>Messages</span><b>0</b></a><a>◌ <span>Communities</span></a><a>♡ <span>Notifications</span></a>
  </nav><div className="side-bottom"><button className="side-link">⚙ <span>Settings</span></button><button className="side-link" onClick={()=>signOut()}>↪ <span>Sign out</span></button><div className="profile-mini"><div className="avatar">GC</div><div><strong>Global Chat</strong><small>Connected</small></div></div></div></aside>
  <main><header><div className="search">⌕ <input placeholder="Search people, communities, topics..."/></div><button className="icon">☼</button><button className="profile">GC</button></header>
  <section className="hero"><div><span className="eyebrow">THE WORLD IS ONE CONVERSATION</span><h1>Connect <em>With the World.</em></h1><p>Meet people, join conversations, and build meaningful connections across borders.</p><div className="actions"><button className="primary">Start Chatting →</button><button className="secondary">Explore Communities</button></div></div><div className="globe"><div className="orb">◎</div><span className="float one">🌍 Real users · Connected</span><span className="float two">🔒 Secure account</span><span className="float three">💬 Live messaging · Ready</span></div></section>
  <div className="grid"><section className="card"><div className="card-head"><div><span className="eyebrow">LIVE NOW</span><h2>Global conversations</h2></div><button>View all →</button></div><div className="rooms">{rooms.map(([i,n,c])=><div className="room" key={n}><span className="room-icon">{i}</span><div><strong>{n}</strong><small>{c}</small></div><span className="live"></span></div>)}</div></section>
  <section className="card"><div className="card-head"><div><span className="eyebrow">DISCOVER</span><h2>People to meet</h2></div><button>Explore →</button></div><div className="people">{people.map(([a,n,f])=><div className="person" key={n}><div className="avatar">{a}</div><div><strong>{f} {n}</strong><small>Discovery preview</small></div><button>Chat</button></div>)}</div></section></div></main></div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
