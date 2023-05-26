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
   * Human-readable label string describing the reaction. Should be in title
   * case, and be short (ideally one word).
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
    label: "Changed My Mind",
    searchTerms: ["delta"],
    svg: "/reactionImages/nounproject/delta.svg",
    filter: { opacity: 0.6 },
    description: (contentType) => `This ${contentType} changed my mind`,
  },
  {
    name: "didntchangemind",
    label: "Didn't Change My Mind",
    searchTerms: ["identity", "matrix"],
    svg: "/reactionImages/nounproject/delta.svg", //need new image
    filter: { opacity: 0.6 },
    description: (contentType) => `This ${contentType} failed to change my mind or persuade me`,
  },
{
  name: "agree",
    label: "Agreed",
  searchTerms: ["check","correct"],
  svg: "/reactionImages/nounproject/check.svg",
  description: "I agree with this.",
},
{
  name: "disagree",
    label: "Disagree",
  svg: "/reactionImages/nounproject/x.svg",
  searchTerms: ["x"],
  description: "I disagree with this",
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
  name: "additionalQuestions",
    label: "Say more",
  searchTerms: ["elephant","questions"],
  svg: "/reactionImages/nounproject/elephant.svg",
  filter: { opacity: 0.6 },
  description: "I now have additional questions. Please elaborate",
},
{
  name: "dontUnderstand",
    label: "I Don't Understand",
  svg: "/reactionImages/nounproject/confused.svg",
  searchTerms: ["confused", "understand"],
  description: "I didn't understand this",
},
{
  name: "examples",
    label: "Request examples",
  searchTerms: ["examples", "shapes"],
  svg: "/reactionImages/nounproject/confused.svg",
  filter: { opacity: 0.6 },
  description: "Can you give some examples of this?",
},
{
  name: "taboo",
    label: "Taboo your words",
  searchTerms: ["examples", "shapes"],
  svg: "/reactionImages/nounproject/confused.svg",
  filter: { opacity: 0.6 },
  description: "Can you say this without using those keyterms?"
},
{
  name: "strawman",
    label: "Not responding to actual position",
  searchTerms: ["examples", "scarecrow", "strawman"],
  svg: "/reactionImages/nounproject/scarecrow.svg",
  description: "I think this misrepresents the thing that it argues against",
},
{
  name: "roll",
    label: "Roll to disbelieve",
  searchTerms: ["examples", "shapes", "skeptical", "eyebrow", "dice"],
  svg: "/reactionImages/nounproject/skeptical.svg",
  filter: { opacity: 0.6 },
  description: "I find your claims quite surprising!"
},
{
  name: "verified",
    label: "Verified",
  searchTerms: ["check","correct"],
  svg: "/reactionImages/nounproject/verified.svg",
  description: "I checked this. Or have other empirical data that confirms this",
},
{
  name: "seen",
    label: "I Saw This",
  searchTerms: ["eyes"],
  svg: "/reactionImages/nounproject/eyes.svg",
  filter: { opacity: 0.8 },
  description: (contentType) => `I'm registering that I saw this ${contentType}`,
},
{
  name: "replyLater",
    label: "I'll Reply Later",
  svg: "/reactionImages/nounproject/clock.svg",
  searchTerms: ["clock", "later"],
  description: "I intend to reply to this in the future",
},
{
  name: "handshake",
    label: "I Agree to This",
  searchTerms: ["agreement"],
  filter: { opacity: 0.9 },
  svg: "/reactionImages/nounproject/handshake.svg",
    description: "React to signal agreement (in the negotiation-y sense of the word)",
},
{
  name: "support",
    label: "Support",
  searchTerms: ["pillar"],
  svg: "/reactionImages/nounproject/pillar.svg",
  description: `I am expressing supportiveness towards this`,
},
{
  name: "empathy",
    label: "Empathy",
  searchTerms: ["heart"],
  svg: "/reactionImages/nounproject/heart.svg",
  description: "I feel empathy towards this",
},
{
  name: "laugh",
    label: "Laugh",
  svg: "/reactionImages/nounproject/laugh.svg",
  description: "This is humorous",
},

{
  name: "unnecessarily-harsh",
    label: "Unnecessarily Harsh",
  searchTerms: ["cactus","prickly"],
  svg: "/reactionImages/nounproject/cactus.svg",
  description: "This is harsh and didn't seem like it had to be.",
},
{
  name: "unnecessarily-combative",
    label: "Unnecessarily Combative",
  searchTerms: ["swords"],
  svg: "/reactionImages/nounproject/swords.svg",
  description: "This seems more combative than it needs to be.",
  filter: { padding: 2 },
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
    description: "This makes things more concrete by bringing in specifics or examples.",
  },
  {
    name: "key",
    label: "Key Insight",
    searchTerms: ["insight"],
    svg: "/reactionImages/nounproject/key.svg",
    description: "This is a key insight",
  },
  {
    name: "muddled",
    label: "Muddled",
    searchTerms: ["splat","confused"],
    svg: "/reactionImages/nounproject/splat.svg",
    description: "I had trouble with the pedagogical clarity of this",
  },
  {
    name: "surprise",
    label: "Surprise",
    svg: "/reactionImages/nounproject/surprise.svg",
    filter: { opacity: 0.6 },
    description: "I am surprised",
  },
  {
    name: "shrug",
    label: "Shrug",
    svg: "/reactionImages/nounproject/shrug.svg",
    description: "I am indifferent to this",
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
    name: "notPlanningToRespond",
    label: "Not Planning to Respond",
    svg: "/reactionImages/nounproject/door.svg",
    searchTerms: ["door", "respond", "planning"],
    description: "I'm not planning to respond further",
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
    filter: {opacity: 0.8},
    description: "This makes too many assumptions",
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
    label: "Missed the Point",
    svg: "/reactionImages/nounproject/inaccurate.svg",
    description: "This seemed to focus in the wrong places, not on the core of the issue under discussion.",
  },
  {
    name: "timecost",
    label: "Not worth getting into",
    description: "It's probably not worth the time to resolve this",
    searchTerms: ["time cost"],
    svg: "/reactionImages/nounproject/timequestion.svg",
  },
];
export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r=>r.name);

export const defaultFilter = {
  padding: 0,
  opacity: 0.4,
  saturate: 0.6,
}
