import { useState, type ReactNode } from "react";
import { UserRound, X, Share2, Search, Settings, ChevronDown, Plus, ArrowLeft } from "lucide-react";
import type { SkinProps } from "../AppSkins";
import type { Item } from "../schema";
import { useSkinState } from "../skinState";
import "./threads-private-profile.css";

export function ThreadsPrivateProfile({ p, profile, handle, posts, renderPost, onCompose, onSearch }: {
  p: SkinProps; profile?: Item; handle: string; posts: Item[]; renderPost: (i: Item) => ReactNode; onCompose: () => void; onSearch: () => void;
}) {
  const [section, setSection] = useSkinState(p, "threads-profile-section", "串文");
  const [name, setName] = useSkinState(p, "threads-profile-name-v2", profile?.title || handle);
  const [bio, setBio] = useSkinState(p, "threads-profile-bio", profile?.body || "");
  const followingIds = (profile?.meta.followingIds || "").split(",").map(id => id.trim()).filter(Boolean);
  const [panel, setPanel] = useState("");
  const [dmHandle, setDmHandle] = useState("");
  const [endingPrompt, setEndingPrompt] = useState(false);
  const dmMessages = p.items.filter(item => item.meta.dmHandle === dmHandle).sort((a, b) => a.time.localeCompare(b.time));
  const [editName, setEditName] = useState(name);
  const [editBio, setEditBio] = useState(bio);
  return <section className="tr-private-profile" aria-label="脆个人主页">
    <div className="tr-owner-tools"><button aria-label="搜索脆" onClick={onSearch}><Search/></button><button aria-label="脆设置" onClick={() => setPanel("设置")}><Settings/></button></div>
    <div className="tr-private-heading"><div><h2><button className="tr-account-name" onClick={() => setPanel("账号")}>{name}<ChevronDown size={17}/></button></h2><p>{handle}</p></div><button className="tr-default-avatar" aria-label="编辑头像和资料" onClick={() => {setEditName(name);setEditBio(bio);setPanel("编辑个人主页");}}><UserRound size={40} strokeWidth={1.4}/><span><Plus size={18}/></span></button></div>
    {bio && <p className="tr-private-bio">{bio}</p>}
    <div className="tr-private-meta"><button onClick={() => setPanel("粉丝")}>0 位粉丝</button><button aria-label={`查看关注的 ${followingIds.length} 个账号`} onClick={() => setPanel("关注")}>{profile?.meta.followingCount || followingIds.length} 正在关注</button></div>
    <div className="tr-profile-buttons"><button onClick={() => {setEditName(name);setEditBio(bio);setPanel("编辑个人主页");}}>编辑主页</button><button onClick={() => setPanel("成效分析")}>查看成效分析</button><button className="tr-profile-share" aria-label="分享个人主页" onClick={() => setPanel("分享个人主页")}><Share2 size={22}/></button></div>
    <nav className="tr-profile-sections" aria-label="个人主页内容">{["串文","回复","影音内容","转发"].map(t => <button key={t} aria-pressed={((section === "媒体" || section === "影音内容") ? "影音内容" : section)===t} onClick={() => setSection(t)}>{t}</button>)}</nav>
    {section === "串文" ? posts.length ? posts.map(renderPost) : <div className="tr-owner-empty"><button onClick={onCompose}>发布你的首篇串文</button></div> : <p className="tr-profile-empty">{section === "回复" ? "暂无回复" : (section === "媒体" || section === "影音内容") ? "暂无媒体内容" : "暂无转发"}</p>}
    {dmHandle && <div className="tr-private-dm"><header><button aria-label="返回关注列表" onClick={() => {setDmHandle("");setEndingPrompt(false);setPanel("关注");}}><ArrowLeft size={22}/></button><b>{dmHandle}</b><span/></header><div className="tr-dm-messages">{dmMessages.map(message => <article className={message.sender === "章明伯" ? "tr-dm-message tr-dm-message-outgoing" : "tr-dm-message"} key={message.id}><small>{message.sender}</small><p>{message.body}</p></article>)}</div></div>}
    {endingPrompt && dmHandle && <div className="tr-hidden-ending"><section role="dialog" aria-modal="true" aria-label="隐藏结局"><strong>你已完成隐藏结局。</strong><button onClick={() => setEndingPrompt(false)}>继续探索手机（点击关闭提示词）</button></section></div>}
    {panel && <div className="tr-profile-shade"><section role="dialog" aria-modal="true" aria-label={panel} className="tr-profile-dialog"><header><b>{panel}</b><button aria-label="关闭主页面板" onClick={() => setPanel("")}><X size={22}/></button></header>
      {panel === "编辑个人主页" ? <form onSubmit={e => {e.preventDefault();setName(editName.trim() || handle);setBio(editBio.trim());setPanel("");}}><label>名字<input aria-label="脆主页名字" value={editName} maxLength={40} onChange={e=>setEditName(e.target.value)}/></label><label>简介<textarea aria-label="脆主页简介" value={editBio} maxLength={150} onChange={e=>setEditBio(e.target.value)}/></label><p>ID：{handle}</p><button type="submit" className="tr-profile-done">完成</button></form> : panel === "粉丝" ? <p className="tr-profile-empty">暂无粉丝</p> : panel === "关注" ? <div className="tr-following-list">{followingIds.map(id => id === "Matthewhan" ? <button className="tr-following-account" key={id} onClick={() => {setDmHandle(id);setPanel("");setEndingPrompt(true);}}>@{id}</button> : <p key={id}>@{id}</p>)}</div> : panel === "成效分析" ? <><p>粉丝总数：0</p><p>已发布串文：{posts.length}</p><small>暂无更多成效数据</small></> : panel === "设置" ? <><p>账号：{handle}</p><p>账号隐私：私密</p><small>只有获准的粉丝可以查看内容。</small></> : panel === "账号" ? <><p>{name}</p><p>@{handle}</p><small>当前账号</small></> : <><Share2 size={30}/><p>{name}</p><p className="tr-share-handle">@{handle}</p><p>个人主页地址</p><input aria-label="个人主页地址" readOnly value={`https://www.threads.com/@${handle}`} onFocus={e=>e.target.select()}/><small>长按或选择地址即可复制分享。</small></>}
    </section></div>}
  </section>;
}

