import keyBy from 'lodash/keyBy';

export type NamesAttachedReactionType = {
  name: string,
  label: string,
  svg?: string,
  emoji?: string,
  description?: string|((contentType:string)=>string),
}

/**
 * Reactions available.
 *
 * A reaction image should either be an image file (SVG preferred,
 * PNG is acceptable) in /public/reactionImages, or a Unicode emoji. Note
 * that Unicode emojis are provided by the font-stack, and are much-more-likely
 * than normal text to be falling back on system fonts; so if you use a Unicode
 * emoji, you need to separately test that it displays correctly on every major
 * platform: MacOS, Windows, Android Chrome, iOS, Ubuntu. So if you've found
 * a Unicode emoji you like, you probably want to get an image version from one
 * of these sources:
 *     Noto Emoji: https://fonts.google.com/noto/specimen/Noto+Emoji
 *     OpenMoji: https://openmoji.org/library/
 * When you add a downloaded image, record where you got it in
 * `public/reactionImages/sources.txt`. This is required to be able to meet the
 * attribution requirement of the licenses. If you get an image from a source
 * that hasn't been used before, you have to check its license and make sure
 * it's suitable.
 */
export const namesAttachedReactions: NamesAttachedReactionType[] = [
  // Positive
  {
    name: "verified",
    label: "I checked this",
    svg: "/reactionImages/check.svg", //checkmark
    description: "I read this carefully and verified its core claims.",
  },
  {
    name: "hitsTheMark",
    label: "On Point",
    svg: "/reactionImages/target.svg", //picture of a target
    emoji: "🎯",
    description: (contentType) => `This ${contentType} gets to the core of the issue, and is particularly on point.`,
  },
  {
    name: "clear",
    label: "Clear",
    svg: "/reactionImages/gem.svg", //picture of a gem
    emoji: "💎",
    description: (contentType) => `This ${contentType} clarifies things.`
  },
  {
    name: "scout",
    label: "Scout Mindset",
    svg: "/reactionImages/binoculars.svg", //picture of binoculars
  },
  {
    name: "support",
    label: "Support",
    svg: "/reactionImages/pillar.svg", //picture of a pillar
  },
  {
    name: "key",
    label: "Key insight",
    svg: "/reactionImages/key.svg", //picture of a key
    emoji: "🔑",
  },
  {
    name: "error",
    label: "I spotted an error",
    svg: "/reactionImages/x.svg", //X
  },
  {
    name: "muddled",
    label: "Muddled",
    svg: "/reactionImages/splat.svg", //a splat of mud
  },
  {
    name: "combative",
    label: "Combative",
    svg: "/reactionImages/swords.svg", //picture of crossed swords
    emoji: "⚔️",
  },
  {
    name: "excitement",
    label: "Exciting",
    emoji: "🎉",
  },

  {
    name: "skeptical",
    label: "Skeptical",
    emoji: "🤨"
  },
  {
    name: "empathy",
    label: "Empathy",
    emoji: "❤️"
  },
  {
    name: "surprise",
    label: "Surprise",
    emoji: "😮"
  },
  {
    name: "seen",
    label: "I saw this",
    emoji: "👀",
  },
  
  // TODO pick icons for:
  //   Thanks
  //   Missed the Point (gust of wind over smiley's head)
  //   Make it concrete: picture of bricks ("make concrete")
  //   I hear you (picture of an ear)
  //   I now have additional questions (elephant)
];
export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r=>r.name);

export const namesAttachedReactionsPalette: string[][] = [
  ["verified", "error", "key"],
  ["hitsTheMark", "missesThePoint"],
  ["clear", "muddled", "scout", "combative"],
];
