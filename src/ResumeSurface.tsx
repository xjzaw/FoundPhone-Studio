import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { UiValue } from "./schema";
import { MediaProgressContext } from "./StoryMedia";

export function ResumeSurface({ ui, onUi, children }: {
  ui?: Record<string, UiValue>;
  onUi: (key: string, value: UiValue) => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(ui);
  latest.current = ui;
  const route = JSON.stringify(Object.entries(ui ?? {}).filter(([key]) => !key.startsWith("scroll:") && /navigation:(detail|thread)|view.*(tab|section|folder|album|feed|stack|selected|grid|panel|sheet|direct)|tab$/i.test(key)).sort());
  const slot = (element: Element) => {
    const classes = element.className.toString().split(/\s+/).slice(0, 3).join(".");
    const peers = root.current ? [...root.current.querySelectorAll("*")].filter((e) => e.className === element.className) : [];
    return `scroll:${route}:${classes}:${peers.indexOf(element)}`;
  };
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const restored = new WeakSet<Element>();
    const restore = () => {
      for (const element of host.querySelectorAll<HTMLElement>("*")) {
        if (restored.has(element) || element.scrollHeight <= element.clientHeight || !element.clientHeight) continue;
        const classes = element.className.toString().split(/\s+/).slice(0, 3).join(".");
        const peers = [...host.querySelectorAll("*")].filter((e) => e.className === element.className);
        const value = latest.current?.[`scroll:${route}:${classes}:${peers.indexOf(element)}`];
        if (typeof value === "number") element.scrollTop = value;
        restored.add(element);
      }
    };
    restore();
    const capture = () => {
      for (const element of host.querySelectorAll<HTMLElement>("*")) {
        if (element.scrollHeight <= element.clientHeight || !element.clientHeight) continue;
        const classes = element.className.toString().split(/\s+/).slice(0, 3).join(".");
        const peers = [...host.querySelectorAll("*")].filter((e) => e.className === element.className);
        onUi(`scroll:${route}:${classes}:${peers.indexOf(element)}`, Math.round(element.scrollTop));
      }
    };
    window.addEventListener("pagehide", capture);
    const observer = new MutationObserver(restore);
    observer.observe(host, { childList: true, subtree: true });
    return () => { observer.disconnect(); window.removeEventListener("pagehide", capture); };
  }, [route]);
  return <MediaProgressContext.Provider value={{ ui, onUi }}><div ref={root} style={{ display: "contents" }} onScrollCapture={(event) => {
    if (event.target instanceof HTMLElement && event.target.scrollHeight > event.target.clientHeight)
      onUi(slot(event.target), Math.round(event.target.scrollTop));
  }}>{children}</div></MediaProgressContext.Provider>;
}
