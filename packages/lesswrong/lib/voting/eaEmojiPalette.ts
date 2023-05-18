export type EmojiOption = {
  emoji: string,
  name: string,
  label: string,
}

export const eaEmojiPalette: EmojiOption[] = [
  {emoji: "🤝", name: "helpful", label: "Helpful"},
  {emoji: "💡", name: "changed-mind", label: "This changed my mind"},
  {emoji: "🕵️", name: "scount-mindset", label: "Scout mindset"},
  {emoji: "🧠", name: "well-reasoned", label: "Well-reasoned"},
  {emoji: "📖", name: "well-cited", label: "Well-cited"},
  {emoji: "❤️", name: "love", label: "Send love"},
  {emoji: "🙏", name: "thanks", label: "Thank you"},
  {emoji: "🎉", name: "celebrate", label: "Celebrate"},
  {emoji: "🤔", name: "confused", label: "I'm confused"},
  {emoji: "😂", name: "funny", label: "Funny"},
];

export const eaEmojiNames = eaEmojiPalette.map(({name}) => name);
