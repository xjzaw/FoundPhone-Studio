import { NativeComposer } from "./DeviceSystem";
import { StoryMedia } from "./StoryMedia";
import { useSkinState } from "./skinState";
import { Fragment, useState, useRef, useLayoutEffect, useEffect } from "react";
import {
  ChevronLeft,
  Plus,
  CirclePlus,
  Search,
  MessageCircle,
  Users,
  Compass,
  User,
  Camera,
  Phone,
  Video,
  Settings,
  Heart,
  Send,
  Home,
  Play,
  Bookmark,
  MoreHorizontal,
  Mic,
  Smile,
  Grid,
  CheckCheck,
  AtSign,
  Star,
  Image as ImageIcon,
  Layers,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { safeMedia, makeItem, type Item, type Runtime, type UiValue } from "./schema";
import { WeChatAlarmChat } from "./skins/WeChatAlarmChat";
export type SkinProps = {
  ui?: Record<string, UiValue>;
  onUi?: (key: string, value: UiValue) => void;
  systemCall?: Runtime["incomingCall"];
  onSystemCall?: (call: { caller: string; target: string; captions?: string[] }) => void;
  onMissedCall?: () => void;
  appId?: string;
  owner?: string;
  virtualTime?: string;
  virtualDate?: string;
  name: string;
  items: Item[];
  creator: boolean;
  onRead: (id: string) => void;
  onItem: (i: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  thread: string;
  onThread: (s: string) => void;
};
function Avatar({
  name,
  round = false,
  src = "",
}: {
  name: string;
  round?: boolean;
  src?: string;
}) {
  return (
    <span className={`skin-avatar ${round ? "round" : ""}`}>
      {safeMedia(src)?.startsWith("data:image/") ? (
        <img src={safeMedia(src)} alt="" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
function ItemMedia({ item }: { item: Item }) {
  return <StoryMedia item={item} />;
}
function MessageList({
  items,
  creator,
  onItem,
  onRead,
  whatsapp = false,
  groupChat = false,
}: {
  items: Item[];
  creator: boolean;
  onItem: (i: Item) => void;
  onRead: (id: string) => void;
  whatsapp?: boolean;
  groupChat?: boolean;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const previous = useRef(items.at(-1)?.id);
  const lastId = items.at(-1)?.id;
  useLayoutEffect(() => {
    if (previous.current !== lastId && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
    previous.current = lastId;
  }, [lastId]);
  return (
    <div ref={scroll} className={`skin-messages ${whatsapp ? "wa-wallpaper" : ""}`}>
      {!(groupChat && items.some((i) => i.meta.groupTimestamp === "true")) &&
        !items[0]?.meta.chatTimestampLabel && (
        <div className="skin-date">{items[0]?.time.slice(0, 10)}</div>
      )}
      {items.map((i) => {
        if (groupChat && i.meta.groupTimestamp === "true")
          return (
            <div className="wx-group-timestamp" key={i.id}>
              {i.body}
            </div>
          );
        const chatTimestamp = i.meta.chatTimestampLabel;
        if (groupChat && i.meta.groupSystem === "true")
          return (
            <Fragment key={i.id}>
              {chatTimestamp && (
                <div className="wx-group-timestamp">{chatTimestamp}</div>
              )}
            <button
              className="wx-group-system"
              onClick={() => (creator ? onItem(i) : onRead(i.id))}
            >
              {i.body}
            </button>
            </Fragment>
          );
        return (
          <Fragment key={i.id}>
            {chatTimestamp && (
              <div className="wx-group-timestamp">{chatTimestamp}</div>
            )}
            <div
              className={`skin-message ${i.outgoing ? "outgoing" : ""} ${groupChat ? "wx-group-message" : ""} ${i.meta.groupWelcome === "true" ? "wx-group-welcome" : ""}`}
            >
              {!whatsapp && !i.outgoing && (
                <Avatar name={i.sender} src={i.avatar} />
              )}
              <div className={groupChat ? "wx-group-bubble-wrap" : undefined}>
                {groupChat && !i.outgoing && (
                  <span className="wx-group-sender">{i.sender}</span>
                )}
                <button
                  className="skin-bubble"
                  onClick={() => (creator ? onItem(i) : onRead(i.id))}
                >
                  {["image", "audio", "video"].includes(i.kind) ? (
                    i.media ? <ItemMedia item={i} /> : <div className="wx-media-placeholder">{i.body}</div>
                  ) : i.kind === "transfer" ? (
                    <div className="skin-transfer">
                      ¥ {i.body}
                      <small>转账记录 · 虚构</small>
                    </div>
                  ) : (
                    i.kind === "file" ? <div className="wx-file-placeholder"><FileText size={22} />{i.body}</div> : i.body
                  )}
                  <small className={whatsapp ? undefined : "wx-message-time"}>
                    {i.time.slice(-5)}{" "}
                    {whatsapp && i.outgoing && <CheckCheck size={11} />}
                  </small>
                </button>
              </div>
              {!whatsapp && i.outgoing && <Avatar name={i.sender} src={i.avatar} />}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
function Compose({
  creator,
  onAdd,
  wa = false,
  p,
}: {
  creator: boolean;
  onAdd: () => void;
  wa?: boolean;
  p: SkinProps;
}) {
  const [draft, setDraft] = useSkinState(p, `chat:draft:${p.thread}`, "");
  const [sent, setSent] = useSkinState<string[]>(p, "chat:messages", []);
  return (
    <div className={`skin-compose ${wa ? "wa-compose" : ""}`}>
      {wa ? <Plus size={20} /> : <Mic size={20} />}
      {creator ? <NativeComposer creator={creator} onAdd={onAdd} /> : <form className="story-chat-compose" onSubmit={(event) => {
        event.preventDefault();
        if (!draft.trim()) return;
        const item = makeItem({ title: p.thread, sender: p.owner || "我", body: draft.trim(), outgoing: true, time: `${p.virtualDate || "2026-10-26"} ${p.virtualTime || "00:00"}`, kind: "text" });
        setSent([...sent, JSON.stringify(item)]);
        setDraft("");
      }}><input aria-label="聊天消息" placeholder="输入消息" value={draft} onChange={(event) => setDraft(event.target.value)} /><button disabled={!draft.trim()}>发送</button></form>}

      <Smile size={21} />
      {wa ? <Mic size={20} /> : <Plus size={22} />}
    </div>
  );
}
function useChatItems(p: SkinProps) {
  const [stored] = useSkinState<string[]>(p, "chat:messages", []);
  const avatars = new Map(p.items.filter((item) => item.avatar).map((item) => [item.sender, item.avatar]));
  return [...p.items, ...stored.flatMap((raw) => {
    try {
      const item = makeItem(JSON.parse(raw));
      return [item];
    } catch { return []; }
  })].map((item) => !item.avatar && avatars.has(item.sender) ? { ...item, avatar: avatars.get(item.sender)! } : item);
}
export function WeChatSkin(p: SkinProps) {
  useEffect(() => {
    if (p.thread === "Matthew" && p.ui?.unreadBadge !== false) p.onUi?.("unreadBadge", false);
  }, [p.thread, p.onUi, p.ui?.unreadBadge]);
  const baseItems = useChatItems(p);
  const [alarmRaw] = useSkinState(p, "wechat-duet-alarm-v5", "");
  const alarmMessages: Item[] = (() => { try { return (JSON.parse(alarmRaw || "{}") as {messages?: Item[]}).messages || []; } catch { return []; } })();
  const items = [...baseItems, ...alarmMessages.filter((item) => item.meta.callMissed !== "true")];
  const [tab, setTab] = useSkinState(p, "view:WeChatSkin:tab", "微信"),
    [query, setQuery] = useSkinState(p, "view:WeChatSkin:query", ""),
    [moments, setMoments] = useSkinState(p, "view:WeChatSkin:moments", false),
    [menu, setMenu] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [utility, setUtility] = useSkinState(p, "view:WeChatSkin:utility", "");
  const [readThreads, setReadThreads] = useSkinState<string[]>(
    p,
    "readThreads",
    [],
  );
  const conversations = [
    ...new Set(
      items
        .filter((i) => !["朋友圈", "我"].includes(i.folder))
        .map((i) => i.title),
    ),
  ];
  const posts = items.filter(
    (i) => i.folder === "朋友圈" || i.kind === "post",
  );
  const threadItems = items.filter((i) => i.title === p.thread);
  const groupChat = (threadItems[0]?.meta.participants || "")
    .split(",")
    .filter(Boolean).length > 2;
  const latestForConversation = (title: string): Item | undefined => {
    const list = items.filter((item) => item.title === title);
    if (title === "Matthew") {
      const latestInteraction = alarmMessages
        .filter((item) => item.meta.callMissed !== "true")
        .reduce<Item | undefined>((latest, item) =>
          !latest || item.time >= latest.time ? item : latest,
        undefined);
      if (latestInteraction) return latestInteraction;
      return makeItem({
        id: "wx-alarm-preview-initial",
        title: "Matthew",
        sender: "Matthew",
        body: "怎么了",
        kind: "text",
        time: "2026-10-27 22:19",
      });
    }
    return list.reduce<Item | undefined>((latest, item) =>
      !latest || item.time >= latest.time ? item : latest,
    undefined);
  };
  return (
    <div
      className="wechat-ui independent-skin"
      data-tab={tab}
      data-thread={!!p.thread}
      data-moments={moments}
      data-utility={!!utility}
    >
      <div className="app-nav wx-nav">
        <button
          aria-label={utility || p.thread || moments ? "返回" : "收藏"}
          onClick={() =>
            utility
              ? setUtility("")
              : p.thread
                ? p.onThread("")
                : moments
                  ? setMoments(false)
                  : setUtility("收藏")
          }
        >
          {utility || p.thread || moments ? (
            <ChevronLeft size={22} />
          ) : (
            <Star size={22} />
          )}
        </button>
        <strong>
          {utility ||
            p.thread ||
            (moments ? "朋友圈" : tab === "微信" ? p.name : tab)}
        </strong>
        <button
          aria-label={
            p.creator ? "新增内容" : p.thread ? "聊天详情" : "微信菜单"
          }
          onClick={
            p.creator
              ? p.onAdd
              : () => (p.thread ? setUtility("聊天信息") : setMenu(!menu))
          }
        >
          {p.thread ? <MoreHorizontal size={22} /> : <CirclePlus size={22} />}
        </button>
      </div>
      {menu && (
        <div className="wx-popup-menu" role="menu">
          {["搜索", "发起群聊", "添加朋友", "扫一扫", "收付款"].map((label) => (
            <button
              role="menuitem"
              key={label}
              onClick={() => {
                setMenu(false);
                if (label === "搜索") {
                  setSearchOpen(true);
                } else setUtility(label);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {utility ? (
        <div className="skin-scroll wx-utility">
          {utility === "聊天信息" && (
            <div className="wx-members">
              {[
                ...new Set(
                  items
                    .filter((i) => i.title === p.thread)
                    .map((i) => i.sender),
                ),
              ].map((name) => (
                <div key={name}>
                  <Avatar
                    name={name}
                    src={items.find((i) => i.sender === name)?.avatar}
                  />
                  <small>{name}</small>
                </div>
              ))}
            </div>
          )}
          {items
            .filter((i) => i.folder === utility)
            .map((i) => (
              <button
                key={i.id}
                className="wx-discovery"
                onClick={() => p.onItem(i)}
              >
                {i.title}
                <span>›</span>
              </button>
            ))}
          {!items.some((i) => i.folder === utility) &&
            utility !== "聊天信息" && <p className="skin-empty">暂无内容</p>}
        </div>
      ) : p.thread ? (
        <>
          {p.thread === "Matthew" ? <WeChatAlarmChat p={p} history={threadItems.filter(i => i.meta.alarmScript !== "true")} renderMessages={(messages) => <MessageList items={messages} creator={p.creator} onItem={p.onItem} onRead={p.onRead} groupChat={groupChat} />} /> : <><MessageList items={threadItems} creator={p.creator} onItem={p.onItem} onRead={p.onRead} groupChat={groupChat} /><Compose p={p} creator={p.creator} onAdd={p.onAdd} /></>}
        </>
      ) : moments ? (
        <div className="wx-moments">
          <div className="wx-moment-cover">
            <Camera size={32} />
            <span>朋友圈</span>
          </div>
          {posts.map((i) => (
            <button
              key={i.id}
              className="wx-moment-post"
              onClick={() => p.onItem(i)}
            >
              <Avatar name={i.sender} />
              <div>
                <strong>{i.sender}</strong>
                <p>{i.body}</p>
                {i.media && <ItemMedia item={i} />}
                <small>{i.time}</small>
              </div>
            </button>
          ))}
          {!posts.length && <p className="skin-empty">暂无朋友圈动态</p>}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              添加朋友圈动态
            </button>
          )}
        </div>
      ) : (
        <div className="skin-scroll">
          {tab === "微信" ? (
            <>
              {searchOpen && (
                <label className="wx-search">
                  <Search size={14} />
                  <input
                    aria-label="搜索微信内容"
                    placeholder="搜索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
              {conversations
                .filter(
                  (t) =>
                    t.includes(query) ||
                    items.some(
                      (i) => i.title === t && i.body.includes(query),
                    ),
                )
                .sort((a, b) =>
                  (latestForConversation(b)?.time || "").localeCompare(
                    latestForConversation(a)?.time || "",
                  ),
                )
                .map((t) => {
                  const list = items.filter((i) => i.title === t);
                  const last = latestForConversation(t) ?? list.at(-1)!;
                  const placeholder = list.some((item) => item.meta.chatPlaceholder === "true");
                  return (
                    <button
                      className={placeholder ? "wx-chat-row wx-chat-placeholder" : "wx-chat-row"}
                      key={t}
                      onClick={() => {
                        if (placeholder) return;
                        setReadThreads((v) => (v.includes(t) ? v : [...v, t]));
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <span className="wx-chat-avatar">
                        <Avatar name={t} src={(list[0]?.meta.participants || "").split(",").filter(Boolean).length > 2 ? "" : list.find((item) => item.sender === t && item.avatar)?.avatar || list.find((item) => item.sender !== p.owner && item.avatar)?.avatar || ""} />
                        {!readThreads.includes(t) && list.some((i) => !i.read) && <b className="wx-unread">{list.filter((i) => !i.read).length}</b>}
                      </span>
                      <div>
                        <strong>{t}</strong>
                        <p>{placeholder ? "\u00a0" : last.body}</p>
                      </div>
                      <time>{placeholder ? "" : last.time.slice(-5)}</time>
                    </button>
                  );
                })}
              {!conversations.length && <p className="skin-empty">暂无聊天</p>}
            </>
          ) : tab === "通讯录" || tab === "发现" ? (
            <div className="wx-placeholder"><strong>{tab}</strong><span>页面内容待补充</span></div>
          ) : (
            <>
              <div className="wx-profile">
                <Avatar name={p.owner || "机主"} src={items.find((item) => item.sender === p.owner && item.avatar)?.avatar} />
                <div>
                  <h2>{p.owner || "机主"}</h2>
                  <small>微信号：未设置</small>
                  <button
                    className="wx-profile-status"
                    onClick={() => setUtility("状态")}
                  >
                    ＋ 状态
                  </button>
                </div>
              </div>
              <div className="wx-profile-menu">
                {[
                  [MessageCircle, "服务", "#07c160"],
                  [Layers, "收藏", "#e8a828"],
                  [ImageIcon, "朋友圈", "#3a9bd9"],
                  [Layers, "作品", "#329dd8"],
                  [ShoppingBag, "小店与卡包", "#ed7c59"],
                  [Smile, "表情", "#f7b900"],
                  [Settings, "设置", "#1696d2"],
                ].map(([Icon, label, color]) => {
                  const Glyph = Icon as typeof Settings;
                  return (
                    <button
                      key={String(label)}
                      className="wx-discovery"
                      onClick={() =>
                        label === "朋友圈"
                          ? setMoments(true)
                          : setUtility(String(label))
                      }
                    >
                      <Glyph size={22} style={{ color: String(color) }} />
                      {String(label)}
                      <span>›</span>
                    </button>
                  );
                })}
              </div>
              {items
                .filter((i) => i.folder === "我")
                .map((i) => (
                  <button
                    className="wx-discovery"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <User size={18} />
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
              {p.creator && (
                <button className="phone-add" onClick={p.onAdd}>
                  编辑个人资料内容
                </button>
              )}
            </>
          )}
        </div>
      )}
      {!p.thread && !moments && !utility && (
        <nav className="wx-bottom">
          {[
            { label: "微信", icon: MessageCircle },
            { label: "通讯录", icon: Users },
            { label: "发现", icon: Compass },
            { label: "我", icon: User },
          ].map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              disabled={t.label === "通讯录" || t.label === "发现"}
              onClick={
                t.label === "微信" || t.label === "我"
                  ? () => setTab(t.label)
                  : undefined
              }
            >
              <t.icon size={21} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
export function WhatsAppSkin(p: SkinProps) {
  const items = useChatItems(p);
  const [tab, setTab] = useSkinState(p, "view:WhatsAppSkin:tab", "聊天"),
    [query, setQuery] = useSkinState(p, "view:WhatsAppSkin:query", ""),
    [filter, setFilter] = useSkinState(p, "view:WhatsAppSkin:filter", "全部");
  const tabs = [
    { label: "动态", icon: Compass },
    { label: "通话", icon: Phone },
    { label: "社区", icon: Users },
    { label: "聊天", icon: MessageCircle },
    { label: "设置", icon: Settings },
  ];
  const conversations = [
    ...new Set(
      items
        .filter((i) => !["动态", "通话", "社区", "设置"].includes(i.folder))
        .filter((i) => filter !== "未读" || !i.read)
        .map((i) => i.title),
    ),
  ];
  const name = tab === "聊天" ? p.name : tab;
  return (
    <div className="whatsapp-ui independent-skin">
      <div className="app-nav wa-nav">
        <button
          aria-label="返回"
          onClick={() => (p.thread ? p.onThread("") : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{p.thread || name}</strong>
        <button
          aria-label={p.creator ? "新增内容" : "搜索内容"}
          onClick={
            p.creator
              ? p.onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(".wa-search input")
                    ?.focus()
          }
        >
          {p.creator ? <Plus size={21} /> : <Search size={20} />}
        </button>
      </div>
      {p.thread ? (
        <>
          <div className="wa-thread-profile">
            <button aria-label="返回聊天列表" onClick={() => p.onThread("")}>
              <ChevronLeft size={23} />
            </button>
            <Avatar
              name={p.thread}
              src={items.find((i) => i.title === p.thread)?.avatar}
              round
            />
            <div>
              <strong>{p.thread}</strong>
              <small>联系人</small>
            </div>
            <Video size={18} />
            <Phone size={17} />
          </div>
          <MessageList
            items={items.filter((i) => i.title === p.thread)}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
            whatsapp
          />
          <Compose p={p} creator={p.creator} onAdd={p.onAdd} wa />
        </>
      ) : (
        <div className="skin-scroll">
          <h1 className="wa-large-title">{tab}</h1>
          {tab === "聊天" ? (
            <>
              <label className="wa-search">
                <Search size={16} />
                <input
                  placeholder="搜索"
                  aria-label="搜索WhatsApp"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="wa-filters">
                {["全部", "未读", "群组"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "selected" : ""}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {conversations
                .filter((t) => t.includes(query))
                .filter(
                  (t) =>
                    filter !== "群组" ||
                    items.some((i) => i.title === t && i.folder === "群组"),
                )
                .map((t) => {
                  const last = items.filter((i) => i.title === t).at(-1)!;
                  return (
                    <button
                      className="wa-chat-row"
                      key={t}
                      onClick={() => {
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <Avatar name={t} src={last.avatar} round />
                      <div>
                        <strong>{t}</strong>
                        <p>
                          {last.outgoing && <CheckCheck size={12} />}{" "}
                          {last.body}
                        </p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
            </>
          ) : tab === "设置" ? (
            <>
              <div className="wa-settings-profile">
                <Avatar name="我" round />
                <h2>个人资料</h2>
              </div>
              {items
                .filter((i) => i.folder === "设置")
                .map((i) => (
                  <button
                    key={i.id}
                    className="wa-record"
                    onClick={() => p.onItem(i)}
                  >
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
            </>
          ) : (
            <>
              {tab === "动态" && (
                <div className="wa-status">
                  <Avatar name="我" round />
                  <span>我的状态</span>
                  {p.creator && (
                    <button aria-label="添加状态" onClick={p.onAdd}>
                      <Plus size={17} />
                    </button>
                  )}
                </div>
              )}
              {items
                .filter(
                  (i) =>
                    i.folder === tab || (tab === "通话" && i.kind === "call"),
                )
                .map((i) => (
                  <button
                    className="wa-record"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <Avatar name={i.sender} src={i.avatar} round />
                    <div>
                      <strong>{i.title}</strong>
                      <p>{i.body}</p>
                    </div>
                    <span>
                      {tab === "通话" ? (
                        <Phone size={17} />
                      ) : (
                        <ChevronLeft size={15} />
                      )}
                    </span>
                  </button>
                ))}
              {!items.some((i) => i.folder === tab) && (
                <p className="skin-empty">暂无{tab}内容</p>
              )}
            </>
          )}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              添加{tab === "聊天" ? "聊天" : tab}内容
            </button>
          )}
        </div>
      )}
      {!p.thread && (
        <nav className="wa-bottom">
          {tabs.map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
export function InstagramSkin(p: SkinProps) {
  const [tab, setTab] = useSkinState(p, "view:InstagramSkin:tab", "首页"),
    [dm, setDm] = useSkinState(p, "view:InstagramSkin:dm", false),
    [query, setQuery] = useSkinState(p, "view:InstagramSkin:query", ""),
    [likes, setLikes] = useSkinState<string[]>(p, "likes", []),
    [saved, setSaved] = useSkinState<string[]>(p, "saved", []),
    [showSaved, setShowSaved] = useSkinState(p, "view:InstagramSkin:showSaved", false);
  const posts = p.items.filter(
      (i) =>
        i.kind === "post" ||
        !["私信", "Story", "Reels", "个人主页"].includes(i.folder),
    ),
    stories = p.items.filter((i) => i.folder === "Story"),
    reels = p.items.filter((i) => i.kind === "video" || i.folder === "Reels"),
    messages = p.items.filter((i) => i.folder === "私信");
  const tabs = [
    { label: "首页", icon: Home },
    { label: "搜索", icon: Search },
    { label: "Reels", icon: Play },
    { label: "个人主页", icon: User },
  ];
  const shown = (
    showSaved ? posts.filter((i) => saved.includes(i.id)) : posts
  ).filter((i) => (i.title + i.body + i.sender).includes(query));
  return (
    <div className="instagram-ui independent-skin">
      <div className="app-nav ig-nav">
        <button
          aria-label="返回"
          onClick={() => (dm ? setDm(false) : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{dm ? "私信" : p.name}</strong>
        <div>
          {p.creator && (
            <button aria-label="新增内容" onClick={p.onAdd}>
              <Plus size={21} />
            </button>
          )}
          <button aria-label="照片墙 私信" onClick={() => setDm(!dm)}>
            <Send size={20} />
          </button>
        </div>
      </div>
      <div className="skin-scroll ig-scroll">
        {dm ? (
          <>
            {messages.map((i) => (
              <button
                key={i.id}
                className="ig-dm-row"
                onClick={() => p.onItem(i)}
              >
                <Avatar name={i.sender} round />
                <div>
                  <strong>{i.sender}</strong>
                  <p>{i.body}</p>
                </div>
              </button>
            ))}
            {!messages.length && <p className="skin-empty">暂无私信</p>}
            {p.creator && (
              <button className="phone-add" onClick={p.onAdd}>
                添加私信
              </button>
            )}
          </>
        ) : tab === "首页" ? (
          <>
            <div className="ig-stories">
              <button
                className="ig-story"
                onClick={
                  p.creator
                    ? p.onAdd
                    : () => {
                        if (stories[0]) p.onItem(stories[0]);
                      }
                }
                disabled={!p.creator && !stories.length}
              >
                <span>
                  <Avatar name="我" round />
                </span>
                <small>你的快拍</small>
              </button>
              {stories.map((i) => (
                <button
                  key={i.id}
                  className="ig-story"
                  onClick={() => p.onItem(i)}
                >
                  <span>
                    <Avatar name={i.sender} round />
                  </span>
                  <small>{i.sender}</small>
                </button>
              ))}
            </div>
            {posts.map((i) => (
              <article className="ig-post" key={i.id}>
                <div className="ig-post-author">
                  <Avatar name={i.sender} round />
                  <strong>{i.sender}</strong>
                  <button
                    aria-label={`帖子详情${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </div>
                <button className="ig-post-media" onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
                <div className="ig-post-controls">
                  <button
                    aria-label={`喜欢${i.title}`}
                    onClick={() =>
                      setLikes(
                        likes.includes(i.id)
                          ? likes.filter((x) => x !== i.id)
                          : [...likes, i.id],
                      )
                    }
                  >
                    <Heart
                      size={23}
                      fill={likes.includes(i.id) ? "#ed4956" : "none"}
                      color={likes.includes(i.id) ? "#ed4956" : "currentColor"}
                    />
                  </button>
                  <button
                    aria-label={`评论${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <MessageCircle size={22} />
                  </button>
                  <button
                    aria-label={`查看${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <Send size={21} />
                  </button>
                  <button
                    aria-label={`收藏${i.title}`}
                    onClick={() =>
                      setSaved(
                        saved.includes(i.id)
                          ? saved.filter((x) => x !== i.id)
                          : [...saved, i.id],
                      )
                    }
                  >
                    <Bookmark
                      size={22}
                      fill={saved.includes(i.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="ig-post-caption">
                  <strong>
                    {i.likes + (likes.includes(i.id) ? 1 : 0)} 次赞
                  </strong>
                  <p>
                    <b>{i.sender}</b> {i.body}
                  </p>
                  <button onClick={() => p.onItem(i)}>
                    查看全部 {i.comments.length} 条评论
                  </button>
                  <time>{i.time}</time>
                </div>
              </article>
            ))}
          </>
        ) : tab === "搜索" ? (
          <>
            <label className="ig-search">
              <Search size={15} />
              <input
                value={query}
                aria-label="搜索照片墙"
                placeholder="搜索"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="ig-explore">
              {shown.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
              ))}
            </div>
          </>
        ) : tab === "Reels" ? (
          <>
            {reels.map((i) => (
              <div className="ig-reel" key={i.id}>
                <ItemMedia item={i} />
                <button onClick={() => p.onItem(i)}>
                  {i.sender} · {i.title}
                </button>
              </div>
            ))}
            {!reels.length && <p className="skin-empty">暂无 Reels</p>}
          </>
        ) : (
          <>
            <div className="ig-profile">
              <Avatar name={posts[0]?.sender ?? "我"} round />
              <div>
                <strong>{posts.length}</strong>
                <small>帖子</small>
              </div>
              <div>
                <strong>0</strong>
                <small>关注者</small>
              </div>
              <div>
                <strong>0</strong>
                <small>正在关注</small>
              </div>
            </div>
            <h3 className="ig-profile-name">{posts[0]?.sender ?? "我"}</h3>
            <div className="ig-profile-tabs">
              <button aria-label="帖子网格" onClick={() => setShowSaved(false)}>
                <Grid size={21} />
              </button>
              <button
                aria-label="已收藏帖子"
                onClick={() => setShowSaved(true)}
              >
                <Bookmark size={21} />
              </button>
              <button
                aria-label="资料内容"
                onClick={() => {
                  const i = p.items.find((i) => i.folder === "个人主页");
                  if (i) p.onItem(i);
                  else if (p.creator) p.onAdd();
                }}
              >
                <AtSign size={21} />
              </button>
            </div>
            <div className="ig-explore">
              {shown.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <nav className="ig-bottom">
        {tabs.map((t) => (
          <button
            key={t.label}
            className={tab === t.label ? "selected" : ""}
            aria-label={`Instagram ${t.label}`}
            onClick={() => {
              setTab(t.label);
              setDm(false);
            }}
          >
            <t.icon size={23} />
          </button>
        ))}
      </nav>
    </div>
  );
}
