import React, { useEffect, useState } from "react";
import { listConversations, listMessages, sendMessage, subscribeToConversation, type Conversation, type Message } from "./lib/messages";
import { listNotifications, markNotificationRead, subscribeToNotifications, type Notification } from "./lib/notifications";
import { listCommunities, joinCommunity, listCommunityMessages, sendCommunityMessage, subscribeToCommunity, type Community, type CommunityMessage } from "./lib/communities";

function initials(value:string){return (value||"GC").slice(0,2).toUpperCase();}

export function MessengerPanel({currentUserId}:{currentUserId:string}){
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [selected,setSelected]=useState("");
  const [messages,setMessages]=useState<Message[]>([]);
  const [body,setBody]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function loadConversations(){
    setLoading(true);setError("");
    try{
      const rows=await listConversations();
      setConversations(rows);
      if(!selected && rows[0]) setSelected(rows[0].id);
    }catch(e){setError(e instanceof Error?e.message:"Could not load conversations.");}
    finally{setLoading(false);}
  }

  async function loadMessages(id:string){
    if(!id){setMessages([]);return;}
    try{setMessages(await listMessages(id));}
    catch(e){setError(e instanceof Error?e.message:"Could not load messages.");}
  }

  useEffect(()=>{void loadConversations();},[]);
  useEffect(()=>{
    void loadMessages(selected);
    if(!selected)return;
    return subscribeToConversation(selected,(message)=>{
      setMessages(current=>current.some(x=>x.id===message.id)?current:[...current,message]);
    });
  },[selected]);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!selected || !body.trim())return;
    try{
      const message=await sendMessage(selected,body);
      setMessages(current=>current.some(x=>x.id===message.id)?current:[...current,message]);
      setBody("");
      await loadConversations();
    }catch(e){setError(e instanceof Error?e.message:"Could not send message.");}
  }

  return <section className="social-panel">
    <div className="panel-heading"><div><span className="eyebrow">MESSENGER</span><h1>Private conversations</h1><p>Continue your conversations with people across Global Chat.</p></div></div>
    {error&&<div className="notice error">{error}</div>}
    <div className="messenger-layout">
      <aside className="conversation-list"><h3>Conversations</h3>{loading?<div className="empty">Loading…</div>:conversations.length===0?<div className="empty">No conversations yet. Find someone in Friends and start a chat.</div>:conversations.map(c=><button className={selected===c.id?"conversation active":"conversation"} key={c.id} onClick={()=>setSelected(c.id)}><div className="avatar">{initials(c.id)}</div><div><strong>Conversation</strong><small>{new Date(c.updated_at).toLocaleString()}</small></div></button>)}</aside>
      <section className="chat-view">{selected?<><div className="chat-head"><strong>Conversation</strong><small>Secure Global Chat messaging</small></div><div className="chat-messages">{messages.length===0?<div className="empty">No messages yet. Start the conversation.</div>:messages.map(m=><div className={m.sender_id===currentUserId?"bubble mine":"bubble"} key={m.id}>{m.body}<small>{new Date(m.created_at).toLocaleTimeString()}</small></div>)}</div><form className="composer" onSubmit={submit}><input value={body} onChange={e=>setBody(e.target.value)} placeholder="Write a message…" maxLength={5000}/><button className="primary" disabled={!body.trim()}>Send</button></form></>:<div className="chat-placeholder"><div className="empty">Select a conversation to begin.</div></div>}</section>
    </div>
  </section>;
}

export function NotificationsPanel({userId}:{userId:string}){
  const [items,setItems]=useState<Notification[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{setItems(await listNotifications());}
    catch(e){setError(e instanceof Error?e.message:"Could not load notifications.");}
    finally{setLoading(false);}
  }

  useEffect(()=>{
    void load();
    return subscribeToNotifications(userId,(item)=>setItems(current=>[item,...current]));
  },[userId]);

  async function read(item:Notification){
    if(item.read_at)return;
    try{
      await markNotificationRead(item.id);
      setItems(current=>current.map(x=>x.id===item.id?{...x,read_at:new Date().toISOString()}:x));
    }catch(e){setError(e instanceof Error?e.message:"Could not mark notification as read.");}
  }

  const icon:Record<Notification["type"],string>={message:"💬",community:"👥",system:"🔔"};
  return <section className="notifications-panel">
    <div className="notifications-head"><span className="eyebrow">NOTIFICATIONS</span><h1>Stay up to date</h1><p>Messages, community activity and important Global Chat updates.</p></div>
    {error&&<div className="notice error">{error}</div>}
    {loading?<div className="empty">Loading notifications…</div>:items.length===0?<div className="empty">You have no notifications yet.</div>:<div className="notification-list">{items.map(item=><button key={item.id} className={item.read_at?"notification read":"notification"} onClick={()=>void read(item)}><span className="notification-icon">{icon[item.type]}</span><span><strong>{item.title}</strong><small>{item.body}</small><em>{new Date(item.created_at).toLocaleString()}</em></span>{!item.read_at&&<i aria-label="Unread"/>}</button>)}</div>}
  </section>;
}

export function GroupsPanel(){
  const [groups,setGroups]=useState<Community[]>([]);
  const [selected,setSelected]=useState("");
  const [messages,setMessages]=useState<CommunityMessage[]>([]);
  const [body,setBody]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function loadGroups(){
    setLoading(true);setError("");
    try{
      const rows=await listCommunities();
      setGroups(rows);
      if(!selected && rows[0])setSelected(rows[0].id);
    }catch(e){setError(e instanceof Error?e.message:"Could not load groups.");}
    finally{setLoading(false);}
  }

  async function loadMessages(id:string){
    if(!id){setMessages([]);return;}
    try{setMessages(await listCommunityMessages(id));}
    catch(e){setError(e instanceof Error?e.message:"Could not load community messages.");}
  }

  useEffect(()=>{void loadGroups();},[]);
  useEffect(()=>{
    void loadMessages(selected);
    if(!selected)return;
    return subscribeToCommunity(selected,(message)=>{
      setMessages(current=>current.some(x=>x.id===message.id)?current:[...current,message]);
    });
  },[selected]);

  async function join(id:string){
    try{await joinCommunity(id);}
    catch(e){setError(e instanceof Error?e.message:"Could not join community.");}
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!selected||!body.trim())return;
    try{
      const message=await sendCommunityMessage(selected,body);
      setMessages(current=>current.some(x=>x.id===message.id)?current:[...current,message]);
      setBody("");
    }catch(e){setError(e instanceof Error?e.message:"Could not send community message.");}
  }

  const active=groups.find(g=>g.id===selected);
  return <section className="social-panel">
    <div className="panel-heading"><div><span className="eyebrow">GROUPS & COMMUNITIES</span><h1>Find your communities</h1><p>Join conversations around interests, countries and shared goals.</p></div></div>
    {error&&<div className="notice error">{error}</div>}
    {loading?<div className="empty">Loading communities…</div>:groups.length===0?<div className="empty">No communities are available yet.</div>:<div className="group-grid">{groups.map(g=><article className="group-card" key={g.id}><div className="group-cover">{initials(g.name)}</div><span className="eyebrow">{g.category||"COMMUNITY"} · {g.country_code||"GLOBAL"}</span><h3>{g.name}</h3><p>{g.description||"Join this community and start connecting."}</p><button className="primary" onClick={()=>{setSelected(g.id);void join(g.id);}}>Join & Open →</button></article>)}</div>}
    {active&&<div className="community-window card" style={{marginTop:18}}><div className="chat-head"><strong>{active.name}</strong><small>{active.description}</small></div><div className="chat-messages">{messages.length===0?<div className="empty">No community messages yet. Start the conversation.</div>:messages.map(m=><div className="bubble" key={m.id}>{m.body}<small>{new Date(m.created_at).toLocaleString()}</small></div>)}</div><form className="composer" onSubmit={submit}><input value={body} onChange={e=>setBody(e.target.value)} placeholder={"Message "+active.name+"…"} maxLength={5000}/><button className="primary" disabled={!body.trim()}>Send</button></form></div>}
  </section>;
}
