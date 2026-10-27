// Add interactive story records without changing the authored chat timeline.
import { readFile, writeFile } from "node:fs/promises";
const file = "stories/template/story.json";
const story = JSON.parse(await readFile(file, "utf8"));
const put = (app, records) => {
  const ids = new Set(records.map((r) => r.id));
  story.content[app] = [...(story.content[app] ?? []).filter((r) => !ids.has(r.id)), ...records];
};
put("contacts", [
  { id: "contact-owner-card", title: story.phone.owner, body: "我的名片", sender: story.phone.owner, time: "2026-10-26 09:00", kind: "note" },
  ...story.contacts.map((c) => ({ id: `contact-card-${c.id}`, title: c.name, body: c.bio || "联系人", sender: c.name, time: "2026-10-26 09:00", kind: "note", meta: { phone: c.phone || "", contactId: c.id } })),
]);
put("alipay", [
  { id: "alipay-story-dinner", title: "晚餐支出", body: "本地故事中的餐饮账单，可查看金额和交易时间。", kind: "order", time: "2026-10-26 20:10", sender: "巷口小店", meta: { merchant: "巷口小店", amount: "-86.00", status: "交易成功", number: "虚构账单一" } },
  { id: "alipay-story-card", title: "故事餐饮优惠券", body: "仅供故事内查看，不用于实际消费。", kind: "note", folder: "卡包", time: "2026-10-26 18:00", sender: "卡包", meta: { status: "待使用", amount: "10元" } },
]);
put("taobao", [
  { id: "taobao-story-cup", title: "随行保温杯", body: "工作随身物品备选。可在详情中加入本地收藏清单。", kind: "post", folder: "商品", time: "2026-10-25 18:30", sender: "日常用品店", meta: { price: "59.00", status: "商品展示" } },
  { id: "taobao-story-order", title: "衬衫收纳袋", body: "本地故事订单，已收货。", kind: "order", folder: "订单", time: "2026-10-24 13:10", sender: "日常用品店", meta: { price: "29.00", status: "已完成", number: "虚构订单一" } },
  { id: "taobao-story-logistics", title: "衬衫收纳袋配送记录", body: "包裹已送达酒店前台。", kind: "order", folder: "物流", time: "2026-10-25 15:20", sender: "故事快递", meta: { status: "已完成", tracking: "酒店前台已签收", price: "29.00" } },
]);
const photos = (story.content.weibo ?? []).filter((i) => i.meta?.parentPost);
put("photos", photos.map((i, n) => ({ ...i, id: `album-public-photo-${n}`, folder: "公开微博配图", meta: { source: "章明伯公开微博配图" } })));
for (const [app, items] of Object.entries(story.content)) {
  for (const item of items) {
    if (item.kind === "video" && !item.media) item.meta = { ...item.meta, mediaStatus: "待添加视频" };
    if (app !== "wechat") {
      for (const field of ["title", "body"]) if (typeof item[field] === "string") item[field] = item[field].replace(/Vlog|VLOG|vlog/g, "视频日记");
    }
  }
}
const profile = story.content.weibo?.find((i) => i.meta?.profile === "true");
if (profile) profile.meta.vip = "会员1级";
await writeFile(file, JSON.stringify(story, null, 2) + "\n");
console.log("已补齐通讯录、相册、账单、商品、订单和物流记录；缺失视频保留待添加标记。");
