import { readFile, writeFile } from "node:fs/promises";

const snapshotFile = process.argv[2] || "public/story-assets/instagram/source.json";
const source = JSON.parse(await readFile(snapshotFile, "utf8"));
const file = "stories/template/story.json";
const story = JSON.parse(await readFile(file, "utf8"));
const image = async (path) => "data:image/jpeg;base64," + (await readFile(path)).toString("base64");
const avatar = await image("public/story-assets/instagram/avatar.jpg");
const months = { January: "01", February: "02", March: "03", April: "04", May: "05", June: "06", July: "07", August: "08", September: "09", October: "10", November: "11", December: "12" };
const profile = {
  id: "ins-profile-mingbozhang619", title: "章明伯", body: "官方账号\n🇨🇳｜演员\n微博：章明伯", sender: "mingbozhang619", avatar,
  kind: "event", time: "2026-10-27", folder: "个人资料",
  meta: { profile: "true", handle: "mingbozhang619", posts: "53", followers: "5.2万", following: "7", sourceUrl: "https://www.instagram.com/mingbozhang619/", capturedAt: "2026-10-27" },
};
const records = [];
for (let index = 0; index < source.posts.length; index++) {
  const post = source.posts[index];
  const match = post.alt.match(/on ([A-Za-z]+) (\d+), (\d{4})/);
  if (!match || !months[match[1]]) throw Error("公开封面缺少可确认的发布日期");
  const date = `${match[3]}-${months[match[1]]}-${match[2].padStart(2, "0")}`;
  const code = new URL(post.url).pathname.split("/p/")[1].split("/")[0];
  records.push({
    id: `ins-public-${code}`, title: `${date} 公开照片`, body: `${date.replace(/-/, "年").replace(/-/, "月")}日发布的公开照片。\n主页封面预览，完整轮播与正文可查看原帖。`,
    kind: "image", time: date, sender: "mingbozhang619", avatar,
    media: await image(`public/story-assets/instagram/post-${String(index).padStart(2, "0")}.jpg`),
    meta: { sourceUrl: post.url, capturedAt: "2026-10-27", carousel: "true", publicPost: "true", likesUnknown: "true", commentsUnknown: "true" },
  });
}
story.content.instagram = [...(story.content.instagram || []).filter((item) => item.id !== profile.id && !item.id.startsWith("ins-public-")), profile, ...records];
await writeFile(file, JSON.stringify(story, null, 2) + "\n");
await writeFile("public/story-assets/instagram/source.json", JSON.stringify({ profile: profile.meta, posts: source.posts.map(({ url, alt }, index) => ({ url, alt, file: `post-${String(index).padStart(2, "0")}.jpg` })) }, null, 2) + "\n");
console.log(`已导入照片墙主页和 ${records.length} 条公开封面。`);
