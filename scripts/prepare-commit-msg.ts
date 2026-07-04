import fs from 'node:fs/promises'

const commitMsgPath = process.argv[2]
if (!commitMsgPath) process.exit(0)

const emojiString = '✨🚀🐛🔥🎨⚡📝🔒♻️🐳🛠️📦🧪🚨🧹'

const currentMessage = await fs.readFile(commitMsgPath, 'utf8')

const emojis = Array.from(emojiString)
const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
const newMessage = `${randomEmoji} ${currentMessage}`

await fs.writeFile(commitMsgPath, newMessage)
