import React from 'react';
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
    scale?: number,
    translateX?: number,
    translateY?: number,
  },
  /**
   * A description of this reaction, ideally about a sentence long. Optionally,
   * expressed as a function that takes a content-type word, like "comment" or
   * "post", so that you can make the description something like
   * "This comment is <x>" and have it come out correct if it's a post/etc
   * instead of a comment. (We don't yet support reactions on posts but we might
   * in the future.
   */
  description: string | ((contentType: string) => string) | React.ReactNode,
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
    searchTerms: ["check", "correct", "confirm", "upvote", "+1"],
    svg: "/reactionImages/nounproject/check.svg",
    description: "",
  },
  {
    name: "disagree",
    label: "Disagree",
    svg: "/reactionImages/nounproject/x.svg",
    searchTerms: ["x", "downvote", "-1"],
    description: "",
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
    svg: "/reactionImages/nounproject/noun-triangle-305128.svg",
    filter: {opacity: 0.4, scale: 1.4, translateY: 1},
    description: <div>
      <p>I updated my beliefs based on this.</p>
      <p><em>(In math, the triangle 'delta' symbol means 'change')</em></p>
    </div>
  },
  {
    name: "thanks",
    label: "Thanks",
    searchTerms: ["ty", "thanks", "gratitude"],
    svg: "/reactionImages/nounproject/thankyou.svg",
    filter: { scale: .9, opacity:.5},
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
    label: "I checked, it's true",
    searchTerms: ["check", "correct", "confirm"],
    svg: "/reactionImages/nounproject/verified.svg",
    description: "I looked up sources, did empiricism, checked the equations, etc.",
    deprecated:true
  },
  {
    name: "verifiedFalse",
    label: "I checked, it's False",
    searchTerms: ["check", "correct", "confirm"],
    svg: "/reactionImages/nounproject/noun-cross-2014310.svg",
    description: "I looked up sources, did empiricism, checked the equations, etc.",
    deprecated:true
  },
  {
    name: "betTrue",
    label: "I'd bet this is true",
    searchTerms: ["bet", "betting", "true"],
    svg: "/reactionImages/nounproject/noun-dice-7011847.svg",
    description: "I'm willing to operationalize this, find an adjudicator, and bet this claim is true",
  },
  {
    name: "betFalse",
    label: "I'd bet this is false",
    searchTerms: ["bet", "betting", "false"],
    svg: "/reactionImages/nounproject/noun-dice-7119510.svg",
    description: "I'm willing to operationalize this, find an adjudicator, and bet this claim is false",
  },
  
  {
    name: "surprise",
    label: "Surprise",
    svg: "/reactionImages/nounproject/surprise.svg",
    filter: {opacity: 0.8},
    description: "I did not expect that!",
    deprecated:false
  },
  {
    name: "roll",
    label: "Skeptical",
    searchTerms: ["examples", "shapes", "skeptical", "eyebrow", "dice", "roll", "disbelieve"],
    svg: "/reactionImages/nounproject/skeptical.svg",
    filter: {opacity: 0.55, scale: 1.1},
    description: "I'm not sure I believe this.",
    deprecated:false
  },
  
  {
    name: "yeswhatimean",
    label: "Yes, that's my position",
    searchTerms: ["hand", "yes", "correct"],
    svg: "/reactionImages/nounproject/clickingpointinghand.svg",
    filter: {opacity: 0.5},
    description: "Based on this, I think you've understood my/other person's position",
  },
  {
    name: "miss",
    label: "Missed the point",
    svg: "/reactionImages/nounproject/inaccurate.svg",
    description: "I think this misses what I (or the other person) actually believes and was trying to say or explain"
  },
  
  {
    name: "elaborate",
    label: "Elaborate?",
    searchTerms: ["questions"],
    svg: "/reactionImages/nounproject/noun-chat-1459491.svg",
    filter: {opacity: 0.4},
    description: "",
  },
  {
    name: "offtopic",
    label: "Seems Offtopic?",
    searchTerms: ["questions"],
    svg: "/reactionImages/nounproject/mapandpin.svg",
    filter: {opacity: 1, scale: .9},
    description: "I don't see how this is relevant to what's being discussed.",
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
    description: "This step is incorrect; these premises do not imply this conclusion.",
  },
  
  {
    name: "coveredAlready",
    label: "I already addressed this",
    searchTerms: ["check", "already", "covered", "addressed", "addressed"],
    svg: "/reactionImages/nounproject/noun-mail-checkmark-5316519.svg",
    filter: {opacity: 0.6, scale: 1.2, translateY: 2},
    description: "I covered this in my post and/or comments.",
    deprecated:false,
  },
  {
    name: "unnecessarily-combative",
    label: "Too Combative?",
    searchTerms: ["swords", "combative", "fighting", "battle", "war", "tribalism"],
    svg: "/reactionImages/nounproject/swords.svg",
    description: "This seems more combative than it needs to be to communicate its point.",
    filter: {padding: 2, scale:1},
  },
  
 //Here begins the list of deprecated reacts 
  {
    name: "muddled",
    label: "Difficult to Parse",
    searchTerms: ["splat", "confused", "muddled"],
    svg: "/reactionImages/nounproject/noun-fog-1028590.svg",
    description: "I had trouble reading this.",
    filter: {opacity:.7, scale:1.2},
    deprecated:false
  },
  {
    name: "strawman",
    label: "Misunderstands position?",
    searchTerms: ["examples", "scarecrow", "strawman", "misunderstanding", "position", "misrepresent"],
    svg: "/reactionImages/nounproject/noun-misunderstanding-4936548-updated.svg",
    description: "This seems to misunderstand the thing that it argues against",
    deprecated:false,
    filter: {opacity: 0.5, scale: 1.3, translateY: 1, translateX:1}
  },
  {
    name: "dontUnderstand",
    label: "I don't understand",
    svg: "/reactionImages/nounproject/noun-question-5771604.svg",
    searchTerms: ["confused", "understand"],
    description: "",
    deprecated:false,
    filter: {
      translateY: 2,
      scale: .9
    }
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
    description: "...and thought it'd be useful to let people know.",
    deprecated:false
  },
  {
    name: "empathy",
    label: "Empathy",
    searchTerms: ["heart"],
    svg: "/reactionImages/nounproject/noun-heart-1212629.svg",
    description: "",
    filter: {opacity: 0.6, translateY: 1, scale: 1.05},
    deprecated:true
  },
  {
    name: "heart",
    label: "Heart",
    searchTerms: ["empathy"],
    svg: "/reactionImages/nounproject/noun-heart-1212629.svg",
    description: "",
    filter: {opacity: 0.6, translateY: 1, scale: 1.05},
    deprecated:false
  },
  {
    name: "crux",
    label: "That's a crux",
    searchTerms: ["identity", "matrix", "crux", "not"],
    svg: "/reactionImages/nounproject/branchingpath.svg",
    filter: {opacity: 0.6},
    description: "My other beliefs would be different if I had different beliefs about this",
    deprecated:false,
  },
  {
    name: "notacrux",
    label: "Not a crux",
    searchTerms: ["identity", "matrix", "crux", "not"],
    svg: "/reactionImages/nounproject/nonbranchingpath2.svg",
    filter: {opacity: 0.6},
    description: "My other beliefs would not change if I had different beliefs about this",
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
    label: "Examples?",
    searchTerms: ["examples", "shapes"],
    svg: "/reactionImages/nounproject/shapes.svg",
    filter: {opacity: 0.6},
    description: "I'd be interested in seeing concrete examples of this",
    deprecated:false
  },
  {
    name: "additionalQuestions",
    label: "Additional Questions",
    searchTerms: ["elephant", "questions"],
    svg: "/reactionImages/nounproject/elephant.svg",
    filter: {opacity: 0.8},
    description: "I now have additional questions.",
    deprecated:false
  },
  {
    name: "taboo",
    label: "Taboo those words?",
    searchTerms: ["taboo", "shush", "quiet"],
    svg: "/reactionImages/nounproject/noun-cancel-chat-5735669.svg",
    filter: {opacity: 0.6, translateY: 1},
    description: <div>
      <p>Could you rephrase this using different words, without using the same keyterms?</p>
    </div>,
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
    description: "Good job focusing on figuring out what's true, rather than fighting for a side",
    deprecated:false
  },
  {
    name: "scholarship",
    label: "Nice Scholarship!",
    searchTerms: ["cited"],
    svg: "/reactionImages/nounproject/scholarship.svg",
    description: "Good job looking into existing literature and citing sources",
    deprecated:false
  },
  {
    name: "concrete",
    label: "Concrete",
    searchTerms: ["bricks", "examples"],
    svg: "/reactionImages/nounproject/concrete.svg",
    description: "This makes things more concrete by bringing in specifics or examples.",
    deprecated:false,
    filter: {scale: 1.1}
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
    label: "Unsure",
    svg: "/reactionImages/nounproject/shrug.svg",
    description: "I don't know what to think of this",
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
    svg: "/reactionImages/nounproject/thinking-nice-eyebrows.svg",
    description: "Food for thought",
    deprecated:false,
    filter: {opacity:1, scale:1.4, translateY: 2.6}
  },
  {
    name: "obtuse",
    label: "Obtuse",
    svg: "/reactionImages/nounproject/obtuse.svg",
    description: "This conversation is suffering from an acute lack of understanding. Your interpretation of the other person's position is not right. Try coming at this conversation from a different angle.",
    // deprecated:true
  },
  {
    name: "nonSequitur",
    label: "Non Sequitur",
    svg: "/reactionImages/nounproject/nonsequitur.svg",
    searchTerms: ["sequitur", "jump"],
    description: "This doesn't follow from the previous claim",
    deprecated:true
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
    label: "Not worth getting into?",
    description: "I'm guessing it's probably not worth the time to resolve this?",
    searchTerms: ["time cost"],
    svg: "/reactionImages/nounproject/timequestion.svg",
    filter: {scale: .8},
    deprecated:false
  },
  {
    name: "excitement",
    label: "Exciting",
    searchTerms: ["partypopper", "!"],
    svg: "/reactionImages/nounproject/partypopper.svg",
    description: "This is exciting!",
    filter: {translateY:-1},
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
    label: "Clearly Written",
    searchTerms: ["clarity", "gem", "diamond"],
    svg: "/reactionImages/nounproject/noun-clear-sky-1958882.svg",
    filter: {opacity:.7, scale:1.2},
    description: "I had an easy time understanding this"
    // deprecated:true
  },
  {
    name: "typo",
    label: "Typo",
    searchTerms: ["typo", "error", "mistake", "mispelling", "spelling"],
    svg: "/reactionImages/nounproject/type-text.svg",
    description: <div>
      <p>This contains a typo, or minor editing error</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    filter: {scale: .9, translateY: 2},
  }, 
  {
    name: "laugh",
    label: "Haha!",
    searchTerms: ["laugh", "haha", "funny", "lol"],
    svg: "/reactionImages/nounproject/noun-laughing-761845.svg",
    description: "",
    filter: {opacity: .9, scale: 1.4, translateY: 2}
  },
  { 
    name: "disappointed",
    label: "Disappointed",
    searchTerms: ["disappointed", "sad", "frown"],
    svg: "/reactionImages/nounproject/noun-sad-5760577.svg",
    filter: {opacity: .9, translateY: 2},
    description: ""
  },
  {
    name: "sad",
    label: "Sad",
    searchTerms: ["sad", "frown"],
    svg: "/reactionImages/nounproject/noun-sad-1152961.svg",
    filter: {opacity: .9, translateY: 2},
    description: ""
  },
  {
    name: "confused",
    label: "I notice I'm confused",
    searchTerms: ["confused", "question", "questionmark", "bewildered"],
    svg: "/reactionImages/confused2.svg",
    description: "I don't have a clear explanation of what's going on here",
    filter: {opacity: .9, translateY: -2.5, translateX: 0, scale: 1},
  },
  {
    name: "smile",
    label: "Smile",
    searchTerms: ["smile", "happy", "grin"],
    svg: "/reactionImages/nounproject/noun-smile-925549.svg",
    filter: {opacity: .5, translateY: 2, scale: 1.4},
    description: "This makes me happy. :)"
  },  
  {
    name: "facilitation",
    label: "Good Facilitation",
    searchTerms: ["understanding", "helpful", "facilitation", "charitable"],
    svg: "/reactionImages/nounproject/noun-dialog-2172.svg",
    description: "This seemed to help people understand each other",
    filter: { translateY: 2, scale: 1.3},
  },
  {
    name: "soldier",
    label: "Soldier Mindset",
    searchTerms: ['politics', 'soldier', 'war', 'battle', 'fight', 'fighting', 'argumentative', 'tribalism', 'downvote'],
    description: "This seems to be trying to fight for a side rather than figure out what's true",
    svg: "/reactionImages/nounproject/noun-soldier-5069240.svg",
    filter: { opacity: .7, translateY: 1, scale: 1.2},
  },
  {
    name: "thumbs-up",
    label: "Thumbs Up",
    searchTerms: ['seen', 'like', '+1', 'upvote'],
    description: "I saw this, and feel vaguely good about it",
    svg: "/reactionImages/nounproject/noun-thumbs-up-1686284.svg",
    filter: { opacity: .5, translateY: 2},
  },
  {
    name: "thumbs-down",
    label: "Thumbs Down",
    searchTerms: ['seen', 'dislike', 'downvote', '-1'],
    description: "I saw this, and vaguely dislike it",
    svg: "/reactionImages/nounproject/noun-thumbs-down-1686285.svg",
    filter: { opacity: .5, translateY: 3},
  },
  {
    name: "1percent",
    label: "Less than 1% likely",
    description: <div>
      <p>I put 1% or less likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/1percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "10percent",
    label: "10% likely",
    description: <div>
      <p>I put about 10% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/10percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "25percent",
    label: "~25% likely",
    description: <div>
      <p>I put about 25% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/25percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: 1.25, translateX: .5}
  },
  {
    name: "40percent",
    label: "~40% likely",
    description: <div>
      <p>I put about 40% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/40percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "50percent",
    label: "~50% likely",
    description: <div>
      <p>I put about 50% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/50percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "60percent",
    label: "~60% likely",
    description: <div>
      <p>I put about 60% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/60percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "75percent",
    label: "~75% likely",
    description: <div>
      <p>I put about 75% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/75percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "90percent",
    label: "~90% likely",
    description: <div>
      <p>I put about 90% likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/90percent.svg",
    filter: {scale:1.4, opacity: .5, translateY: .75, translateX: .5}
  },
  {
    name: "99percent",
    label: "99+% likely",
    description: <div>
      <p>I put 99% (or more) likelihood on this claim</p>
      <p><em>Note: you can inline react by selecting text</em></p>
    </div>,
    svg: "/reactionImages/99percent.svg",
    filter: {scale:1.25, opacity: .5, translateY: .75, translateX: 1}
  },
  {
    name: "why",
    label: "Why? / Citation?",
    searchTerms: ["why", "citation", "source", "needed", "question"],
    svg: "/reactionImages/nounproject/noun-brackets-1942334-updated.svg",
    filter: {scale: 1.2},
    description: "Why do you believe that? Or, what's your source for that?",
  }
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
  translateX: 0,
  translateY: 0,
  scale: 1
}
