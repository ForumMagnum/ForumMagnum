import keyBy from 'lodash/keyBy';

export type NamesAttachedReactionType = {
  name: string,
  label: string,
  svg?: string,
  emoji?: string,
}
export const namesAttachedReactions: NamesAttachedReactionType[] = [
  // Positive
  {
    name: "verified",
    label: "I checked this",
    svg: "/public/check.svg", //checkmark
  },
  {
    name: "hitsTheMark",
    label: "On Point",
    svg: "/public/target.svg", //picture of a target
    emoji: "🎯",
  },
  {
    name: "clear",
    label: "Clear",
    svg: "/public/gem.svg", //picture of a gem
    emoji: "💎",
  },
  {
    name: "scout",
    label: "Scout Mindset",
    svg: "/public/binoculars.svg", //picture of binoculars
  },
  {
    name: "support",
    label: "Support",
    svg: "/public/pillar.svg", //picture of a pillar
  },
  {
    name: "key",
    label: "Key insight",
    svg: "/public/key.svg", //picture of a key
    emoji: "🔑",
  },

  // Negative
  {
    name: "error",
    label: "I spotted an error",
    svg: "/public/x.svg", //X
  },
  {
    name: "muddled",
    label: "Muddled",
    svg: "/public/reactionImages/splat.svg", //a splat of mud
  },
  {
    name: "combative",
    label: "Combative",
    svg: "/public/swords.svg", //picture of crossed swords
    emoji: "⚔️",
  },

  // Neutral
  // Make it concrete: picture of bricks ("make concrete")
  // I hear you: picture of an ear
  // {name: "skepticism", label: "Skepticism", icon: "🤨"},
  // {name: "enthusiasm", label: "Enthusiasm", icon: "🎉"},
  // {name: "empathy",    label: "Empathy",    icon: "❤️"},
  // {name: "surprise",   label: "Surprise",   icon: "😮"},
  {
    name: "seen",
    label: "I saw this",
    emoji: "👀",
  },
  
  // TODO find icons
  // {
  //   name: "thanks",
  //   label: "Thanks",
  //   icon: null, //TY
  // },
  // {
  //   name: "missesThePoint",
  //   label: "Missed the Point",
  //   icon: null, //gust of wind over a smiley face's head
  // },
];
export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r=>r.name);

export const namesAttachedReactionsPalette: string[][] = [
  ["verified", "error", "key"],
  ["hitsTheMark", "missesThePoint"],
  ["clear", "muddled", "scout", "combative"],
];
