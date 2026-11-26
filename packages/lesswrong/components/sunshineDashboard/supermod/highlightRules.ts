import maxBy from "lodash/maxBy";
import sumBy from "lodash/sumBy";
import { FLAGGED_FOR_N_DMS, AUTO_BLOCKED_FROM_SENDING_DMS, SENT_MODERATOR_MESSAGE } from "@/lib/collections/moderatorActions/constants";
import { areAllContentPermissionsDisabled, isPost, type ContentItem } from "./helpers";
import { getProseLanguageCounts } from "./contentLanguage";
import { getLinkHrefs, isOffsiteLink } from "./contentLinks";
import {
  getBlankLineRatioFromHtml,
  getBoldLetterRatioFromHtml,
  getFirstParagraphLength,
  getFormattingParagraphPlaintextsFromHtml,
  getHtml,
  getLongestFormattingSentenceLengthFromHtml,
  getPlaintext,
  getRepeatedPunctuationRunCountFromHtml,
  getTitleAndText,
} from "./contentTextHelpers";

export interface HighlightContext {
  user: SunshineUsersList;
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
}

export type HighlightableModeratorAction = 'approve' | 'snoozeCustom' | 'approveCurrentOnly' | 'remove' | 'purge' | 'disablePermissions' | 'disableMessages';

type ModeratorActionHighlightColor = 'green' | 'gold' | 'black' | 'red';

export type ModeratorActionHighlightStyle = ModeratorActionHighlightColor | 'subtleOutline';

export type HighlightedModeratorActions = Map<HighlightableModeratorAction, ModeratorActionHighlightStyle>;

const HIGH_PANGRAM_SCORE = 0.2;
const MAX_PARAGRAPH_LENGTH = 1500;
const DUPLICATE_MIN_TITLE_LENGTH = 5;
const DUPLICATE_MIN_BODY_LENGTH = 40;

const AI_TERMS = String.raw`AI|AGI|ASI|LLMs?|GPT|ChatGPT|language models?|machine learning|deep learning|neural networks?|transformers?|mechanistic interpretability|model interpretability`;
const MENTIONS_AI = new RegExp(String.raw`\b(${AI_TERMS})\b`, 'i');
const MENTIONS_AI_OR_AGENTS = new RegExp(String.raw`\b(${AI_TERMS}|agent)\b`, 'i');
const MENTIONS_RESEARCH = /\b(research|projects?|experiments?|experimental|methodology|architectures?|train(?:ed|ing)?|fine[- ]tun(?:e|ed|ing)|evaluat(?:e|ed|ion)|results?|benchmarks?|datasets?)\b/i;
const ORGANIZATION_NAME = /\b(team|labs?|institute|foundation|research|official|inc|llc|ltd|ventures?|solutions|technologies|capital|group|systems|collective)\b/i;
const POLITICAL_TERMS = /\b(trump|biden|obama|kamala|democrats?|republicans?|left-wing|right-wing|elections?|presidential|congress|senate|immigration|abortion|transgender|woke|israel|gaza|palestine|palestinians?|culture war)\b/gi;
const POLITICAL_PARTY = /\b(?:Democratic Party|Democrats?|Republican Party|Republicans?|GOP|MAGA|Labour Party|Conservative Party|Tories|Tory|Liberal Democrats|Lib Dems|Reform UK|SNP|Liberal Party|NDP|Australian Labor Party|CDU|CSU|SPD|AfD|FDP|Die Linke|National Rally|Front National|La France Insoumise|BJP|Bharatiya Janata|Aam Aadmi|Likud|Fidesz|Law and Justice|United Russia|Chinese Communist Party|CCP|Liberal Democratic Party|Communist Party)\b/;
const COUNTRY = /(?:\b(?:United States|USA|US|America|United Kingdom|UK|Britain|Great Britain|England|Scotland|Wales|Ireland|Canada|Mexico|Brazil|Argentina|Venezuela|Colombia|Chile|Cuba|Haiti|France|Germany|Italy|Spain|Portugal|Netherlands|Belgium|Switzerland|Austria|Sweden|Norway|Denmark|Finland|Poland|Hungary|Czechia|Greece|Romania|Serbia|Croatia|Ukraine|Russia|Belarus|Turkey|Israel|Palestine|Gaza|Lebanon|Syria|Iraq|Iran|Saudi Arabia|Yemen|Egypt|Libya|Sudan|Ethiopia|Somalia|Nigeria|Kenya|South Africa|Rwanda|Morocco|Algeria|Tunisia|Afghanistan|Pakistan|India|Bangladesh|Sri Lanka|Myanmar|Thailand|Vietnam|Cambodia|Indonesia|Malaysia|Singapore|Philippines|China|Taiwan|Hong Kong|Japan|South Korea|North Korea|Korea|Australia|New Zealand)\b|U\.S\.A?\.?|U\.K\.)/;
const LOWERCASE_SENTENCE_START = /(?:^|(?<!\b(?:e\.g|i\.e|etc|vs|cf))[.!?]\s+)[a-z]/;
const TWO_PERIODS_WITHOUT_FOLLOWING_SPACE = /(?:[a-z]\.[A-Z][a-z][\s\S]*?){2}/;
const TWO_LOWERCASE_SENTENCE_STARTS_IN_FOUR_SENTENCES = /^(?=(?:[\s\S]*?[.!?]\s+[A-Za-z]){4})(?:[\s\S]*?[.!?]\s+[a-z]){2}/;
const ROKOS_BASILISK = /\broko'?s?\b|\bbasilisks?\b|\bacausal (extortion|blackmail|trade)\b/i;
const MENTIONS_MODERATION = /\breject(ed|ion)s?\b|\bmoderators?\b|\bmoderation\b|\bmod team\b|\bcensor(ed|ship|ing)?\b/i;
const LLM_CONVERSATION = /\b(conversations?|chats?|transcripts?|dialogues?|sessions?) with (an? |my )?(LLM|AI|ChatGPT|Claude|GPT[-\w]*|Gemini|Grok)\b|\bI (asked|prompted|told) (ChatGPT|Claude|GPT[-\w]*|Gemini|Grok|the (AI|model|LLM))\b/i;
const LLM_MYSTICISM_TERMS = /\b(recursive|recursion|emergent|emergence|resonance|resonant|spirals?|consciousness|sentient|sentience|awakening|glyphs?)\b/gi;
const OBFUSCATED_CONTACT_ADDRESS = /\(\s*at\s*\)|\[\s*at\s*\]|\s+at\s+\S+\s+dot\s+(?:com|org|net|edu)\b|\(\s*dot\s*\)/i;
const NO_INTRO_IN_FIRST_1000_CHARACTERS = /^(?![\s\S]{0,1000}(?:tl;?dr|summary|abstract|epistemic status|overview|in this (?:post|essay|article|piece)|this (?:post|essay|article|piece)|i (?:will |'ll |want to |am going to )?(?:argue|claim|show|propose|explain|explore|describe|examine|outline|summarize)|my (?:thesis|claim|argument|main point)|(?:argue|claim|contend|show) that|the (?:point|purpose|goal|aim) of this))/i;
const GRANDIOSE_TERMS = /\b(?:manifesto|paradigm|framework|civilization|consciousness|humanity|harmony|transcend\w*|awakening|emergence|emergent|resonance|recursive|recursion|spiral\w*|sentien\w*)\b/gi;
const METAPHYSICS_TERMS = /\b(consciousness|qualia|noumen\w*|ontolog\w*|metaphysic\w*|cosmolog\w*|theodicy|souls?|spiritual\w*|the divine|the bible|biblical|god|karma|enlighten\w*|awakening|transcend\w*|sentien\w*|free will|the nature of (?:reality|mind|being|existence)|first principles?)\b/gi;
const PHYSICS_TERMS = /\b(entropy|entropic|thermodynamic\w*|quantum|wave function|relativity|space-?time|frequenc(?:y|ies)|vibration\w*|resonan\w*|dimensions?|dimensional|geometr\w+|field theory|great filter|holograph\w*|fractal\w*|attractor|substrate|topolog\w+|physical laws?)\b/gi;
const LLM_TRANSLATION = /\btranslat\w+\b[^.]{0,80}\b(?:codex|chatgpt|gpt[-\w]*|claude|gemini|grok|llm|deepl|machine translation|ai)\b|\b(?:codex|chatgpt|gpt[-\w]*|claude|gemini|grok|an llm|the llm)\b[^.]{0,80}\btranslat\w+/i;
const FICTION_IN_FIRST_500_CHARACTERS = /^[\s\S]{0,500}?\b(?:short stor(?:y|ies)|piece of fiction|work of fiction|writing (?:some |a bit of )?fiction|bit of fiction|fictional (?:story|account|narrative|scenario)|a poem|poems|poetry|this (?:story|tale|fable|parable)|a (?:tale|fable|parable|vignette)|narrative (?:expression|form))\b/i;
const ATTRIBUTED_DIALOGUE = /["“][^"”]{4,}["”]\s*,?\s*(?:he|she|they|I)\s+(?:said|says|asked|asks|replied|whispered|murmured)\b|,\s*(?:he|she|they)\s+(?:says|said|asked|replied)\b/;

interface ContentDetails {
  content: ContentItem;
  html: string;
  text: string;
  titleAndText: string;
  paragraphs: string[];
}

function describeContent(content: ContentItem): ContentDetails {
  const html = getHtml(content);
  return {
    content,
    html,
    text: getPlaintext(content),
    titleAndText: getTitleAndText(content),
    paragraphs: getFormattingParagraphPlaintextsFromHtml(html),
  };
}

const isUnapproved = (content: ContentItem) => !content.rejected && content.authorIsUnreviewed;

const isApproved = (content: ContentItem) => !content.rejected && !content.authorIsUnreviewed;

const getPangramScore = (content: ContentItem) => content.automatedContentEvaluations?.pangramScore ?? 0;

const averageBaseScore = (contents: ContentItem[]) =>
  contents.length === 0 ? 0 : sumBy(contents, content => content.baseScore ?? 0) / contents.length;

const countDistinctMatches = (text: string, globalRegex: RegExp) =>
  new Set(Array.from(text.matchAll(globalRegex), match => match[0].toLowerCase())).size;

const normalizeForComparison = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

function summarizeUser({ user, posts, comments }: HighlightContext) {
  const contents: ContentItem[] = [...posts, ...comments];
  const unapproved = contents.filter(isUnapproved);
  const baseScores = contents.map(content => content.baseScore ?? 0);
  const moderatorActions = user.moderatorActions ?? [];
  return {
    karma: user.karma,
    contents,
    approvedCount: contents.filter(isApproved).length,
    rejectedCount: contents.filter(content => content.rejected).length,
    mostRecentContentIsRejected: !!maxBy(contents, content => new Date(content.postedAt).getTime())?.rejected,
    minBaseScore: Math.min(...baseScores),
    maxBaseScore: Math.max(...baseScores),
    averagePostKarma: averageBaseScore(posts),
    averageCommentKarma: averageBaseScore(comments),
    unapprovedCount: unapproved.length,
    hasUnapprovedContentBelowLlmThreshold: unapproved.length >= 1 && unapproved.every(content => getPangramScore(content) <= HIGH_PANGRAM_SCORE),
    allUnapprovedContentHasLlmScore: unapproved.every(content => content.automatedContentEvaluations?.pangramScore != null),
    highPangramScoreCount: contents.filter(content => getPangramScore(content) >= HIGH_PANGRAM_SCORE).length,
    activeDmFlagCount: moderatorActions.filter(action => action.active && (action.type === FLAGGED_FOR_N_DMS || action.type === AUTO_BLOCKED_FROM_SENDING_DMS)).length,
    sentModeratorMessageCount: moderatorActions.filter(action => action.type === SENT_MODERATOR_MESSAGE).length,
  };
}

const hasOverlongParagraph = ({ paragraphs }: ContentDetails) =>
  paragraphs.some(paragraph => paragraph.length > MAX_PARAGRAPH_LENGTH);

const hasFormattingProblems = (details: ContentDetails) =>
  LOWERCASE_SENTENCE_START.test(details.text)
  || TWO_PERIODS_WITHOUT_FOLLOWING_SPACE.test(details.text)
  || hasOverlongParagraph(details)
  || (getBoldLetterRatioFromHtml(details.html) ?? 0) >= 0.9
  || (getBlankLineRatioFromHtml(details.html) ?? 0) >= 0.33;

function isWallOfText({ html, text, paragraphs }: ContentDetails): boolean {
  if (paragraphs.length !== 1) return false;
  return (text.length >= 500 && getRepeatedPunctuationRunCountFromHtml(html) >= 3)
    || (text.length >= 600 && getLongestFormattingSentenceLengthFromHtml(html) >= 500);
}

function isMostlyNonEnglish(html: string): boolean {
  const counts = getProseLanguageCounts(html);
  if (!counts) return false;
  return counts.nonEnglishLetters / counts.letters > 0.25 || counts.nonEnglishLetters >= 300;
}

function duplicatesOtherContent(focusedContent: ContentItem, contents: ContentItem[]): boolean {
  const others = contents.filter(content => content._id !== focusedContent._id);
  if (isPost(focusedContent)) {
    const title = normalizeForComparison(focusedContent.title ?? '');
    const sharesTitle = others.filter(isPost).some(post => normalizeForComparison(post.title ?? '') === title);
    if (title.length >= DUPLICATE_MIN_TITLE_LENGTH && sharesTitle) return true;
  }
  const body = normalizeForComparison(getPlaintext(focusedContent));
  return body.length >= DUPLICATE_MIN_BODY_LENGTH
    && others.some(content => normalizeForComparison(getPlaintext(content)) === body);
}

const matchingRuleIds = (rules: Record<string, boolean>) => new Set(Object.keys(rules).filter(id => rules[id]));

/** Keyed by moderation template `_id`; the comment above each rule is the template's name. */
export function getHighlightedMessageTemplateIds(ctx: HighlightContext): Set<string> {
  const summary = summarizeUser(ctx);
  const displayName = ctx.user.displayName ?? '';
  const contents = summary.contents.map(describeContent);
  const posts = contents.filter(({ content }) => isPost(content));
  const aiResearchPosts = posts.filter(({ titleAndText }) => MENTIONS_AI.test(titleAndText) && MENTIONS_RESEARCH.test(titleAndText));

  return matchingRuleIds({
    // No Org Usernames
    jLmxBpT6S5tKZeRje: ORGANIZATION_NAME.test(displayName),
    // Make Username Pronounceable
    QgjTGcAXTubHLFT3T: /\d.*\d.*\d/i.test(displayName) || /[bcdfghjklmnpqrstvwxz]{5,}/i.test(displayName) || /^[^ ]{24,}$/i.test(displayName),
    // Politics
    qeA9Nz5wcK5Jf3DNc: contents.some(({ titleAndText }) => countDistinctMatches(titleAndText, POLITICAL_TERMS) >= 2)
      || posts.some(({ titleAndText }) => POLITICAL_PARTY.test(titleAndText) || COUNTRY.test(titleAndText)),
    // Formatting / Grammar
    kjngfezNkPWoJKXaR: contents.some(hasFormattingProblems),
    // Lotsa DMs
    Jk8MT3Bx8gtLQDqPJ: summary.activeDmFlagCount >= 1,
    // This isn't gonna work out
    HDoZ8fssGxkdrWk7B: summary.sentModeratorMessageCount >= 2,
    // Multiple LLM rejections
    '6agTZiaGBy3rmuFPi': summary.highPangramScoreCount >= 2 && summary.sentModeratorMessageCount >= 2,
    // Barely approved AI content
    cqS4KAvpsRwop9bzE: summary.unapprovedCount >= 1 && contents.some(({ titleAndText }) => MENTIONS_AI.test(titleAndText)),
    // No Unmotivated Vibecoded AI Research
    QpuGWbJHRyFz7jnFL: aiResearchPosts.length >= 2 && aiResearchPosts.some(({ content }) => content.rejected),
    // Semi-automoderated quality warning (downvoted)
    Yban5DJx6wdwfT55u: summary.minBaseScore < 0,
    // Semi-Automated Quality (low average)
    '9hJ97QDSFJ73FHm27': (summary.averagePostKarma <= 2 && ctx.posts.length > 4)
      || (summary.averageCommentKarma < 1 && ctx.comments.length >= 4),
    // Your Submissions Aren't Finding Traction
    SDueuoox7Rtv2KzzR: contents.length >= 3 && summary.rejectedCount === 0 && summary.minBaseScore >= 0 && summary.maxBaseScore <= 2,
  });
}

/** Keyed by moderation template `_id`; the comment above each rule is the template's name. */
export function getHighlightedRejectionTemplateIds(focusedContent: ContentItem, ctx: HighlightContext): Set<string> {
  const details = describeContent(focusedContent);
  const { html, text, titleAndText } = details;
  const contents: ContentItem[] = [...ctx.posts, ...ctx.comments];
  const focusedIsPost = isPost(focusedContent);
  const linkpostUrl = isPost(focusedContent) ? focusedContent.url : null;
  const isLinkpost = !!linkpostUrl;
  const linkHrefs = getLinkHrefs(html);
  const linkCount = linkHrefs.length;
  const pangramScore = getPangramScore(focusedContent);
  const mentionsAi = MENTIONS_AI.test(titleAndText);
  const mentionsAiOrAgents = MENTIONS_AI_OR_AGENTS.test(titleAndText);
  const llmMysticismTermCount = countDistinctMatches(titleAndText, LLM_MYSTICISM_TERMS);
  const hasPriorRejection = (ctx.user.rejectedContentCount ?? 0) >= 1
    || contents.some(content => content.rejected && content._id !== focusedContent._id);

  return matchingRuleIds({
    // Probably Insufficient Quality for AI Post
    oEDFB6quMvtbrrTJF: mentionsAi,
    // Insufficient Quality for AI Content (posts)
    zjuhK23edCtaHFBiM: focusedIsPost && mentionsAiOrAgents,
    // Insufficient Quality for AI Content (comments)
    dc6jmTmGBGcehmjp5: !focusedIsPost && mentionsAiOrAgents,
    // Insufficient quality
    jMnuDMzkxxv6KYXoe: TWO_LOWERCASE_SENTENCE_STARTS_IN_FOUR_SENTENCES.test(text)
      || TWO_PERIODS_WITHOUT_FOLLOWING_SPACE.test(text)
      || hasOverlongParagraph(details)
      || isWallOfText(details)
      || (focusedIsPost && !isLinkpost && text.length < 2000)
      || (!focusedIsPost && text.length < 200),
    // No Unmotivated Vibecoded AI Research
    yEuGMPp9n69hQTaQZ: focusedIsPost && mentionsAi && MENTIONS_RESEARCH.test(titleAndText),
    // Missing some AI alignment basics
    RaZbGQgQFHTnhADtc: focusedIsPost && mentionsAi,
    // Roko's Basilisk
    CZXcvC7MRQFisDLzu: ROKOS_BASILISK.test(titleAndText),
    // Duplicate
    zJnR8uwyfFHysrEXE: duplicatesOtherContent(focusedContent, contents),
    // No, we won't answer followup questions
    '92jk7orNzXeXsBwhn': hasPriorRejection && MENTIONS_MODERATION.test(titleAndText),
    // Political norm
    znkq9eFiHSGapPxuY: countDistinctMatches(titleAndText, POLITICAL_TERMS) >= 2
      || (focusedIsPost && (POLITICAL_PARTY.test(titleAndText) || COUNTRY.test(titleAndText))),
    // No LLM Case Studies
    bNowHrpefEixoSqep: LLM_CONVERSATION.test(titleAndText) && llmMysticismTermCount >= 1,
    // LLM sycophancy trap
    TSr4KisbusfQLBRk4: pangramScore > 0 && llmMysticismTermCount >= 2,
    // Potentially / Partially LLM
    '6mfStWue5fFundnh5': pangramScore > 0.1 && pangramScore < 0.5,
    // No LLM
    ABq6EDegQoLmrRijt: pangramScore > 0.1,
    // No LLM (autoreject)
    '2m37jFoGn4XrbngSz': pangramScore > 0.3,
    // Difficult to evaluate (offsite content)
    wqaWetK6QoP523Ewx: linkCount === 1 || isOffsiteLink(linkpostUrl) || linkHrefs.some(isOffsiteLink),
    // Not obviously not spam
    jTB9sweKK9pRLM4db: (text.length < 600 && (linkCount === 1 || isLinkpost)) || OBFUSCATED_CONTACT_ADDRESS.test(text),
    // We only accept English-language content
    ewGaTQKLqLRT3H5su: isMostlyNonEnglish(html),
    // Submitted by Accident?
    NunBbAcEEr9TcDcBh: focusedIsPost && (text.length < 50 || /^\s*untitled draft\b/i.test(titleAndText)),
    // Clearer intro
    '3AtQ4JaEpEPD8t7f2': focusedIsPost && text.length >= 2500 && (
      (linkCount === 0 && NO_INTRO_IN_FIRST_1000_CHARACTERS.test(text))
      || countDistinctMatches(text, GRANDIOSE_TERMS) >= 3
    ),
    // Too Chonky Abstract paragraph
    DAcutGyaqj2xy6cwB: focusedIsPost && (getFirstParagraphLength(focusedContent) ?? 0) > 1000,
    // Formatting
    zszEyQ6mmCjKQq43F: hasFormattingProblems(details) || isWallOfText(details),
    // Difficult to evaluate, with potential yellow flags.
    MRTY3fzc5zumSdZPX: focusedIsPost && text.length >= 1000
      && countDistinctMatches(titleAndText, METAPHYSICS_TERMS) >= 1
      && countDistinctMatches(titleAndText, PHYSICS_TERMS) >= 2,
    // LLM (English translation)
    RccfQuaa6veciDgEh: LLM_TRANSLATION.test(titleAndText),
    // No fiction/poetry from new users
    '5csYohfiLuTa3s9cv': focusedIsPost && (FICTION_IN_FIRST_500_CHARACTERS.test(text) || ATTRIBUTED_DIALOGUE.test(text)),
  });
}

interface ModeratorActionRule {
  action: HighlightableModeratorAction;
  color: ModeratorActionHighlightColor;
  highlight: boolean;
  strong: boolean;
}

/** A highlighted action gets a subtle outline, or its own color when its `strong` condition also holds. */
export function getHighlightedModeratorActions(ctx: HighlightContext): HighlightedModeratorActions {
  const summary = summarizeUser(ctx);
  const { karma, approvedCount, rejectedCount, unapprovedCount, averagePostKarma, averageCommentKarma } = summary;
  const hasEstablishedKarma = karma >= 10 || (karma >= 0 && approvedCount >= 2);

  const rules: ModeratorActionRule[] = [
    {
      action: 'approve', color: 'green',
      highlight: (averagePostKarma >= 0 && averageCommentKarma >= 0 && hasEstablishedKarma && summary.hasUnapprovedContentBelowLlmThreshold)
        || (karma >= 1 && approvedCount >= 1),
      strong: (summary.maxBaseScore > 12 && summary.minBaseScore >= 1 && averagePostKarma >= 5 && averageCommentKarma >= 1)
        || karma >= 100,
    },
    {
      action: 'snoozeCustom', color: 'gold',
      highlight: summary.hasUnapprovedContentBelowLlmThreshold || (unapprovedCount === 0 && approvedCount >= 1),
      strong: summary.allUnapprovedContentHasLlmScore && approvedCount >= 1,
    },
    {
      action: 'approveCurrentOnly', color: 'gold',
      highlight: summary.hasUnapprovedContentBelowLlmThreshold,
      strong: summary.allUnapprovedContentHasLlmScore,
    },
    {
      action: 'remove', color: 'black',
      highlight: unapprovedCount === 0 && averagePostKarma < 8 && averageCommentKarma < 1.5,
      strong: rejectedCount >= 1,
    },
    {
      action: 'purge', color: 'red',
      highlight: summary.contents.length <= 3 && approvedCount === 0,
      strong: rejectedCount >= 2,
    },
    {
      action: 'disablePermissions', color: 'black',
      highlight: !areAllContentPermissionsDisabled(ctx.user) && (rejectedCount >= 2 || summary.mostRecentContentIsRejected),
      strong: rejectedCount >= 2,
    },
    {
      action: 'disableMessages', color: 'black',
      highlight: !ctx.user.conversationsDisabled && summary.activeDmFlagCount >= 1,
      strong: true,
    },
  ];

  return new Map(rules
    .filter(rule => rule.highlight)
    .map((rule): [HighlightableModeratorAction, ModeratorActionHighlightStyle] => [rule.action, rule.strong ? rule.color : 'subtleOutline'])
  );
}
