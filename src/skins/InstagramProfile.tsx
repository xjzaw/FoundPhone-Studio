import { useState } from "react";
import { Grid, Play, User, Users, Layers, Bookmark, UserPlus, ChevronDown, X, Link as LinkIcon } from "lucide-react";
import { useSkinState } from "../skinState";
import { Avatar, Media, meta, type Props } from "./shared";
import type { Item } from "../schema";
import "./instagram-profile.css";

export function InstagramProfile({ p, profile, posts, savedPosts, savedIds, openPost }: {
  p: Props; profile?: Item; posts: Item[]; savedPosts?: Item[]; savedIds: string[]; openPost: (item: Item) => void;
}) {
  const [grid, setGrid] = useSkinState(p, "view:instagram:grid", "帖子");
  const [panel, setPanel] = useSkinState(p, "view:instagram:panel", "");
  const [displayName, setDisplayName] = useSkinState(p, "instagram:display-name", profile?.title || p.owner || "我");
  const [bio, setBio] = useSkinState(p, "instagram:bio", profile?.body || "");
  const [copied, setCopied] = useState(false);
  const list = grid === "已收藏" ? (savedPosts ?? posts).filter((item) => savedIds.includes(item.id)) : grid === "短视频" ? posts.filter((item) => item.kind === "video") : grid === "标记内容" ? posts.filter((item) => item.meta.tagged === "true") : posts;
  const url = meta(profile, "sourceUrl");
  return <section className="instagram-profile">
    <div className="ig-profile-top">
      <button className="ig-profile-avatar" aria-label="查看主页头像" onClick={() => setPanel("头像")}><Avatar name={displayName} src={profile?.avatar} /></button>
      <div className="ig-profile-counts">
        <button onClick={() => setGrid("帖子")}><strong>{meta(profile, "posts", String(posts.length))}</strong><span>帖子</span></button>
        <button onClick={() => setPanel("粉丝")}><strong>{meta(profile, "followers", "—")}</strong><span>粉丝</span></button>
        <button onClick={() => setPanel("关注")}><strong>{meta(profile, "following", "—")}</strong><span>关注</span></button>
      </div>
    </div>
    <div className="ig-profile-description"><strong>{displayName}</strong><p>{bio}</p>{url && <a href={url} target="_blank" rel="noreferrer"><LinkIcon size={12} />公开主页</a>}</div>
    <div className="ig-profile-buttons"><button onClick={() => setPanel("编辑主页")}>编辑主页</button><button onClick={() => { setCopied(false); setPanel("分享主页"); }}>分享主页</button><button aria-label="查看关注信息" onClick={() => setPanel("关注")}><UserPlus size={17} /></button></div>
    <div className="ig-profile-tabs" role="tablist" aria-label="主页内容分类">
      {[{ label: "帖子", Icon: Grid }, { label: "短视频", Icon: Play }, { label: "标记内容", Icon: User }, { label: "已收藏", Icon: Bookmark }].map(({ label, Icon }) => <button key={label} role="tab" aria-label={label} aria-selected={grid === label} className={grid === label ? "active" : ""} onClick={() => setGrid(label)}><Icon size={21} /></button>)}
    </div>
    <div className="pg2 ig-profile-grid">{list.map((item) => <button aria-label={`打开${item.title}`} key={item.id} onClick={() => openPost(item)}><Media item={item} />{item.meta.carousel === "true" && <Layers className="ig-carousel-badge" size={15} />}</button>)}</div>
    {!list.length && <div className="ig-profile-empty"><Grid size={28} /><p>{grid === "已收藏" ? "收藏的帖子会出现在这里" : grid === "短视频" ? "暂未添加视频" : "暂无可展示的标记内容"}</p></div>}
    {profile && grid === "帖子" && <p className="ig-profile-snapshot">已载入公开可见的 {posts.length} 条封面</p>}
    {panel && <div className="ig-profile-panel" role="dialog" aria-label={panel}>
      <header><strong>{panel}</strong><button aria-label="关闭主页面板" onClick={() => setPanel("")}><X size={22} /></button></header>
      {panel === "头像" ? <div className="ig-profile-large-avatar"><Avatar name={displayName} src={profile?.avatar} /></div> : panel === "编辑主页" ? <div className="ig-profile-editor"><label>昵称<input aria-label="主页昵称" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>简介<textarea aria-label="主页简介" value={bio} onChange={(event) => setBio(event.target.value)} /></label><button onClick={() => setPanel("")}>保存资料</button></div> : panel === "分享主页" ? <div className="ig-profile-share"><p>{url}</p><button onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setCopied(false); } }}>{copied ? "已复制链接" : "复制主页链接"}</button></div> : <div className="ig-profile-empty"><Users size={32} /><strong>{panel === "粉丝" ? meta(profile, "followers", "—") : meta(profile, "following", "—")} {panel}</strong><p>公开页面未提供完整名单</p>{url && <a href={url} target="_blank" rel="noreferrer">查看公开主页 <ChevronDown size={12} /></a>}</div>}
    </div>}
  </section>;
}
