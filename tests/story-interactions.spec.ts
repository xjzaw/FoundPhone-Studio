import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileStory } from "../src/story-engine/compiler";
const story = JSON.parse(readFileSync(new URL("../stories/template/story.json", import.meta.url), "utf8"));
const { work } = compileStory(story);

test.beforeEach(async ({ page }) => {
  await page.route("**/work.json", (route) => route.fulfill({ json: work }));
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁", exact: true }).click();
});
async function home(page: Page) {
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.getByRole("button", { name: "打开设置", exact: true })).toBeVisible();
}
async function open(page: Page, name: string) {
  await page.getByRole("button", { name: `打开${name}`, exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toBeVisible();
  await expect(page.getByText("正在打开…", { exact: true })).toHaveCount(0);
}

test("all installed story apps open and expose working navigation", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const app of work.apps.filter((app) => app.installed && app.visible)) {
    await open(page, app.name);
    const surface = page.locator(".app-screen:not([inert])");
    expect(await surface.getByRole("button").count(), app.name).toBeGreaterThan(1);
    const tabs = surface.locator(".catalog-tabs button, .weibo-mobile-nav button");
    if (await tabs.count() > 1) {
      await tabs.last().click();
      const profileBack = page.getByRole("button", { name: "返回微博首页", exact: true });
      if (await profileBack.isVisible()) await profileBack.click();
      else await tabs.first().click();
    }
    await home(page);
  }
  expect(errors).toEqual([]);
});

test("edited notes resume at the same detail after reload and app exit", async ({ page }) => {
  await open(page, "备忘录");
  await page.getByRole("button", { name: /收工前检查/ }).click();
  await page.getByRole("button", { name: "编辑备忘录", exact: true }).click();
  await page.getByRole("textbox", { name: "备忘录正文" }).fill("离开前写下的中文记录。");
  // No debounce or artificial delay: closing immediately must retain the edit.
  await page.reload();
  await expect(page.getByText("离开前写下的中文记录。", { exact: true })).toBeVisible();
  await home(page);
  await open(page, "备忘录");
  await expect(page.getByText("离开前写下的中文记录。", { exact: true })).toBeVisible();
});

test("settings toggles and the settings page persist", async ({ page }) => {
  await open(page, "设置");
  await page.getByRole("switch", { name: "飞行模式" }).check();
  await page.reload();
  await expect(page.getByRole("switch", { name: "飞行模式" })).toBeChecked();
});

test("WeChat messages and drafts resume in the same conversation", async ({ page }) => {
  await open(page, "微信");
  await page.locator(".wx-chat-row").filter({ hasText: "Matthew" }).first().click();
  await page.getByRole("textbox", { name: "聊天消息", exact: true }).fill("本地发送测试，稍后见。");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByRole("button", { name: "本地发送测试，稍后见。", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "聊天消息", exact: true }).fill("还没有发送的草稿");
  await page.reload();
  await expect(page.getByRole("button", { name: "本地发送测试，稍后见。", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "聊天消息", exact: true })).toHaveValue("还没有发送的草稿");
});

test("WeChat avatars match the supplied files in conversations and profile", async ({ page }) => {
  const matthew = readFileSync(new URL("../wps.png", import.meta.url)).toString("base64");
  const owner = readFileSync(new URL("../wps (1).png", import.meta.url)).toString("base64");
  await open(page, "微信");
  const conversation = page.locator(".wx-chat-row").filter({ hasText: "Matthew" }).first();
  expect((await conversation.locator("img").first().getAttribute("src"))?.split(",")[1]).toBe(matthew);
  await conversation.click();
  expect((await page.locator(".skin-message.outgoing .skin-avatar img").first().getAttribute("src"))?.split(",")[1]).toBe(owner);
  expect((await page.locator(".skin-message:not(.outgoing) .skin-avatar img").first().getAttribute("src"))?.split(",")[1]).toBe(matthew);
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await page.getByRole("button", { name: "我", exact: true }).click();
  expect((await page.locator(".wx-profile img").getAttribute("src"))?.split(",")[1]).toBe(owner);
});

test("Weibo scroll position and selected page resume", async ({ page }) => {
  await open(page, "微博");
  await page.getByRole("button", { name: "我", exact: true }).click();
  const scroll = page.locator(".weibo-ui .catalog-scroll");
  await scroll.evaluate((element) => { element.scrollTop = 650; });
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(500);
  await page.reload();
  await expect(page.getByRole("button", { name: "返回微博首页", exact: true })).toBeVisible();
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(500);
});

test("Instagram public profile has the correct grid and persistent interactions", async ({ page }) => {
  await open(page, "照片墙");
  await expect(page.locator(".igh .igl2")).toHaveText("mingbozhang619");
  await expect(page.locator(".ig-profile-description")).toContainText("章明伯");
  await expect(page.locator(".ig-profile-counts")).toContainText("53");
  await expect(page.locator(".ig-profile-counts")).toContainText("5.2万");
  await expect(page.locator(".ig-profile-counts button").nth(2)).toContainText("7");
  await expect(page.locator(".ig-profile-grid > button")).toHaveCount(12);
  await page.locator(".ig-profile-grid > button").first().click();
  const like = page.getByRole("button", { name: "点赞2026-10-25 公开照片", exact: true });
  await like.click();
  await page.getByRole("button", { name: "收藏2026-10-25 公开照片", exact: true }).click();
  await page.getByRole("button", { name: "评论2026-10-25 公开照片", exact: true }).click();
  await page.getByRole("textbox", { name: "添加评论", exact: true }).fill("记录下这一刻。");
  await page.getByRole("button", { name: "发布", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "照片墙评论", exact: true })).toContainText("记录下这一刻。");
  await page.getByRole("button", { name: "关闭评论面板", exact: true }).click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "返回照片墙动态", exact: true }).click();
  await page.getByRole("tab", { name: "已收藏", exact: true }).click();
  await expect(page.locator(".ig-profile-grid > button")).toHaveCount(1);
  await page.getByRole("tab", { name: "帖子", exact: true }).click();
  await expect(page.locator(".ig-profile-grid > button")).toHaveCount(12);
});

test("Instagram home mixes both authors and Matthew has an empty direct conversation", async ({ page }) => {
  await open(page, "照片墙");
  await expect(page.locator(".ig-profile-grid > button")).toHaveCount(12);
  await page.locator('.mymy-ig-nav button[aria-label="主页"]').click();
  await expect(page.locator('.igp[data-author="mingbozhang619"]')).toHaveCount(12);
  await expect(page.locator('.igp[data-author="matthewthehan"]')).toHaveCount(12);
  const dates = await page.locator(".igp").evaluateAll((posts) => posts.map((post) => post.getAttribute("data-time") || ""));
  expect(dates).toEqual([...dates].sort().reverse());
  const authors = await page.locator(".igp").evaluateAll((posts) => posts.slice(0, 3).map((post) => post.getAttribute("data-author")));
  expect(authors).toContain("mingbozhang619");
  expect(authors).toContain("matthewthehan");
  await page.locator('.mymy-ig-nav button[aria-label="个人主页"]').click();
  await expect(page.locator(".ig-profile-grid > button")).toHaveCount(12);
  await page.getByRole("button", { name: "打开私信", exact: true }).click();
  await page.getByRole("button", { name: "打开与Matthew的私信", exact: true }).click();
  await expect(page.locator(".ig-direct-header")).toContainText("Matthew");
  await expect(page.locator(".ig-direct-header")).toContainText("matthewthehan");
  await expect(page.getByText("暂无消息，对话内容待补充", { exact: true })).toBeVisible();
  await expect(page.locator(".ig-direct-message")).toHaveCount(0);
  await page.getByRole("textbox", { name: "私信消息", exact: true }).fill("待补充的私信草稿");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "私信消息", exact: true })).toHaveValue("待补充的私信草稿");
  await expect(page.locator(".ig-direct-message")).toHaveCount(0);
});

test("saved social posts and comments remain interactive", async ({ page }) => {
  await open(page, "小红书");
  await page.getByRole("button", { name: /收工后的松弛感/ }).click();
  await page.getByRole("button", { name: "收藏内容", exact: true }).click();
  await page.getByRole("textbox", { name: "评论内容" }).fill("记得早点休息。");
  await page.getByRole("button", { name: "发送评论", exact: true }).click();
  await page.reload();
  await expect(page.getByText(`${work.phone.owner}：记得早点休息。`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "取消收藏", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("all embedded images decode and missing videos show pending state", async ({ page }) => {
  test.setTimeout(120000);
  const sources = [...new Set(Object.values(work.data).flat().flatMap((item) => [item.media, item.avatar]).filter((src) => src.startsWith("data:image/")))];
  const failures = await page.evaluate(async (sources) => {
    const results = await Promise.all(sources.map((src, index) => new Promise<number | null>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth > 0 ? null : index);
      image.onerror = () => resolve(index);
      image.src = src;
    })));
    return results.filter((result) => result !== null);
  }, sources);
  expect(failures).toEqual([]);
  await open(page, "抖音");
  await expect(page.getByText("待添加视频", { exact: true })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await home(page);
  await open(page, "哔哩哔哩");
  await expect(page.getByText("待添加视频", { exact: true })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
});

test("Threads private profile has zero followers and persists edits and tabs", async ({ page }) => {
  await open(page, "脆");
  await expect(page.getByRole("heading", { name: "zanm1no", exact: true, level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: "0 位粉丝", exact: true })).toBeVisible();
  await expect(page.getByText("这是私密主页", { exact: true })).toHaveCount(0);
  await expect(page.getByText("私密账号", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "发布你的首篇串文", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "0 位粉丝", exact: true }).click();
  await expect(page.getByText("暂无粉丝", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭主页面板", exact: true }).click();
  await page.getByRole("button", { name: "编辑主页", exact: true }).click();
  await page.getByRole("textbox", { name: "脆主页简介", exact: true }).fill("只记录自己的日常。");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.getByRole("button", { name: "影音内容", exact: true }).click();
  await page.reload();
  await expect(page.getByText("只记录自己的日常。", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "影音内容", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("暂无媒体内容", { exact: true })).toBeVisible();
});


