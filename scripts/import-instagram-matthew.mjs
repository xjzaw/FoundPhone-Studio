import { readFile, writeFile } from "node:fs/promises";

const snapshotPath = process.argv[2] || "public/story-assets/instagram-matthew/source.json";
const source = JSON.parse(await readFile(snapshotPath, "utf8"));
const file = "stories/template/story.json";
const story = JSON.parse(await readFile(file, "utf8"));
const image = async (path) => "data:image/jpeg;base64," + (await readFile(path)).toString("base64");
const avatar = await image("public/story-assets/instagram-matthew/avatar.jpg");
const months = { January: "01", February: "02", March: "03", April: "04", May: "05", June: "06", July: "07", August: "08", September: "09", October: "10", November: "11", December: "12" };
const posts = [];
for (let index = 0; index < source.posts.length; index++) {
  const post = source.posts[index];
  const match = post.alt.match(/on ([A-Za-z]+) (\d+), (\d{4})/);
  if (!match || !months[match[1]]) throw Error("公开封面缺少可确认的发布日期");
  const date = `${match[3]}-${months[match[1]]}-${match[2].padStart(2, "0")}`;
  const code = new URL(post.url).pathname.split("/p/")[1].split("/")[0];
  posts.push({
    id: `ins-matthew-public-${code}`, title: `Matthew ${date} 公开照片`,
    body: `Matthew 于${date.replace(/-/, "年").replace(/-/, "月")}日发布的公开照片。\n主页封面预览，完整轮播与正文可查看原帖。`,
    kind: "image", time: date, sender: "matthewthehan", avatar,
    media: await image(`public/story-assets/instagram-matthew/post-${String(index).padStart(2, "0")}.jpg`),
    meta: { sourceUrl: post.url, sourceProfile: "https://www.instagram.com/matthewthehan/", capturedAt: "2026-10-27", carousel: "true", publicPost: "true", likesUnknown: "true", commentsUnknown: "true", following: "true" },
  });
}
const conversation = {
  id: "ins-dm-matthew", title: "Matthew", body: "", kind: "note", folder: "私信", time: "2026-10-27", sender: "matthewthehan", avatar,
  meta: { conversation: "true", handle: "matthewthehan", sourceProfile: "https://www.instagram.com/matthewthehan/", messagesPending: "true" },
};
story.content.instagram = [...(story.content.instagram || []).filter((item) => !item.id.startsWith("ins-matthew-public-") && item.id !== conversation.id), ...posts, conversation];
await writeFile(file, JSON.stringify(story, null, 2) + "\n");
await writeFile("public/story-assets/instagram-matthew/source.json", JSON.stringify({ account: "matthewthehan", capturedAt: "2026-10-27", posts: source.posts.map(({ url, alt }, index) => ({ url, alt, file: `post-${String(index).padStart(2, "0")}.jpg` })) }, null, 2) + "\n");
console.log(`已导入 Matthew 的 ${posts.length} 条公开封面及一个空白私信会话。`);
