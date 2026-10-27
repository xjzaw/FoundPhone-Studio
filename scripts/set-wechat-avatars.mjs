import { readFile, writeFile } from "node:fs/promises";

const image = async (file) => {
  const bytes = await readFile(file);
  const mime = bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
};
const storyFile = "stories/template/story.json";
const story = JSON.parse(await readFile(storyFile, "utf8"));
const matthew = await image("wps.png");
const owner = await image("wps (1).png");
for (const contact of story.contacts) {
  if (["xing-zhuohui", "matthew-han"].includes(contact.id)) contact.avatar = "";
}
// One owner record supplies the avatar for every owner message in the WeChat skin.
let ownerStored = false;
const storedSenders = new Set();
for (const chat of story.chats.filter((chat) => chat.app === "wechat")) {
  for (const message of chat.messages) {
    if (message.senderId === "owner") {
      if (!ownerStored) { message.avatar = owner; ownerStored = true; }
    }
    if (["xing-zhuohui", "matthew-han"].includes(message.senderId)) {
      delete message.avatar;
      if (!storedSenders.has(message.senderId)) {
        message.avatar = matthew;
        storedSenders.add(message.senderId);
      }
    }
  }
}
await writeFile(storyFile, JSON.stringify(story, null, 2) + "\n");
console.log("微信头像：wps.png → Matthew；wps (1).png → 章明伯。");
