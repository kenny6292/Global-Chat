import React, { useMemo, useState } from "react";
import "./next-features.css";

type Tab = "network" | "trending" | "security" | "settings";

const people = [
  {name:"Amina Yusuf", handle:"@aminay", country:"NG", role:"Product Designer", status:"Online", interests:["Design","Tech"]},
  {name:"Daniel Brooks", handle:"@danbrooks", country:"GB", role:"Developer", status:"Away", interests:["JavaScript","AI"]},
  {name:"Sofia Martins", handle:"@sofia_m", country:"BR", role:"Creator", status:"Online", interests:["Travel","Music"]},
  {name:"Noah Chen", handle:"@noahc", country:"CA", role:"Founder", status:"Busy", interests:["Business","Startups"]}
];

const trends = [
  ["#BuildInPublic","18.4K posts","Creators are sharing what they are building."],
  ["#TechAcrossBorders","12.8K posts","Global developers are connecting around technology."],
  ["#LanguageExchange","9.6K posts","Find conversation partners and practice together."],
  ["#WorldTravel","7.2K posts","Share destinations, tips and experiences."]
];

export function NextFeaturesPanel(){
  const [tab,setTab]=useState<Tab>("network");
  const [query,setQuery]=useState("");
  const [connected,setConnected]=useState<string[]>([]);
  const [status,setStatus]=useState("Online");
  const [saved,setSaved]=useState<string[]>([]);
  const filtered=useMemo(()=>people.filter(p=>
    !query.trim() || (p.name+" "+p.handle+" "+p.role+" "+p.country+" "+p.interests.join(" ")).toLowerCase().includes(query.toLowerCase())
  ),[query]);
  const connect=(handle:string)=>setConnected(x=>x.includes(handle)?x.filter(v=>v!==handle):[...x,handle]);
  return <section className="next-features-panel">
    <div className="next-hero">
      <div><span className="eyebrow">GLOBAL NETWORK</span><h1>Your world, organized in one place.</h1><p>Discover people, follow global trends, manage your presence and review account security from a single workspace.</p></div>
      <div className="status-control"><span className="status-dot"></span><select value={status} onChange={e=>setStatus(e.target.value)}><option>Online</option><option>Away</option><option>Busy</option><option>Invisible</option></select></div>
    </div>
    <div className="next-tabs">
      {([["network","People & Connections"],["trending","Trending"],["security","Security Center"],["settings","Preferences"]] as [Tab,string][]).map(([id,label])=><button className={tab===id?"next-tab active":"next-tab"} key={id} onClick={()=>setTab(id)}>{label}</button>)}
    </div>
    {tab==="network"&&<div className="next-grid">
      <section className="card next-card"><div className="card-head"><div><span className="eyebrow">DISCOVER PEOPLE</span><h2>Build your network</h2></div></div><input className="next-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, skill, interest or country…"/><div className="connection-list">{filtered.map(p=><article className="connection-card" key={p.handle}><div className="connection-avatar">{p.name.slice(0,2).toUpperCase()}</div><div className="connection-info"><strong>{p.name}</strong><small>{p.handle} · {p.country}</small><p>{p.role}</p><div className="chips">{p.interests.map(i=><span key={i}>{i}</span>)}</div></div><button className={connected.includes(p.handle)?"secondary connected":"primary"} onClick={()=>connect(p.handle)}>{connected.includes(p.handle)?"Connected":"Connect"}</button></article>)}</div></section>
      <aside className="card next-card"><span className="eyebrow">YOUR NETWORK</span><h2>Connection activity</h2><div className="network-stat"><strong>{connected.length}</strong><span>connections started here</span></div><div className="network-stat"><strong>{status}</strong><span>current presence</span></div><p className="muted">Connection controls are ready for the real backend connection system when it is activated.</p></aside>
    </div>}
    {tab==="trending"&&<section className="card next-card"><div className="card-head"><div><span className="eyebrow">GLOBAL TRENDS</span><h2>Topics people are exploring</h2></div></div><div className="trend-grid">{trends.map(([tag,count,desc])=><article className="trend-card" key={tag}><strong>{tag}</strong><span>{count}</span><p>{desc}</p><button className="secondary" onClick={()=>setSaved(x=>x.includes(tag)?x.filter(v=>v!==tag):[...x,tag)}>{saved.includes(tag)?"Following":"Follow topic"}</button></article>)}</div></section>}
    {tab==="security"&&<div className="next-grid"><section className="card next-card"><span className="eyebrow">ACCOUNT PROTECTION</span><h2>Security Center</h2><div className="security-row"><span>🔐 Password authentication</span><b>Enabled</b></div><div className="security-row"><span>📱 Active sessions</span><b>1 current</b></div><div className="security-row"><span>🛡️ Two-factor authentication</span><button className="secondary">Set up</button></div><div className="security-row"><span>🔑 Passkeys</span><button className="secondary">Manage</button></div></section><section className="card next-card"><span className="eyebrow">PRIVACY</span><h2>Control your visibility</h2><label className="toggle-row">Discoverable profile <input type="checkbox" defaultChecked/></label><label className="toggle-row">Allow connection requests <input type="checkbox" defaultChecked/></label><label className="toggle-row">Show online status <input type="checkbox" defaultChecked/></label><p className="muted">These controls provide the UI foundation; enforcement will be handled by the connected backend.</p></section></div>}
    {tab==="settings"&&<div className="next-grid"><section className="card next-card"><span className="eyebrow">PREFERENCES</span><h2>Personalize Global Chat</h2><label className="toggle-row">Email notifications <input type="checkbox" defaultChecked/></label><label className="toggle-row">Message notifications <input type="checkbox" defaultChecked/></label><label className="toggle-row">Community activity <input type="checkbox" defaultChecked/></label><label className="toggle-row">Reduce motion <input type="checkbox"/></label></section><section className="card next-card"><span className="eyebrow">LANGUAGE</span><h2>Global communication</h2><select className="next-search" defaultValue="English"><option>English</option><option>French</option><option>Spanish</option><option>Portuguese</option><option>Arabic</option><option>German</option></select><p className="muted">Translation can be added to conversations and public rooms when the translation provider is connected.</p></section></div>}
  </section>
}
