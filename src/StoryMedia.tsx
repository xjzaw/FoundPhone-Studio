import { createContext, useContext, useRef, useState, type SyntheticEvent, type MouseEvent } from "react";
import { safeMedia, type Item, type UiValue } from "./schema";

export const MediaProgressContext = createContext<{ui?: Record<string, UiValue>; onUi?: (key: string, value: UiValue) => void}>({});

export function StoryMedia({ item, className = "" }: { item: Item; className?: string }) {
  const progress = useContext(MediaProgressContext);
  const latest = useRef(progress);
  latest.current = progress;
  const last = useRef(-1);
  const src = safeMedia(item.media);
  const [failed, setFailed] = useState("");
  const [retry, setRetry] = useState(0);
  const kind = item.kind === "video" ? "视频" : item.kind === "audio" ? "音频" : "图片";
  const commit = (element: HTMLMediaElement, force = false) => {
    const time = element.currentTime;
    if (Number.isFinite(time) && (force || Math.abs(time - last.current) >= 5)) {
      last.current = time;
      latest.current.onUi?.(`media:${item.id}`, time);
    }
  };
  if (!src || failed === src) return <div className={`catalog-art media-placeholder ${className}`} role="status">
    <strong>{item.title}</strong>
    {item.kind !== "video" && <span>{!src ? (["video", "audio", "image"].includes(item.kind) ? `待添加${kind}` : "内容说明") : `${kind}加载失败`}</span>}
    {!!src && <button type="button" onClick={(event) => { event.stopPropagation(); setFailed(""); setRetry((n) => n + 1); }}>重新加载</button>}
  </div>;
  const error = () => setFailed(src);
  if (item.kind !== "video" && item.kind !== "audio") return <img key={`${src}:${retry}`} className={className} loading="lazy" alt={item.title} src={src} onError={error} />;
  const handlers = {
    controls: true,
    preload: "metadata" as const,
    src,
    className,
    onError: error,
    onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => {
      const saved = latest.current.ui?.[`media:${item.id}`];
      if (typeof saved === "number" && Number.isFinite(saved)) event.currentTarget.currentTime = Math.min(saved, Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : saved);
    },
    onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) => commit(event.currentTarget),
    onPause: (event: SyntheticEvent<HTMLMediaElement>) => commit(event.currentTarget, true),
    onSeeked: (event: SyntheticEvent<HTMLMediaElement>) => commit(event.currentTarget, true),
    onClick: (event: MouseEvent) => event.stopPropagation(),
  };
  return item.kind === "video" ? <video key={`${item.id}:${retry}`} {...handlers} playsInline aria-label={`播放视频：${item.title}`} /> : <audio key={`${item.id}:${retry}`} {...handlers} aria-label={`播放音频：${item.title}`} />;
}
