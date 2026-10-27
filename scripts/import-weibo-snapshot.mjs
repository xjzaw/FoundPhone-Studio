// Public Sina mirror snapshot, 2026-10-27. Text is a short excerpt or summary.
// Interaction totals are snapshots, not a live connection to the Weibo account.
import { readFile, writeFile } from "node:fs/promises";

const file = "stories/template/story.json";
const story = JSON.parse(await readFile(file, "utf8"));
const avatar = "data:image/jpeg;base64," + (await readFile("public/story-assets/weibo/zhang-mingbo-avatar.jpg")).toString("base64");
const records = [
  ["5358402945423095", "2026-10-26 22:51", "转发长征主题画卷，纪念先辈走过的道路，并鼓励继续前行。", "summary", 436, 205, "1215"],
  ["5358363971950556", "2026-10-26 20:16", "其实是菜鸟互啄🤫", "excerpt", 898, 1761, "6644"],
  ["5356543174509451", "2026-10-21 19:41", "纪念长征胜利九十周年，转发相关历史回顾，表达对先辈的敬意。", "summary", 658, 398, "2540"],
  ["5356169723905264", "2026-10-20 18:57", "沉浸式入秋🧣", "excerpt", 4104, 3140, "1.3万"],
  ["5352561744021995", "2026-10-10 20:00", "一段练习过程的 Vlog，配文表示还需要继续练习。", "summary", 3333, 2503, "1.5万"],
  ["5350704534520343", "2026-10-05 17:00", "交换一下好天气", "excerpt", 1468, 2657, "1.5万"],
  ["5350026335227059", "2026-10-03 20:05", "假期中的徒步视频，记录一路热闹的出行过程。", "summary", 2860, 1815, "9149"],
];
const imported = records.map(([mid, time, body, contentMode, reposts, commentCount, likeDisplay]) => ({
  id: `wb-public-${mid}`,
  title: `${time.slice(0, 10)} 微博`,
  body,
  time,
  sender: story.phone.owner,
  avatar,
  kind: mid === "5356169723905264" ? "image" : "post",
  likes: likeDisplay.includes("万") ? Math.round(parseFloat(likeDisplay) * 10000) : Number(likeDisplay),
  comments: [],
  meta: {
    publicPost: "true",
    following: "false",
    handle: time + " · 公开微博",
    reposts: String(reposts),
    commentCount: String(commentCount),
    likeDisplay,
    sourceUrl: `https://www.sina.cn/news/detail/${mid}.html`,
    sourceProfile: "https://weibo.com/u/7754628224",
    capturedAt: "2026-10-27",
    contentMode,
  },
}));
const photos = [];
for (let index = 0; index < 6; index++) {
  photos.push({
    id: `wb-public-5356169723905264-photo-${index}`,
    title: `2026-10-20 微博配图 ${index + 1}`,
    body: "",
    kind: "image",
    sender: story.phone.owner,
    time: "2026-10-20 18:57",
    media: "data:image/jpeg;base64," + (await readFile(`public/story-assets/weibo/autumn-${index}.jpg`)).toString("base64"),
    meta: { parentPost: "wb-public-5356169723905264", imageIndex: String(index) },
  });
}
imported.find((i) => i.id === "wb-public-5356169723905264").media = photos[0].media;
story.content.weibo = story.content.weibo.filter((i) => !i.id.startsWith("wb-public-") && i.id !== "wb-finish-note");
const profile = story.content.weibo.find((i) => i.meta?.profile === "true");
if (profile) {
  profile.meta.posts = "366";
  profile.meta.capturedAt = "2026-10-27";
}
story.content.weibo.push(...imported, ...photos);
await writeFile(file, JSON.stringify(story, null, 2) + "\n");
console.log(`Imported ${imported.length} public post excerpts/summaries and ${photos.length} photos.`);
