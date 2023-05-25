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
export const namesAttachedReactions: NamesAttachedReactionType[] = [
  {
    name: "changemind",
    label: "You Changed My Mind",
    searchTerms: ["delta"],
    svg: "/reactionImages/nounproject/delta.svg",
    filter: { opacity: 0.6 },
    description: (contentType) => `This ${contentType} changed my mind`,
  },
  {
    name: "insightful",
    label: "Insightful",
    searchTerms: ["lightbulb"],
    svg: "/reactionImages/nounproject/lightbulb.svg",
    description: (contentType) => `This ${contentType} adds insight to the conversation`,
  },
  {
    name: "scout",
    label: "Scout Mindset",
    searchTerms: ["binoculars"],
    svg: "/reactionImages/nounproject/binoculars.svg",
    description: (contentType) => `This ${contentType} exhibits Scout Mindset.`,
  },
  {
    name: "scholarship",
    label: "Virtue of Scholarship",
    searchTerms: ["cited"],
    svg: "/reactionImages/nounproject/scholarship.svg",
    description: "This exhibits the Virtue of Scholarship",
  },
  {
    name: "concrete",
    label: "Concrete",
    searchTerms: ["bricks","examples"],
    svg: "/reactionImages/nounproject/concrete.svg",
    filter: { opacity: 1.0 },
    description: "This makes things more concrete by bringing in specifics or examples.",
  },
  {
    name: "key",
    label: "Key insight",
    searchTerms: ["insight"],
    svg: "/reactionImages/nounproject/key.svg",
    description: "This is a key insight",
  },
  {
    name: "verified",
    label: "Verified",
    searchTerms: ["check","correct"],
    svg: "/reactionImages/nounproject/check.svg",
    description: "I checked this.",
  },
  {
    name: "error",
    label: "Wrong",
    searchTerms: ["x","wrong","mistaken"],
    svg: "/reactionImages/nounproject/x.svg",
    description: "This seems wrong",
  },
  {
    name: "support",
    label: "Support",
    searchTerms: ["pillar"],
    svg: "/reactionImages/nounproject/pillar.svg",
    description: `I am expressing supportiveness towards this`,
  },
  {
    name: "harsh",
    label: "Too Harsh",
    searchTerms: ["cactus","prickly"],
    svg: "/reactionImages/nounproject/cactus.svg",
    description: "This seems too harsh.",
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
    description: (contentType) => `I'm registering that I saw this ${contentType}`,
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
    name: "hitsTheMark",
    label: "Hits the Mark",
    searchTerms: ["bullseye","accurate"],
    svg: "/reactionImages/nounproject/bullseye.svg",
    description: "This hits the mark",
  },
  {
    name: "miss",
    label: "Missed the point",
    svg: "/reactionImages/nounproject/inaccurate.svg",
    description: "This seemed to focus in the wrong places, not on the core of the issue under discussion.",
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
    label: "Seems Borderline",
    searchTerms: ["balanced"],
    svg: "/reactionImages/nounproject/scales.svg",
    description: "I think this could go either way",
  },
  {
    name: "thinking",
    label: "Thinking",
    svg: "/reactionImages/nounproject/thinking.svg",
    description: "Food for thought",
  },
  {
    name: "obtuse",
    label: "Obtuse",
    svg: "/reactionImages/nounproject/obtuse.svg",
    description: "This comment is failing to understand something that didn't seem hard to understand",
  },
  {
    name: "replyLater",
    label: "I'll Reply Later",
    svg: "/reactionImages/nounproject/clock.svg",
    searchTerms: ["clock", "later"],
    description: "I intend to reply to this in the future",
  },
  {
    name: "notPlanningToRespond",
    label: "Not Planning to Respond",
    svg: "/reactionImages/nounproject/door.svg",
    searchTerms: ["door", "respond", "planning"],
    description: "I'm not planning to respond further",
  },
  {
    name: "dontUnderstand",
    label: "I Don't Understand",
    svg: "/reactionImages/nounproject/confused.svg",
    searchTerms: ["confused", "understand"],
    description: "I didn't understand this",
  },
  {
    name: "nonSequitur",
    label: "Non Sequitur",
    svg: "/reactionImages/nounproject/nonsequitur.svg",
    searchTerms: ["sequitur", "jump"],
    description: "This contains a non-sequitur",
  },
  {
    name: "shakyPremise",
    label: "Shaky Premise",
    svg: "/reactionImages/nounproject/shakypremise.svg",
    searchTerms: ["premise", "tower"],
    description: "This rests on shaky or false premises",
  },
  {
    name: "tooManyAssumptions",
    label: "Too Many Assumptions",
    svg: "/reactionImages/nounproject/houseofcards.svg",
    searchTerms: ["cards", "house", "assumptions"],
    description: "This makes too many assumptions",
  },
  {
    name: "misrepresentation",
    label: "Misrepresentation",
    svg: "/reactionImages/misrepresentation.png",
    description: "This misrepresents something important",
  },
  {
    name: "continue",
    label: "Continue",
    svg: "/reactionImages/nounproject/continue.svg",
    description: "I Wish This Thread Would Continue",
  },
  {
    name: "timecost",
    label: "Not worth the time",
    description: "It's probably not worth the time to resolve this",
    searchTerms: ["time cost"],
    svg: "/reactionImages/nounproject/timecost.svg",
  },
];
export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r=>r.name);

export const defaultFilter = {
  padding: 0,
  opacity: 0.4,
  saturate: 0.6,
}
