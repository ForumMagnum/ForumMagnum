import keyBy from 'lodash/keyBy';

export type NamesAttachedReactionType = {
  /**
   * Name of this reaction. Not shown directly, but typing its name into the
   * reactions-search box will find it. Used as the key for identifying
   * already-placed reactions.
   */
  name: string,
  
  /**
   * Additional search terms that can be used to find a reaction. If the image
   * is a mnemonic that doesn't match the name, should at least a name that
   * describes the image.
   */
  searchTerms?: string[],
  
  /**
   * Human-readable label string describing the reaction. Should start with a
   * capital letter, and be short (ideally one word).
   */
  label: string,
  
  /**
   * Image for this reaction. Should be an SVG, with the path relative to
   * /public. See comment below for discussion of reaction image sources.
   */
  svg: string,
  
  /**
   * A postprocessing filter to apply to the reaction's image. Can add padding
   * (makes the image part smaller since the total size stays the same), and set
   * opacity and saturation. Unset fields come from `defaultFilter`, below.
   */
  filter?: {
    padding?: number,
    opacity?: number,
    saturate?: number,
  },
  
  /**
   * A description of this reaction, ideally about a sentence long. Optionally,
   * expressed as a function that takes a content-type word, like "comment" or
   * "post", so that you can make the description something like
   * "This comment is <x>" and have it come out correct if it's a post/etc
   * instead of a comment. (We don't yet support reactions on posts but we might
   * in the future.
   */
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
    searchTerms: ["binoculars"],
    svg: "/reactionImages/nounproject/binoculars.svg",
    description: (contentType) => `This ${contentType} exhibits Scout Mindset.`,
  },
  {
    name: "concrete",
    label: "Concrete",
    searchTerms: ["bricks","examples"],
    svg: "/reactionImages/nounproject/bricks.svg",
    filter: { opacity: 1.0 },
    description: "This makes things more concrete by bringing in specifics or examples.",
  },
  {
    name: "harsh",
    label: "Too Harsh",
    searchTerms: ["cactus","prickly"],
    svg: "/reactionImages/nounproject/cactus.svg",
    description: "This seems too harsh.",
  },
  {
    name: "verified",
    label: "Verified",
    searchTerms: ["check","correct"],
    svg: "/reactionImages/nounproject/check.svg",
    description: "I checked this.",
  },
  {
    name: "clear",
    label: "Clear",
    searchTerms: ["clarity","gem","diamond"],
    svg: "/reactionImages/nounproject/clarity.svg",
    description: (contentType) => `This ${contentType} clarifies things.`,
  },
  {
    name: "complex",
    label: "Overcomplicated",
    searchTerms: ["overcomplicated"],
    svg: "/reactionImages/nounproject/complex.svg",
    filter: { opacity: 0.9 },
    description: (contentType) => `This ${contentType} seems overcomplicated`,
  },
  {
    name: "seen",
    label: "I saw this",
    searchTerms: ["eyes"],
    svg: "/reactionImages/nounproject/eyes.svg",
    filter: { opacity: 0.8 },
    description: "I saw this",
  },
  {
    name: "handshake",
    label: "I agree to this",
    searchTerms: ["agreement"],
    filter: { opacity: 0.9 },
    svg: "/reactionImages/nounproject/handshake.svg",
    description: "React to signal agreement (in the negotiation-y sense of the word)",
  },
  {
    name: "miss",
    label: "Missed the point",
    svg: "/reactionImages/nounproject/inaccurate.svg",
    description: "This seemed to focus in the wrong places, not on the core of the issue under discussion.",
  },
  {
    name: "key",
    label: "Key insight",
    searchTerms: ["insight"],
    svg: "/reactionImages/nounproject/key.svg",
    description: "This is a key insight",
  },
  {
    name: "support",
    label: "Support",
    searchTerms: ["pillar"],
    svg: "/reactionImages/nounproject/pillar.svg",
    description: `I am expressing supportiveness towards this`,
  },
  {
    name: "scholarship",
    label: "Virtue of Scholarship",
    searchTerms: ["cited"],
    svg: "/reactionImages/nounproject/scholarship.svg",
    description: "This exhibits the Virtue of Scholarship",
  },
  {
    name: "combative",
    label: "Combative",
    searchTerms: ["swords"],
    svg: "/reactionImages/nounproject/swords.svg",
    description: "This seems combative",
    filter: { padding: 2 },
  },
  {
    name: "hitsTheMark",
    label: "Hits the Mark",
    searchTerms: ["bullseye","accurate"],
    svg: "/reactionImages/nounproject/bullseye.svg",
    description: "This hits the mark",
  },
  {
    name: "error",
    label: "Wrong",
    searchTerms: ["x","wrong","mistaken"],
    svg: "/reactionImages/nounproject/x.svg",
    description: "This seems wrong",
  },
  {
    name: "muddled",
    label: "Muddled",
    searchTerms: ["splat","confused"],
    svg: "/reactionImages/nounproject/splat.svg",
    description: "I had trouble with the pedagogical clarity of this",
  },
  {
    name: "excitement",
    label: "Exciting",
    searchTerms: ["partypopper","!"],
    svg: "/reactionImages/nounproject/partypopper.svg",
    description: "This is exciting!",
  },
  {
    name: "skeptical",
    label: "Skeptical",
    searchTerms: ["eyebrow"],
    svg: "/reactionImages/nounproject/skeptical.svg",
    description: "I'm skeptical of this",
  },
  {
    name: "empathy",
    label: "Empathy",
    searchTerms: ["heart"],
    svg: "/reactionImages/nounproject/heart.svg",
    description: "I feel empathy towards this",
  },
  {
    name: "surprise",
    label: "Surprise",
    svg: "/reactionImages/nounproject/surprise.svg",
    filter: { opacity: 0.6 },
    description: "I am surprised",
  },
  {
    name: "additionalQuestions",
    label: "Additional questions",
    searchTerms: ["elephant","questions"],
    svg: "/reactionImages/nounproject/elephant.svg",
    filter: { opacity: 0.6 },
    description: "I now have additional questions",
  },
  {
    name: "strawman",
    label: "Strawman",
    searchTerms: ["scarecrow"],
    svg: "/reactionImages/nounproject/scarecrow.svg",
    description: "I think this misrepresents the thing that it argues against",
  },
  {
    name: "thanks",
    label: "Thank You",
    searchTerms: ["ty"],
    svg: "/reactionImages/nounproject/thankyou.svg",
    description: "I appreciate this",
  },
  {
    name: "important",
    label: "Important",
    searchTerms: ["!"],
    svg: "/reactionImages/nounproject/exclamation.svg",
    description: "This is important information",
  },
  {
    name: "insightful",
    label: "Insightful",
    searchTerms: ["lightbulb"],
    svg: "/reactionImages/nounproject/lightbulb.svg",
    description: (contentType) => `This ${contentType} adds insight to the conversation`,
  },
  {
    name: "shrug",
    label: "Shrug",
    svg: "/reactionImages/nounproject/shrug.svg",
    description: "I am indifferent to this",
  },
  {
    name: "laugh",
    label: "Laugh",
    svg: "/reactionImages/nounproject/laugh.svg",
    description: "This is humorous",
  },
  {
    name: "scales",
    label: "Scales",
    searchTerms: ["balanced"],
    svg: "/reactionImages/nounproject/scales.svg",
    description: "The evidence seems balanced",
  },
  {
    name: "thinking",
    label: "Thinking",
    svg: "/reactionImages/nounproject/thinking.svg",
    description: "Food for thought",
  },
  {
    name: "changemind",
    label: "Changed Mind",
    searchTerms: ["delta"],
    svg: "/reactionImages/nounproject/delta.svg",
    filter: { opacity: 0.6 },
    description: "Changed my mind",
  },
];
export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r=>r.name);

export const defaultFilter = {
  padding: 0,
  opacity: 0.4,
  saturate: 0.6,
}

export const namesAttachedReactionsPalette: string[][] = [
  ["verified", "error", "key"],
  ["hitsTheMark", "missesThePoint"],
  ["clear", "muddled", "scout", "combative"],
];
