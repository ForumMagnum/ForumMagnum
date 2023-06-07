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
  description: string | ((contentType: string) => string),
  deprecated?: boolean // if true, users are discouraged from continuing to use this react
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

//There are spaces between each person to help reason about how they'll be displayed in the two columns, two on each row.
export const namesAttachedReactions: NamesAttachedReactionType[] = [
  {
    name: "agree",
    label: "Agreed",
    searchTerms: ["check", "correct"],
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
    name: "important",
    label: "Important",
    searchTerms: ["!"],
    svg: "/reactionImages/nounproject/exclamation.svg",
    description: "",
  },
  {
    name: "insightful",
    label: "Insightful",
    searchTerms: ["lightbulb"],
    svg: "/reactionImages/nounproject/lightbulb.svg",
    description: (contentType) => `This ${contentType} adds insight to the conversation`,
  },
  
  {
    name: "changemind",
    label: "Changed My Mind",
    searchTerms: ["delta"],
    svg: "/reactionImages/nounproject/delta.svg",
    filter: {opacity: 0.6},
    description: (contentType) => `This ${contentType} changed my mind`,
  },
  {
    name: "thanks",
    label: "Thanks!",
    searchTerms: ["ty", "thanks"],
    svg: "/reactionImages/nounproject/thankyou.svg",
    description: "",
  },
  
  {
    name: "support",
    label: "Support",
    searchTerms: ["pillar"],
    svg: "/reactionImages/nounproject/pillar.svg",
    description: `I am expressing supportiveness towards this`,
  },
  {
    name: "verified",
    label: "Confirmed",
    searchTerms: ["check", "correct", "confirm"],
    svg: "/reactionImages/nounproject/verified.svg",
    description: "I checked this. Or have other empirical data that confirms this",
  },
  
  {
    name: "surprise",
    label: "Surprise",
    svg: "/reactionImages/nounproject/surprise.svg",
    filter: {opacity: 0.6},
    description: "I am surprised",
    deprecated:false
  },
  {
    name: "roll",
    label: "Skeptical",
    searchTerms: ["examples", "shapes", "skeptical", "eyebrow", "dice", "roll", "disbelieve"],
    svg: "/reactionImages/nounproject/skeptical.svg",
    filter: {opacity: 0.6},
    description: "I find your claims quite surprising!",
    deprecated:false
  },
  
  {
    name: "yeswhatimean",
    label: "Yes, that's my position",
    searchTerms: ["hand", "yes", "correct"],
    svg: "/reactionImages/nounproject/clickingpointinghand.svg",
    filter: {opacity: 0.6},
    description: (contentType) => `Based on this, I think you've understood my/other person's position`,
  },
  {
    name: "miss",
    label: "Not what was meant",
    svg: "/reactionImages/nounproject/inaccurate.svg",
    description: "I think this misses what I (or the other person) actually believes and was trying to say or explain"
  },
  
  {
    name: "eleborate",
    label: "Please elaborate",
    searchTerms: ["questions"],
    svg: "/reactionImages/nounproject/ellipses.svg",
    filter: {opacity: 0.4},
    description: "",
  },
  {
    name: "offtopic",
    label: "Off Topic or Tangential",
    searchTerms: ["questions"],
    svg: "/reactionImages/nounproject/mapandpin.svg",
    filter: {opacity: 1},
    description: "This doesn't seem that relevant to what's being discussed.",
  },
  
  {
    name: "shakyPremise",
    label: "Shaky Premise",
    svg: "/reactionImages/nounproject/shakypremise.svg",
    searchTerms: ["premise", "tower"],
    description: "This rests on shaky or false premises",
  },
  {
    name: "locallyInvalid",
    label: "Locally Invalid",
    svg: "/reactionImages/nounproject/negateddoubleturnstile.svg",
    searchTerms: ["locally", "invalid", "unsound"],
    description: "This reasoning is not sound and does not preserve truth values.",
  },
  
  {
    name: "coveredAlready",
    label: "I already addressed this",
    searchTerms: ["check", "already", "covered", "addressed"],
    svg: "/reactionImages/nounproject/checkedbox.svg",
    filter: {opacity: 0.6},
    description: "I covered this in my post and/or comments.",
    deprecated:false,
  },
  {
    name: "unnecessarily-combative",
    label: "Unnecessarily Combative",
    searchTerms: ["swords"],
    svg: "/reactionImages/nounproject/swords.svg",
    description: "This seems more combative than it needs to be.",
    filter: {padding: 2},
  },
  
 //Here begins the list of deprecated reacts 
  {
    name: "muddled",
    label: "Muddled",
    searchTerms: ["splat", "confused"],
    svg: "/reactionImages/nounproject/splat.svg",
    description: "I had trouble with the pedagogical clarity of this",
    deprecated:false
  },
  {
    name: "strawman",
    label: "Not responding to actual position",
    searchTerms: ["examples", "scarecrow", "strawman"],
    svg: "/reactionImages/nounproject/scarecrow.svg",
    description: "I think this misrepresents the thing that it argues against",
    deprecated:false,
  },
  {
    name: "dontUnderstand",
    label: "I don't understand",
    svg: "/reactionImages/nounproject/confused.svg",
    searchTerms: ["confused", "understand"],
    description: "I didn't understand this",
    deprecated:false
  },
  {
    name: "locallyValid",
    label: "Locally Valid",
    searchTerms: ["locally", "valid", "sound"],
    svg: "/reactionImages/nounproject/doubleturnstile.svg",
    description: "I think the reasoning is valid, independent of the premises or conclusion.",
    deprecated:false
  },
  {
    name: "notPlanningToRespond",
    label: "Not Planning to Respond",
    svg: "/reactionImages/nounproject/door.svg",
    searchTerms: ["door", "respond", "planning"],
    description: "I'm not planning to respond further",
    deprecated:false
  },
  {
    name: "seen",
    label: "I Saw This",
    searchTerms: ["eyes"],
    svg: "/reactionImages/nounproject/eyes.svg",
    filter: {opacity: 0.8},
    description: (contentType) => `I'm registering that I saw this ${contentType}`,
    deprecated:false
  },
  {
    name: "empathy",
    label: "Empathy",
    searchTerms: ["heart"],
    svg: "/reactionImages/nounproject/heart.svg",
    description: "I feel empathy towards this",
    deprecated:false
  },
  {
    name: "notacrux",
    label: "Not a crux",
    searchTerms: ["identity", "matrix", "crux", "not"],
    svg: "/reactionImages/nounproject/crux.svg",
    filter: {opacity: 1},
    description: (contentType) => `This ${contentType} doesn't get at something that's a crux for my beliefs`,
    deprecated:false,
  },
  {
    name: "prediction",
    label: "What's your prediction?",
    searchTerms: ["telescope", "prediction", "anticipation"],
    svg: "/reactionImages/nounproject/telescope.svg",
    filter: {opacity: 0.4},
    description: "What do you concretely expect to observe given your beliefs?",
    deprecated:true
  },
  {
    name: "examples",
    label: "Examples, please",
    searchTerms: ["examples", "shapes"],
    svg: "/reactionImages/nounproject/shapes.svg",
    filter: {opacity: 0.6},
    description: "Can you give some examples of this?",
    deprecated:false
  },
  {
    name: "additionalQuestions",
    label: "Additional Questions",
    searchTerms: ["elephant", "questions"],
    svg: "/reactionImages/nounproject/elephant.svg",
    filter: {opacity: 0.6},
    description: "I now have additional questions.",
    deprecated:false
  },
  {
    name: "taboo",
    label: "Taboo your words",
    searchTerms: ["taboo", "shush", "quiet"],
    svg: "/reactionImages/nounproject/shush.svg",
    filter: {opacity: 0.6},
    description: "Can you say this without using those keyterms?",
    deprecated:false
  },
  {
    name: "discussedAlready",
    label: "This has already been discussed",
    searchTerms: ["clock", "history", "prior"],
    svg: "/reactionImages/nounproject/history2.svg",
    filter: {opacity: 0.6},
    description: "Use Search, Concepts page, or ask in Open Thread if no one elaborates here.",
    deprecated:false
  },
  {
    name: "unnecessarily-harsh",
    label: "Unnecessarily Harsh",
    searchTerms: ["cactus", "prickly"],
    svg: "/reactionImages/nounproject/cactus.svg",
    description: "This is harsh and didn't seem like it had to be.",
    deprecated:true
  },
  {
    name: "handshake",
    label: "I Agree to This",
    searchTerms: ["agreement"],
    filter: {opacity: 0.9},
    svg: "/reactionImages/nounproject/handshake.svg",
    description: "React to signal agreement (in the negotiation-y sense of the word)",
    deprecated:true
  },
  {
    name: "scout",
    label: "Scout Mindset",
    searchTerms: ["binoculars"],
    svg: "/reactionImages/nounproject/binoculars.svg",
    description: (contentType) => `This ${contentType} exhibits Scout Mindset.`,
    deprecated:false
  },
  {
    name: "scholarship",
    label: "Virtue of Scholarship",
    searchTerms: ["cited"],
    svg: "/reactionImages/nounproject/scholarship.svg",
    description: "This exhibits the Virtue of Scholarship",
    deprecated:false
  },
  {
    name: "concrete",
    label: "Concrete",
    searchTerms: ["bricks", "examples"],
    svg: "/reactionImages/nounproject/concrete.svg",
    description: "This makes things more concrete by bringing in specifics or examples.",
    deprecated:true
  },
  {
    name: "key",
    label: "Key Insight",
    searchTerms: ["insight"],
    svg: "/reactionImages/nounproject/key.svg",
    description: "This is a key insight",
    deprecated:true
  },
  {
    name: "shrug",
    label: "Shrug",
    svg: "/reactionImages/nounproject/shrug.svg",
    description: "I am indifferent to this",
    deprecated:false
  },
  {
    name: "scales",
    label: "Seems Borderline",
    searchTerms: ["balanced"],
    svg: "/reactionImages/nounproject/scales.svg",
    description: "I think this could go either way",
    deprecated:false
  },
  {
    name: "thinking",
    label: "Thinking",
    svg: "/reactionImages/nounproject/thinking.svg",
    description: "Food for thought",
    deprecated:false
  },
  {
    name: "obtuse",
    label: "Obtuse",
    svg: "/reactionImages/nounproject/obtuse.svg",
    description: "This comment is failing to understand something that didn't seem hard to understand",
    deprecated:true
  },
  {
    name: "nonSequitur",
    label: "Non Sequitur",
    svg: "/reactionImages/nounproject/nonsequitur.svg",
    searchTerms: ["sequitur", "jump"],
    description: "This contains a non-sequitur",
    deprecated:false
  },
  {
    name: "tooManyAssumptions",
    label: "Too Many Assumptions",
    svg: "/reactionImages/nounproject/houseofcards.svg",
    searchTerms: ["cards", "house", "assumptions"],
    filter: {opacity: 0.8},
    description: "This makes too many assumptions",
    deprecated:false
  },
  {
    name: "hitsTheMark",
    label: "Hits the Mark",
    searchTerms: ["bullseye", "accurate"],
    svg: "/reactionImages/nounproject/bullseye.svg",
    description: "This hits the mark",
    deprecated:false
  },
  {
    name: "timecost",
    label: "Not worth getting into",
    description: "It's probably not worth the time to resolve this",
    searchTerms: ["time cost"],
    svg: "/reactionImages/nounproject/timequestion.svg",
    deprecated:false
  },
  {
    name: "excitement",
    label: "Exciting",
    searchTerms: ["partypopper", "!"],
    svg: "/reactionImages/nounproject/partypopper.svg",
    description: "This is exciting!",
    deprecated:false
  },
  {
    name: "paperclip",
    label: "Paperclip",
    searchTerms: ["paperclip"],
    svg: "/reactionImages/nounproject/paperclip.svg",
    description: "",
    deprecated:false
  },
  {
    name: "clear",
    label: "Clear",
    searchTerms: ["clarity", "gem", "diamond"],
    svg: "/reactionImages/nounproject/clarity.svg",
    description: (contentType) => `This ${contentType} clarifies things.`,
    deprecated:false
  },
];


const missingReact = {
  name: "missingReact",
  label: "Missing React",
  searchTerms: ["404", "missing", "react"],
  svg: "/reactionImages/nounproject/notfound404.svg",
  filter: {opacity: 0.6},
  description: "This react was has been removed from the palette",
  deprecated:false
}

export const namesAttachedReactionsByName = keyBy(namesAttachedReactions, r => r.name);

export const getNamesAttachedReactionsByName = (reactName: string): NamesAttachedReactionType => {
  const foundReact = namesAttachedReactions.find(r => r.name === reactName)
  return (!!foundReact) ? foundReact : {...missingReact, label: `deleted react: "${reactName}"`}
}

export const defaultFilter = {
  padding: 0,
  opacity: 0.4,
  saturate: 0.6,
}
