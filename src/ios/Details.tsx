import { useEffect, useState } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Share,
  Heart,
  Phone,
  MessageCircle,
  Video,
  Folder,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { RichText } from "../RichText";
import { safeMedia, type Item } from "../schema";
import type { UiValue } from "../schema";
import { useSkinState } from "../skinState";
import { StoryMedia } from "../StoryMedia";
const matthewCallbackLines = [
  "Matthew：晚上下班去喝一杯？",
  "章明伯：可以，我正好昨天刷到一家不错的bar，晚点把地址发你",
  "Matthew：今天多喝两杯，你没门禁吧",
  "章明伯：哪有门禁",
  "章明伯：怎么想喝酒了，喝多了怎么办",
  "Matthew：歌上线了庆祝一下，多喝两杯，喝多了睡我那",
  "章明伯：又要灌我是吧",
  "章明伯：那晚上见",
];
export const nativeDetailApps = new Set([
  "notes",
  "photos",
  "contacts",
  "phone",
  "calendar",
  "files",
  "safari",
]);
export function NativeDetail({
  app,
  item,
  back,
  ui,
  onCallback,
  onUi,
}: {
  app: string;
  item: Item;
  back: () => void;
  ui?: Record<string, UiValue>;
  onCallback?: (item: Item) => void;
  onUi?: (key: string, value: UiValue) => void;
}) {
  const persistent = { ui, onUi };
  const [favorite, setFavorite] = useSkinState(persistent, `favorite:${item.id}`, item.favorite);
  const [body, setBody] = useSkinState(persistent, `note-body:${item.id}`, item.body);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false),
    [call, setCall] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callClock, setCallClock] = useState(Date.now());
  const isMatthewCallback = app === "phone" && item.kind === "call" && item.title === "Matthew" && item.meta.callback === "true";
  const elapsed = callStartedAt === null ? 0 : Math.floor((callClock - callStartedAt) / 1000);
  const media = safeMedia(item.media),
    name =
      app === "notes"
        ? "备忘录"
        : app === "contacts"
          ? "通讯录"
          : app === "photos"
            ? "所有照片"
            : app === "phone"
              ? "最近通话"
              : app === "calendar"
                ? "日历"
                : app === "files"
                  ? "浏览"
                  : "书签";
  useEffect(() => {
    if (callStartedAt === null) return;
    const tick = window.setInterval(() => setCallClock(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [callStartedAt]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(app === "notes" ? body : item.body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={"native-detail native-detail-" + app}>
      <header className="app-nav">
        <button aria-label="返回" onClick={back}>
          <ChevronLeft size={24} />
          {name}
        </button>
        <strong>{app === "photos" ? item.time.slice(0, 10) : ""}</strong>
        <button aria-label="更多操作" onClick={() => setCopied(!copied)}>
          <MoreHorizontal size={23} />
        </button>
      </header>
      {copied && (
        <div className="native-action-sheet">
          <button onClick={copy}>
            <Copy size={18} />
            复制文字
          </button>
          <button onClick={() => setCopied(false)}>取消</button>
        </div>
      )}
      {app === "photos" ? (
        <>
          <div className="native-photo-stage">
            {media ? (
              <StoryMedia item={item} />
            ) : (
              <div className="native-photo-caption">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            )}
          </div>
          <footer className="native-detail-toolbar">
            <button aria-label="分享照片说明" onClick={copy}>
              <Share />
            </button>
            <button
              aria-label="收藏照片"
              onClick={() => setFavorite(!favorite)}
            >
              <Heart fill={favorite ? "#007aff" : "none"} />
            </button>
            <span>{copied ? "已复制" : item.title}</span>
          </footer>
        </>
      ) : app === "contacts" || app === "phone" ? (
        <div className="native-detail-scroll">
          <div className="native-contact-hero">
            <span>{item.title.slice(0, 1)}</span>
            <h1>{item.title}</h1>
          </div>
          {(app === "contacts" || (app === "phone" && item.kind !== "call")) ? (
            <div className="native-contact-actions">
              {[
                [MessageCircle, "信息"],
                [Phone, "呼叫"],
                [Video, "视频"],
              ].map(([Icon, label]) => {
                const Glyph = Icon as typeof Phone;
                return (
                  <button key={String(label)} onClick={() => setCall(true)}>
                    <Glyph size={23} />
                    {String(label)}
                  </button>
                );
              })}
            </div>
          ) : item.meta.callback === "true" ? (
            <div className="native-contact-actions">
              <button aria-label={`回拨${item.title}`} onClick={() => onCallback?.(item)}>
                <Phone size={23} />回拨
              </button>
            </div>
          ) : null}          <div className="native-detail-group">
            <small>手机</small>
            <p className="native-blue">{item.meta.phone || "未设置号码"}</p>
          </div>
          <div className="native-detail-group">
            <small>备注</small>
            <p>{item.body}</p>
          </div>
          {call && isMatthewCallback ? (
            <div className="native-callback-call-screen" role="dialog" aria-modal="true" aria-label="与 Matthew 通话">
              <small>系统电话 · 微信语音通话</small>
              <div className="native-callback-avatar">M</div>
              <h2>Matthew</h2>
              <time>{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</time>
              <p>{elapsed >= matthewCallbackLines.length * 4 ? "通话已结束" : matthewCallbackLines[Math.min(matthewCallbackLines.length - 1, Math.floor(elapsed / 4))]}</p>
              <button onClick={() => { setCall(false); setCallStartedAt(null); }}>{elapsed >= matthewCallbackLines.length * 4 ? "完成" : "挂断"}</button>
            </div>
          ) : call ? (
            <div className="native-detail-group">
              <p>作品内模拟 · {item.title}</p>
              <button onClick={() => setCall(false)}>结束</button>
            </div>
          ) : null}
        </div>
      ) : app === "notes" ? (
        <>
          <div className="native-detail-scroll native-note-paper">
            <time>{item.time}</time>
            <h1>{item.title}</h1>
            {editing ? <textarea aria-label="备忘录正文" className="editable-note" value={body} onChange={(event) => setBody(event.target.value)} /> : <RichText value={body === item.body ? item.richText : ""} fallback={body} />}
          </div>
          <footer className="native-detail-toolbar">
            <button aria-label="返回文件夹" onClick={back}>
              <Folder />
            </button>
            <button aria-label={editing ? "完成编辑备忘录" : "编辑备忘录"} onClick={() => setEditing(!editing)}>{editing ? "完成" : "编辑"}</button>
            <button aria-label="复制备忘录" onClick={copy}>
              {copied ? <Check /> : <Share />}
            </button>
          </footer>
        </>
      ) : app === "calendar" ? (
        <div className="native-detail-scroll native-event-paper">
          <h1>{item.title}</h1>
          <p>{item.time}</p>
          <div className="native-detail-group">
            <small>日程</small>
            <p>{item.body}</p>
          </div>
          {Object.entries(item.meta).map(([k, v]) => (
            <div className="native-detail-group" key={k}>
              <small>{k}</small>
              <p>{v}</p>
            </div>
          ))}
        </div>
      ) : app === "safari" ? (
        <>
          <div className="native-detail-scroll native-reader">
            <h1>{item.title}</h1>
            <RichText value={item.richText} fallback={item.body} />
          </div>
          <footer className="native-reader-address">
            <Search size={16} />
            <span>{item.meta.url || item.title}</span>
            <Share size={18} />
          </footer>
        </>
      ) : (
        <div className="native-detail-scroll native-file-preview">
          <Folder size={64} color="#007aff" />
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          <small>{item.time}</small>
          <button onClick={copy}>复制内容</button>
        </div>
      )}
    </div>
  );
}

