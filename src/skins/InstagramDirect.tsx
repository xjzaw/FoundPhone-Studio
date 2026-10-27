import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, MoreHorizontal, Send, X } from "lucide-react";
import { makeItem, type Item } from "../schema";
import { useSkinState } from "../skinState";
import { Avatar, Media, type Props } from "./shared";
import "./instagram-direct.css";

const localKey = (id: string) => `instagram-dm-messages:${id}`;
const draftKey = (id: string) => `instagram-dm-draft:${id}`;

function decodeMessages(stored: unknown) {
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((value) => {
    if (typeof value !== "string") return [];
    try { return [makeItem(JSON.parse(value))]; } catch { return []; }
  });
}

function localMessages(p: Props, id: string) {
  return decodeMessages(p.ui?.[localKey(id)]);
}

export function instagramDirectPreview(p: Props, conversation: Item) {
  const draft = p.ui?.[draftKey(conversation.id)];
  if (typeof draft === "string" && draft.trim()) return `草稿：${draft}`;
  return localMessages(p, conversation.id).at(-1)?.body || p.items.filter((item) => item.meta.conversationId === conversation.id).at(-1)?.body || "暂无消息";
}

export function InstagramDirect({ p, conversation, back }: { p: Props; conversation: Item; back: () => void }) {
  const [draft, setDraft] = useSkinState(p, draftKey(conversation.id), "");
  const [sent, setSent] = useSkinState<string[]>(p, localKey(conversation.id), []);
  const [info, setInfo] = useState(false);
  const owner = p.items.find((item) => item.meta.profile === "true");
  const messages = [...p.items.filter((item) => item.meta.conversationId === conversation.id), ...decodeMessages(sent)];
  const scroll = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;
  const previous = useRef(lastId);
  useLayoutEffect(() => {
    if (previous.current !== lastId && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
    previous.current = lastId;
  }, [lastId]);
  return <section className="instagram-direct" aria-label={`与${conversation.title}的私信`}>
    <header className="ig-direct-header"><button aria-label="返回私信列表" onClick={back}><ArrowLeft size={23} /></button><Avatar name={conversation.title} src={conversation.avatar} /><div><strong>{conversation.title}</strong><small>{conversation.meta.handle}</small></div><button aria-label="会话信息" onClick={() => setInfo(!info)}><MoreHorizontal size={22} /></button></header>
    {info && <div className="ig-direct-info" role="dialog" aria-label="会话信息"><button aria-label="关闭会话信息" onClick={() => setInfo(false)}><X size={20} /></button><strong>{p.owner} 与 {conversation.title}</strong><p>{conversation.meta.handle}</p><a href={conversation.meta.sourceProfile} target="_blank" rel="noreferrer">查看对方公开主页</a></div>}
    <div className="ig-direct-scroll" ref={scroll}>
      {!messages.length && <div className="ig-direct-empty"><Avatar name={conversation.title} src={conversation.avatar} /><strong>{conversation.title}</strong><span>{conversation.meta.handle}</span><p>暂无消息，对话内容待补充</p></div>}
      {messages.map((item) => {
        const outgoing = item.outgoing || item.sender === p.owner;
        return <article className={`ig-direct-message ${outgoing ? "outgoing" : ""}`} key={item.id}>{!outgoing && <Avatar name={conversation.title} src={item.avatar || conversation.avatar} />}<div className="ig-direct-bubble">{item.body && <p>{item.body}</p>}{item.media && <Media item={item} />}<small>{item.time}</small></div>{outgoing && <Avatar name={p.owner || "我"} src={owner?.avatar} />}</article>;
      })}
    </div>
    <form className="ig-direct-compose" onSubmit={(event) => {
      event.preventDefault();
      if (!draft.trim()) return;
      const item = makeItem({ title: conversation.title, body: draft.trim(), sender: p.owner || "我", outgoing: true, time: `${p.virtualDate || "2026-10-27"} ${p.virtualTime || "00:00"}`, meta: { conversationId: conversation.id, local: "true" } });
      setSent([...sent, JSON.stringify(item)]);
      setDraft("");
    }}><input aria-label="私信消息" placeholder="输入消息" maxLength={5000} value={draft} onChange={(event) => setDraft(event.target.value)} /><button aria-label="发送私信" disabled={!draft.trim()}><Send size={20} /></button></form>
  </section>;
}
