import { useEffect, useState } from "react";
import type { SkinProps } from "../AppSkins";
import { makeItem, type Item } from "../schema";
import { useSkinState } from "../skinState";

type ScriptRound = { reply: string; incoming?: string };
const rounds: ScriptRound[] = [
  { reply: "歌上线了，你听了吗？", incoming: "正在听。" },
  { reply: "我特别喜欢你的特色咬字哈哈哈", incoming: "又来，真的吗？" },
  { reply: "怎么了哥哥，不相信我？", incoming: "不是营业吗？" },
  { reply: "哈哈哈哈你都会用营业了，我教的太好了" },
];
export const firstCallCaptions = ["章明伯：怎么了哥？", "Matthew：营业是什么意思？", "章明伯：啊？你不知道什么意思啊，那你问我是不是营业？", "Matthew：所以你是吗？", "章明伯：哥你又绕我……先不说了，我正做饭呢"];
export const secondCallCaptions = ["Matthew：晚上下班去喝一杯？", "章明伯：可以，我正好昨天刷到一家不错的bar，晚点把地址发你", "Matthew：今天多喝两杯，你没门禁吧", "章明伯：哪有门禁", "章明伯：怎么想喝酒了，喝多了怎么办", "Matthew：歌上线了庆祝一下，多喝两杯，喝多了睡我那", "章明伯：又要灌我是吧", "章明伯：那晚上见"];
const captions = [
  firstCallCaptions,
  secondCallCaptions,
];
type State = { phase: string; dueAt?: number; round?: number; messages?: Item[]; startedAt?: number; segment?: number; missed?: boolean; redialCount?: number; composerOpen?: boolean; draft?: string };
const parse = (raw: string): State => { try { return JSON.parse(raw) as State; } catch { return { phase: "" }; } };
function message(body: string, outgoing = false, meta: Record<string,string> = {}): Item {
  return makeItem({ id: `wx-alarm-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, title: "Matthew", sender: outgoing ? "章明伯" : "Matthew", body, outgoing, kind: "text", time: "2026-10-27 22:19", meta: { ...meta, alarmScript: "true" } });
}
export function WeChatAlarmChat({ p, history, renderMessages }: { p: SkinProps; history: Item[]; renderMessages: (items: Item[]) => React.ReactNode }) {
  const [raw, setRaw] = useSkinState(p, "wechat-duet-alarm-v5", "");
  const state = parse(raw);
  const [clock, setClock] = useState(0);
  useEffect(() => {
    if (!raw) setRaw(JSON.stringify({ phase: "reply", round: 0, messages: [message("怎么了", false, { chatTimestampLabel: "2026年10月27日 22:19" })] } satisfies State));
  }, [raw]);
  useEffect(() => {
    if (!state.phase.startsWith("connected") || state.phase.endsWith("-done")) return;
    const timer = window.setInterval(() => setClock(v => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase]);
  useEffect(() => {
    if (state.phase === "calling2") { const timer = window.setTimeout(() => setRaw(JSON.stringify({ ...state, phase: "connected2", startedAt: Date.now() })), 1300); return () => window.clearTimeout(timer); }
    if (state.phase.startsWith("connected")) {
      const elapsed = Math.floor((Date.now() - (state.startedAt || Date.now())) / 1000);
      const lines = captions[(state.segment || 1) - 1] || [];
      if (elapsed >= lines.length * 4) setRaw(JSON.stringify({ ...state, phase: state.segment === 2 ? "ended" : "connected" + state.segment + "-done" }));
    }
  }, [clock, state.phase, state.startedAt]);
  useEffect(() => {
    if (!state.composerOpen) return;
    const target = rounds[state.round || 0].reply;
    const current = state.draft || "";
    if (current === target) return;
    const timer = window.setTimeout(() => setRaw(JSON.stringify({ ...state, draft: target.slice(0, current.length + 1) })), 55);
    return () => window.clearTimeout(timer);
  }, [state.composerOpen, state.round, state.draft]);
  const choose = (answer: string) => {
    const n = state.round || 0;
    const nextMessages = [...(state.messages || []), message(answer, true)];
    if (n < rounds.length - 1) {
      const incoming = rounds[n].incoming;
      if (incoming) nextMessages.push(message(incoming, false));
      setRaw(JSON.stringify({ ...state, phase: "reply", round: n + 1, messages: nextMessages, composerOpen: false, draft: "" }));
    } else {
      setRaw(JSON.stringify({ ...state, phase: "first-call-wait", dueAt: Date.now() + 10000, segment: 1, messages: nextMessages, composerOpen: false, draft: "" }));
    }
  };
  const openComposer = () => setRaw(JSON.stringify({ ...state, composerOpen: true, draft: "" }));
const avatars = new Map(p.items.filter((item) => item.avatar).map((item) => [item.sender, item.avatar]));
const visible = [...history, ...(state.messages || []).filter((item) => item.meta.callMissed !== "true")].map((item) =>
  !item.avatar && avatars.has(item.sender) ? { ...item, avatar: avatars.get(item.sender)! } : item,
);
  return <>
    {renderMessages(visible)}
    {state.phase === "reply" && <>
      <div className="wx-native-composer">
        <button className="wx-native-voice" aria-label="语音">◉</button>
        <button className="wx-native-input" onClick={openComposer}>{state.draft || "点击输入回复"}</button>
        <button className="wx-native-icon" aria-label="表情">☺</button>
        <button className="wx-native-icon" aria-label="更多">＋</button>
      </div>
      {state.composerOpen && <div className="wx-native-input-panel">
        <div className="wx-native-keyboard-toolbar"><button disabled={!state.draft || state.draft !== rounds[state.round || 0].reply} onClick={() => state.draft && choose(state.draft)}>发送</button></div>
        <div className="wx-native-keyboard" aria-hidden="true">
          <div className="wx-native-key-row">{["q w e r t y u i o p","a s d f g h j k l","⇧ z x c v b n m ⌫"].map((row, i) => <div key={i}>{row.split(" ").map((key, j) => <span key={j}>{key}</span>)}</div>)}</div>
          <div className="wx-native-key-row wx-native-key-bottom"><span>123</span><span>🙂</span><span>空格</span><span>发送</span></div>
        </div>
      </div>}
    </>}
    {state.phase === "declined-request" && <div className="wx-alarm-controls"><span>你决定稍后再通话。</span></div>}
  </>;
}



