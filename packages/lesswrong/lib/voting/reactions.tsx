import keyBy from 'lodash/keyBy';

export type NamesAttachedReactionType = {
  name: string,
  label: string,
  svg: string,
  filter?: {
    padding?: number,
    opacity?: number,
    saturate?: number,
  },
  description: string|((contentType:string)=>string),
}

/**
 * Reactions available.
 *
 * A reaction image should be an SVG image in /public/reactionImages. We don't
 * get emojis directly from fonts because there's too much variability between
 * platforms in how they look, but appropriately-licensed fonts like Noto Emoji
 * and OpenMoji are good sources of images to use.
 *
 *     The Noun Project: https://thenounproject.com/
 *     Noto Emoji: https://fonts.google.com/noto/specimen/Noto+Emoji
 *     OpenMoji: https://openmoji.org/library/
 *
 * When you add a downloaded image, record where you got it in
 * `public/reactionImages/sources.txt`. This is required to be able to meet the
 * attribution requirement of many licenses. If you get an image from a source
 * that hasn't been used before, you have to check its license and make sure
 * it's suitable.
 */

// OpenClipart and OpenMoji
/*export const namesAttachedReactions: NamesAttachedReactionType[] = [
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
    filter: { saturate: 0 },
    description: (contentType) => `This ${contentType} gets to the core of the issue, and is particularly on point.`,
  },
  {
    name: "clear",
    label: "Clear",
    svg: "/reactionImages/gem.svg", //picture of a gem
    description: (contentType) => `This ${contentType} clarifies things.`,
  },
  {
    name: "scout",
    label: "Scout Mindset",
    svg: "/reactionImages/binoculars.svg", //picture of binoculars
    description: (contentType) => `This ${contentType} is a positive example of "scout mindset"`,
  },
  {
    name: "support",
    label: "Support",
    svg: "/reactionImages/pillar.svg", //picture of a pillar
    filter: {opacity: .7, saturate: 0},
    description: `I am expressing supportiveness towards this`,
  },
  {
    name: "key",
    label: "Key insight",
    svg: "/reactionImages/key.svg", //picture of a key
    filter: { opacity: 1.0, saturate: 0.5 },
    description: "This is a key insight",
  },
  {
    name: "error",
    label: "I spotted an error",
    svg: "/reactionImages/x.svg", //X
    description: "I read this carefully and I think I see an error that makes the core argument incorrect",
  },
  {
    name: "muddled",
    label: "Muddled",
    svg: "/reactionImages/splat.svg", //a splat of mud
    description: "I had trouble with the pedagogical clarity of this",
  },
  {
    name: "combative",
    label: "Combative",
    svg: "/reactionImages/swords.svg", //picture of crossed swords
    description: "This seemed combative",
  },
  {
    name: "excitement",
    label: "Exciting",
    svg: "/reactionImages/partypopper.svg",
    filter: {opacity: .7, saturate: .4},
    description: "This is exciting!",
  },

  {
    name: "skeptical",
    label: "Skeptical",
    svg: "/reactionImages/skeptical.svg",
    filter: {opacity: .8, saturate: .5},
    description: "I'm skeptical of this claim but don't necessarily have a refutation",
  },
  {
    name: "empathy",
    label: "Empathy",
    svg: "/reactionImages/heart.svg",
    filter: {opacity: .7, saturate: .4},
    description: (contentType) => `I feel warmth towards the author of this ${contentType}`,
  },
  {
    name: "surprise",
    label: "Surprise",
    svg: "/reactionImages/surprise.svg",
    filter: {opacity: .8, saturate: .5},
    description: `I found this surprising`,
  },
  {
    name: "seen",
    label: "I saw this",
    svg: "/reactionImages/eyes.svg",
    filter: {opacity: .6, saturate: 0},
    description: "I saw this",
  },
  
  // TODO pick icons for:
  //   Too Harsh (cactus?)
  //   Thanks (crossed hands)
  //   Missed the Point (gust of wind over smiley's head)
  //   Make it concrete: picture of bricks ("make concrete")
  //   I hear you (picture of an ear)
  //   I now have additional questions (elephant)
  
  // Incorporate:
  //   complex.svg
  //   bricks.svg
  //   handshake.svg
  //   inaccurate.svg
];*/

// Noun Project
export const namesAttachedReactions: NamesAttachedReactionType[] = [
  {
    name: "scout",
    label: "Scout Mindset",
    svg: "/reactionImages/nounproject/binoculars.svg",
    description: (contentType) => `This ${contentType} exhibits Scout Mindset.`,
  },
  {
    name: "concrete",
    label: "Concrete",
    svg: "/reactionImages/nounproject/bricks.svg",
    description: "This makes things more concrete",
  },
  {
    name: "harsh",
    label: "Too Harsh",
    svg: "/reactionImages/nounproject/cactus.svg",
    description: "This seems unnecessarily harsh",
  },
  {
    name: "verified",
    label: "Verified",
    svg: "/reactionImages/nounproject/check.svg",
    description: "I checked this",
  },
  {
    name: "clear",
    label: "Clear",
    svg: "/reactionImages/nounproject/clarity.svg",
    description: (contentType) => `This ${contentType} clarifies things.`,
  },
  {
    name: "complex",
    label: "Overcomplicated",
    svg: "/reactionImages/nounproject/complex.svg",
    description: "This seems overcomplicated",
  },
  {
    name: "seen",
    label: "I saw this",
    svg: "/reactionImages/nounproject/eyes.svg",
    description: "I saw this",
  },
  {
    name: "handshake",
    label: "I agree to this",
    svg: "/reactionImages/nounproject/handshake.svg",
    description: "",
  },
  {
    name: "miss",
    label: "Missed the point",
    svg: "/reactionImages/nounproject/inaccurate.svg",
    description: "",
  },
  {
    name: "key",
    label: "Key insight",
    svg: "/reactionImages/nounproject/key.svg",
    description: "This is a key insight",
  },
  {
    name: "support",
    label: "Support",
    svg: "/reactionImages/nounproject/pillar.svg",
    description: `I am expressing supportiveness towards this`,
  },
  {
    name: "scholarship",
    label: "Virtue of Scholarship",
    svg: "/reactionImages/nounproject/scholarship.svg",
    description: "This exhibits the Virtue of Scholarship",
  },
  {
    name: "combative",
    label: "Combative",
    svg: "/reactionImages/nounproject/swords.svg",
    description: "This seems combative",
    filter: { padding: 2 },
  },
  {
    name: "hitsTheMark",
    label: "Hits the Mark",
    svg: "/reactionImages/nounproject/bullseye.svg",
    description: "This hits the mark",
  },
  {
    name: "error",
    label: "Wrong",
    svg: "/reactionImages/nounproject/x.svg",
    description: "This seems wrong",
  },
  {
    name: "muddled",
    label: "Muddled",
    svg: "/reactionImages/nounproject/splat.svg",
    description: "I had trouble with the pedagogical clarity of this",
  },
  {
    name: "excitement",
    label: "Exciting",
    svg: "/reactionImages/nounproject/partypopper.svg",
    description: "This is exciting!",
  },
  {
    name: "skeptical",
    label: "Skeptical",
    svg: "/reactionImages/nounproject/skeptical.svg",
    description: "I'm skeptical of this",
  },
  {
    name: "empathy",
    label: "Empathy",
    svg: "/reactionImages/nounproject/heart.svg",
    description: "I feel empathy towards this",
  },
  {
    name: "surprise",
    label: "Surprise",
    svg: "/reactionImages/nounproject/surprise.svg",
    description: "I am surprised",
  },
  {
    name: "additionalQuestions",
    label: "Additional questions",
    svg: "/reactionImages/nounproject/elephant.svg",
    description: "I now have additional questions",
  },
  {
    name: "strawman",
    label: "Strawman",
    svg: "/reactionImages/nounproject/scarecrow.svg",
    description: "I think this misrepresents the thing that it argues against",
  },
  {
    name: "thanks",
    label: "Thank You",
    svg: "/reactionImages/nounproject/thankyou.svg",
    description: "I appreciate this",
  },
  {
    name: "important",
    label: "Important",
    svg: "/reactionImages/nounproject/exclamation.svg",
    description: "This is important information",
  },
  {
    name: "insightful",
    label: "Insightful",
    svg: "/reactionImages/nounproject/lightbulb.svg",
    description: (contentType) => `This ${contentType} adds insight to the conversation`,
  },
  {
    name: "shrug",
    label: "Shrug",
    svg: "shrug.svg",
    description: "I am indifferent to this",
  },
  {
    name: "laugh",
    label: "Laugh",
    svg: "laugh.svg",
    description: "This is humorous",
  },
  {
    name: "scales",
    label: "Scales",
    svg: "scales.svg",
    description: "The evidence seems balanced",
  },
  {
    name: "thinking",
    label: "Thinking",
    svg: "thinking.svg",
    description: "Food for thought",
  },
  {
    name: "changemind",
    label: "Changemind",
    svg: "delta.svg",
    description: "Changed my mind",
  },
];
export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r=>r.name);

export const defaultFilter = {
  opacity: 0.4,
  saturate: 0.6,
}

export const namesAttachedReactionsPalette: string[][] = [
  ["verified", "error", "key"],
  ["hitsTheMark", "missesThePoint"],
  ["clear", "muddled", "scout", "combative"],
];
