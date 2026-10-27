import type { Item } from "../schema";

export function weiboLikes(item: Item, liked: boolean) {
  const source = item.meta.likeDisplay;
  // Public pages sometimes expose only a rounded total; don't invent precision.
  if (source && /[万亿w]/i.test(source)) return source + (liked ? "+1" : "");
  return String(item.likes + (liked ? 1 : 0));
}

export function weiboComments(item: Item, localReplies = 0) {
  const source = Number(item.meta.commentCount);
  const baseline = Number.isFinite(source) && source >= 0
    ? Math.max(source, item.comments.length)
    : item.comments.length;
  return String(baseline + localReplies);
}

export function weiboReposts(item: Item) {
  return item.meta.reposts?.replace(/^转发\s*/, "") || "0";
}
