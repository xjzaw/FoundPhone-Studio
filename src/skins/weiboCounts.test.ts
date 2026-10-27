import { describe, expect, it } from "vitest";
import { makeItem } from "../schema";
import { weiboComments, weiboLikes, weiboReposts } from "./weiboCounts";

describe("public Weibo snapshot counts", () => {
  it("increments and restores an exact like total", () => {
    const item = makeItem({ likes: 6644 });
    expect(weiboLikes(item, false)).toBe("6644");
    expect(weiboLikes(item, true)).toBe("6645");
    expect(weiboLikes(item, false)).toBe("6644");
  });

  it("preserves rounded public totals without inventing precision", () => {
    const item = makeItem({ likes: 13000, meta: { likeDisplay: "1.3万" } });
    expect(weiboLikes(item, false)).toBe("1.3万");
    expect(weiboLikes(item, true)).toBe("1.3万+1");
  });

  it("adds local comments to the snapshot total without fabricated comment bodies", () => {
    const item = makeItem({ meta: { commentCount: "1761" } });
    expect(item.comments).toEqual([]);
    expect(weiboComments(item)).toBe("1761");
    expect(weiboComments(item, 1)).toBe("1762");
  });

  it("handles empty records, legacy labels, and malformed totals", () => {
    expect(weiboLikes(makeItem(), false)).toBe("0");
    expect(weiboReposts(makeItem())).toBe("0");
    expect(weiboReposts(makeItem({ meta: { reposts: "转发 3" } }))).toBe("3");
    expect(weiboComments(makeItem({ comments: ["内容"], meta: { commentCount: "未知" } }))).toBe("1");
  });
});
