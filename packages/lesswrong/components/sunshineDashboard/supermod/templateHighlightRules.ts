import type { HighlightRule, HighlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRuleTypes";
import type { ContentItem } from "./helpers";
import {
  booleanCondition,
  distinctRegexMatchesCondition,
  highlightRuleMatches,
  matchingItemsRegexCondition,
  numberCondition,
  regexCondition,
  resolveHighlightRules,
} from "./declarativeHighlightRules";
import type { HighlightSignalContext } from "./highlightSignals";

/**
 * Production ModerationTemplates._ids. On a database that doesn't have these rows the defaults
 * silently no-op and the rule editor shows "No template with this ID" — the rules are coupled to
 * prod data rather than to schema.
 */
export const MESSAGE_TEMPLATE_IDS = {
  badFitFirstPost: 'c9fBRe7pg4vAxxE8K',
  barelyApprovedAiContent: 'cqS4KAvpsRwop9bzE',
  formattingGrammar: 'kjngfezNkPWoJKXaR',
  lotsaDms: 'Jk8MT3Bx8gtLQDqPJ',
  makeUsernamePronounceable: 'QgjTGcAXTubHLFT3T',
  multipleLlmRejections: '6agTZiaGBy3rmuFPi',
  noUnmotivatedVibecodedAiResearch: 'QpuGWbJHRyFz7jnFL',
  noOrgUsernames: 'jLmxBpT6S5tKZeRje',
  politics: 'qeA9Nz5wcK5Jf3DNc',
  semiAutomatedQualityInsufficientAi: '9Y7T2hevYC5TAe5wE',
  semiAutomatedQualityLowAverage: '9hJ97QDSFJ73FHm27',
  semiAutomoderatedQualityDownvoted: 'Yban5DJx6wdwfT55u',
  thisIsntGonnaWorkOut: 'HDoZ8fssGxkdrWk7B',
  submissionsArentFindingTraction: 'SDueuoox7Rtv2KzzR',
};

export const REJECTION_TEMPLATE_IDS = {
  clearerIntro: '3AtQ4JaEpEPD8t7f2',
  difficultToEvaluateOffsiteContent: 'wqaWetK6QoP523Ewx',
  duplicate: 'zJnR8uwyfFHysrEXE',
  formatting: 'zszEyQ6mmCjKQq43F',
  insufficientQuality: 'jMnuDMzkxxv6KYXoe',
  insufficientQualityForAiComments: 'dc6jmTmGBGcehmjp5',
  insufficientQualityForAiPosts: 'zjuhK23edCtaHFBiM',
  llmSycophancyTrap: 'TSr4KisbusfQLBRk4',
  missingAiAlignmentBasics: 'RaZbGQgQFHTnhADtc',
  noFollowupQuestions: '92jk7orNzXeXsBwhn',
  noLlm: 'ABq6EDegQoLmrRijt',
  noLlmAutoreject: '2m37jFoGn4XrbngSz',
  noLlmCaseStudies: 'bNowHrpefEixoSqep',
  noUnmotivatedVibecodedAiResearch: 'yEuGMPp9n69hQTaQZ',
  notObviouslyNotSpam: 'jTB9sweKK9pRLM4db',
  politicalNorm: 'znkq9eFiHSGapPxuY',
  potentiallyPartiallyLlm: '6mfStWue5fFundnh5',
  probablyInsufficientQualityForAiContent: 'oEDFB6quMvtbrrTJF',
  rokosBasilisk: 'CZXcvC7MRQFisDLzu',
  submittedByAccident: 'NunBbAcEEr9TcDcBh',
  tooChonkyAbstractParagraph: 'DAcutGyaqj2xy6cwB',
  englishLanguageOnly: 'ewGaTQKLqLRT3H5su',
};

export interface TemplateHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  ruleOverrides?: HighlightRuleOverrides | null;
}

const TRACTION_MIN_CONTENTS = 3;
const TRACTION_MAX_BASE_SCORE = 2;

const BAD_FIT_MIN_REJECTED_POSTS = 2;

const AI_RESEARCH_MIN_POSTS = 2;

const ORG_USERNAME_PATTERN = '\\b(team|labs?|institute|foundation|research|official|inc|llc|ltd|ventures?|solutions|technologies|capital|group|systems|collective)\\b';
const ORG_USERNAME_EXPLANATION = 'The display name contains a whole-word organization term such as team, lab, institute, research, or foundation.';
const THREE_DIGITS_PATTERN = '\\d.*\\d.*\\d';
const THREE_DIGITS_EXPLANATION = 'The display name contains at least three digits, with any characters between them.';
const CONSONANT_RUN_PATTERN = '[bcdfghjklmnpqrstvwxz]{5,}';
const CONSONANT_RUN_EXPLANATION = 'The display name contains a run of at least five consonants.';
const LONG_UNBROKEN_USERNAME_PATTERN = '^[^ ]{24,}$';
const LONG_UNBROKEN_USERNAME_EXPLANATION = 'The display name is at least 24 characters long and contains no spaces.';
const POLITICAL_TERMS_PATTERN = '\\b(trump|biden|obama|kamala|democrats?|republicans?|left-wing|right-wing|elections?|presidential|congress|senate|immigration|abortion|transgender|woke|israel|gaza|palestine|palestinians?|culture war)\\b';
const POLITICAL_TERMS_EXPLANATION = 'A single content item contains different whole-word political terms from the listed names, parties, institutions, and topics; repeated uses of one term count once.';
// The next two patterns detect problems *by case*, so they must always be used with a
// case-sensitive operator. Under the /i variants `[a-z]` also matches uppercase and they
// degenerate into "has four sentences", i.e. they fire on nearly everything.
const MULTIPLE_LOWERCASE_SENTENCE_STARTS_PATTERN = '^(?=(?:[\\s\\S]*?[.!?]\\s+[A-Za-z]){4})(?:[\\s\\S]*?[.!?]\\s+[a-z]){2}';
const MULTIPLE_LOWERCASE_SENTENCE_STARTS_EXPLANATION = 'A content item has at least four apparent sentence boundaries, including at least two followed by a lowercase letter.';
const MULTIPLE_MISSING_SENTENCE_SPACES_PATTERN = '(?:[a-z]\\.[A-Z][a-z][\\s\\S]*?){2}';
const MULTIPLE_MISSING_SENTENCE_SPACES_EXPLANATION = 'A content item has at least two periods where the next capitalized word starts immediately, without a space.';
const OVERLONG_FORMATTING_PARAGRAPH_PATTERN = '^[\\s\\S]{1501,}$';
const OVERLONG_FORMATTING_PARAGRAPH_EXPLANATION = 'A paragraph contains at least 1,501 plain-text characters.';
const AI_TOPIC_PATTERN = '\\b(AI|AGI|ASI|LLMs?|GPT|ChatGPT|language models?|machine learning|deep learning|neural networks?|transformers?|mechanistic interpretability|model interpretability)\\b';
const AI_TOPIC_EXPLANATION = 'The selected content mentions AI, a language model, or a technical AI topic such as machine learning, neural networks, transformers, or mechanistic interpretability.';
const AI_RESEARCH_PROCESS_PATTERN = '\\b(research|projects?|experiments?|experimental|methodology|architectures?|train(?:ed|ing)?|fine[- ]tun(?:e|ed|ing)|evaluat(?:e|ed|ion)|results?|benchmarks?|datasets?)\\b';
const AI_RESEARCH_PROCESS_EXPLANATION = 'The selected content presents an AI research project, experiment, training process, evaluation, results, benchmark, or dataset.';

function aiTopicCondition(signal: 'contentTitlesAndTexts' | 'focusedTitleAndText') {
  return regexCondition(signal, AI_TOPIC_PATTERN, 'matchesRegex', AI_TOPIC_EXPLANATION);
}

const focusedAiTopicCondition = aiTopicCondition('focusedTitleAndText');
const focusedAiResearchGroup = [
  booleanCondition('focusedIsPost', true),
  focusedAiTopicCondition,
  regexCondition('focusedTitleAndText', AI_RESEARCH_PROCESS_PATTERN, 'matchesRegex', AI_RESEARCH_PROCESS_EXPLANATION),
];

// These two constants are interpolated into lookaheads below, so they have to stay fully
// grouped: rewriting `\b(AI|AGI)\b` as `\bAI\b|\bAGI\b` changes the alternation's
// precedence inside the lookahead and silently narrows what the combined pattern matches.
const AI_RESEARCH_POST_PATTERN = `(?=[\\s\\S]*${AI_TOPIC_PATTERN})(?=[\\s\\S]*${AI_RESEARCH_PROCESS_PATTERN})`;
const AI_RESEARCH_POSTS_EXPLANATION = `At least ${AI_RESEARCH_MIN_POSTS} posts each mention AI or a technical AI topic and present an AI research project, experiment, training process, evaluation, results, benchmark, or dataset.`;
const REJECTED_AI_RESEARCH_POST_EXPLANATION = 'At least one of the user\'s rejected posts mentions AI or a technical AI topic and presents an AI research project, experiment, training process, evaluation, results, benchmark, or dataset.';
const userHasRepeatedAiResearchGroup = [
  matchingItemsRegexCondition(
    'postTitlesAndTexts',
    AI_RESEARCH_POST_PATTERN,
    AI_RESEARCH_MIN_POSTS,
    false,
    AI_RESEARCH_POSTS_EXPLANATION,
  ),
  regexCondition('rejectedPostTitlesAndTexts', AI_RESEARCH_POST_PATTERN, 'matchesRegex', REJECTED_AI_RESEARCH_POST_EXPLANATION),
];

export const DEFAULT_MESSAGE_TEMPLATE_RULES: Record<string, HighlightRule> = {
  [MESSAGE_TEMPLATE_IDS.noOrgUsernames]: {
    enabled: true,
    groups: [[regexCondition('userDisplayName', ORG_USERNAME_PATTERN, 'matchesRegex', ORG_USERNAME_EXPLANATION)]],
  },
  [MESSAGE_TEMPLATE_IDS.makeUsernamePronounceable]: {
    enabled: true,
    groups: [
      [regexCondition('userDisplayName', THREE_DIGITS_PATTERN, 'matchesRegex', THREE_DIGITS_EXPLANATION)],
      [regexCondition('userDisplayName', CONSONANT_RUN_PATTERN, 'matchesRegex', CONSONANT_RUN_EXPLANATION)],
      [regexCondition('userDisplayName', LONG_UNBROKEN_USERNAME_PATTERN, 'matchesRegex', LONG_UNBROKEN_USERNAME_EXPLANATION)],
    ],
  },
  [MESSAGE_TEMPLATE_IDS.politics]: {
    enabled: true,
    groups: [[distinctRegexMatchesCondition(
      'contentTitlesAndTexts',
      POLITICAL_TERMS_PATTERN,
      2,
      false,
      POLITICAL_TERMS_EXPLANATION,
    )]],
  },
  [MESSAGE_TEMPLATE_IDS.formattingGrammar]: {
    enabled: true,
    groups: [
      [regexCondition('contentPlaintexts', MULTIPLE_LOWERCASE_SENTENCE_STARTS_PATTERN, 'matchesRegexCaseSensitive', MULTIPLE_LOWERCASE_SENTENCE_STARTS_EXPLANATION)],
      [regexCondition('contentPlaintexts', MULTIPLE_MISSING_SENTENCE_SPACES_PATTERN, 'matchesRegexCaseSensitive', MULTIPLE_MISSING_SENTENCE_SPACES_EXPLANATION)],
      [regexCondition('contentFormattingParagraphs', OVERLONG_FORMATTING_PARAGRAPH_PATTERN, 'matchesRegexCaseSensitive', OVERLONG_FORMATTING_PARAGRAPH_EXPLANATION)],
    ],
  },
  [MESSAGE_TEMPLATE_IDS.lotsaDms]: {
    enabled: true,
    groups: [[numberCondition('activeDmFlagCount', 'gte', 1)]],
  },
  [MESSAGE_TEMPLATE_IDS.thisIsntGonnaWorkOut]: {
    enabled: true,
    groups: [[numberCondition('sentModeratorMessageCount', 'gte', 2)]],
  },
  [MESSAGE_TEMPLATE_IDS.multipleLlmRejections]: {
    enabled: true,
    groups: [[
      numberCondition('highPangramScoreContentCount', 'gte', 2),
      numberCondition('sentModeratorMessageCount', 'gte', 2),
    ]],
  },
  [MESSAGE_TEMPLATE_IDS.semiAutomatedQualityInsufficientAi]: {
    enabled: true,
    groups: [[aiTopicCondition('contentTitlesAndTexts')]],
  },
  [MESSAGE_TEMPLATE_IDS.barelyApprovedAiContent]: {
    enabled: true,
    groups: [[aiTopicCondition('contentTitlesAndTexts')]],
  },
  [MESSAGE_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch]: {
    enabled: true,
    groups: [userHasRepeatedAiResearchGroup],
  },
  [MESSAGE_TEMPLATE_IDS.semiAutomoderatedQualityDownvoted]: {
    enabled: true,
    groups: [[booleanCondition('hasActiveDownvotedContentAlert', true)]],
  },
  // The template's own criterion: lots of contents averaging under 1 karma each,
  // which is what these automod alerts fire on
  [MESSAGE_TEMPLATE_IDS.semiAutomatedQualityLowAverage]: {
    enabled: true,
    groups: [[booleanCondition('hasActiveLowAverageKarmaAlert', true)]],
  },
  [MESSAGE_TEMPLATE_IDS.badFitFirstPost]: {
    enabled: true,
    groups: [[
      numberCondition('rejectedPostCount', 'gte', BAD_FIT_MIN_REJECTED_POSTS),
      numberCondition('approvedContentCount', 'eq', 0),
    ]],
  },
  // A few submissions, none rejected, but nobody's engaging (scores hovering at
  // the self-vote). Negative scores are the downvoted template's territory instead.
  [MESSAGE_TEMPLATE_IDS.submissionsArentFindingTraction]: {
    enabled: true,
    groups: [[
      numberCondition('contentCount', 'gte', TRACTION_MIN_CONTENTS),
      numberCondition('rejectedContentCount', 'eq', 0),
      numberCondition('minContentBaseScore', 'gte', 0),
      numberCondition('maxContentBaseScore', 'lte', TRACTION_MAX_BASE_SCORE),
    ]],
  },
};

const POTENTIALLY_LLM_SCORE_MIN = 0.1;
const POTENTIALLY_LLM_SCORE_MAX = 0.3;

const NON_LATIN_LETTER_MIN_RATIO = 0.25;
const NON_LATIN_MIN_LETTERS = 20;

const ACCIDENT_MAX_PLAINTEXT_LENGTH = 50;

const OFFSITE_MAX_PLAINTEXT_LENGTH = 600;

const CHONKY_ABSTRACT_MIN_FIRST_PARAGRAPH_LENGTH = 1000;

const CLEARER_INTRO_MIN_TEXT_LENGTH = 2500;
const CLEARER_INTRO_SIGNPOST_WINDOW = 1000;
const GRANDIOSE_MIN_DISTINCT_TERMS = 3;
const UNSIGNPOSTED_INTRO_PATTERN = `^(?![\\s\\S]{0,${CLEARER_INTRO_SIGNPOST_WINDOW}}(?:tl;?dr|summary|abstract|epistemic status|overview|in this (?:post|essay|article|piece)|this (?:post|essay|article|piece)|i (?:will |'ll |want to |am going to )?(?:argue|claim|show|propose|explain|explore|describe|examine|outline|summarize)|my (?:thesis|claim|argument|main point)|(?:argue|claim|contend|show) that|the (?:point|purpose|goal|aim) of this))`;
const UNSIGNPOSTED_INTRO_EXPLANATION = `The first ${CLEARER_INTRO_SIGNPOST_WINDOW} characters contain no thesis-signposting phrase such as TL;DR, summary, abstract, epistemic status, "in this post", or "I argue".`;
const GRANDIOSE_TERMS_PATTERN = '\\b(?:manifesto|paradigm|framework|civilization|consciousness|humanity|harmony|transcend\\w*|awakening|emergence|emergent|resonance|recursive|recursion|spiral\\w*|sentien\\w*)\\b';
const GRANDIOSE_TERMS_EXPLANATION = 'The selected content contains distinct grandiose terms such as manifesto, paradigm, framework, civilization, consciousness, harmony, transcendence, awakening, emergence, resonance, recursion, spiral, or sentience; repeated uses of one form count once.';

// Backtested against two years of rejections (Aug 2026), with events, shortform containers and
// the emptied-out posts of purged spammers excluded from the approved side. Content below these
// lengths accounts for ~47% of past insufficient-quality post rejections and ~40% of the comment
// ones, while firing on ~13% of approved new-author posts and ~16% of their comments. Approved
// new-author posts run far longer than rejected ones (median ~8900 characters), which is why the
// post threshold can sit so much higher than the comment one.
const INSUFFICIENT_QUALITY_MAX_POST_LENGTH = 2000;
const INSUFFICIENT_QUALITY_MAX_COMMENT_LENGTH = 200;

const REPEATED_PUNCTUATION_MIN_TEXT_LENGTH = 500;
const REPEATED_PUNCTUATION_MIN_RUNS = 3;
const RUN_ON_MIN_TEXT_LENGTH = 600;
const RUN_ON_MIN_SENTENCE_LENGTH = 500;

const ROKO_PATTERN = "\\broko'?s?\\b|\\bbasilisks?\\b|\\bacausal (extortion|blackmail|trade)\\b";
const ROKO_EXPLANATION = 'The selected content mentions Roko, basilisk or basilisks, or acausal extortion, blackmail, or trade.';
const MODERATION_DECISION_PATTERN = '\\breject(ed|ion)s?\\b|\\bmoderators?\\b|\\bmoderation\\b|\\bmod team\\b|\\bcensor(ed|ship|ing)?\\b';
const MODERATION_DECISION_EXPLANATION = 'The selected content mentions rejection, moderators or moderation, the mod team, or censorship.';
const LLM_CONVERSATION_PATTERN = '\\b(conversations?|chats?|transcripts?|dialogues?|sessions?) with (an? |my )?(LLM|AI|ChatGPT|Claude|GPT[-\\w]*|Gemini|Grok)\\b|\\bI (asked|prompted|told) (ChatGPT|Claude|GPT[-\\w]*|Gemini|Grok|the (AI|model|LLM))\\b';
const LLM_CONVERSATION_EXPLANATION = 'The selected content describes a conversation, chat, transcript, dialogue, or session with an AI model, or says the author asked, prompted, or told one.';
const LLM_SPECULATION_TERMS_PATTERN = '\\b(recursive|recursion|emergent|emergence|resonance|resonant|spirals?|consciousness|sentient|sentience|awakening|glyphs?)\\b';
const LLM_SPECULATION_TERMS_EXPLANATION = 'The selected content contains distinct speculative terms related to recursion, emergence, resonance, spirals, consciousness, sentience, awakening, or glyphs; repeated uses of one term count once.';

const probablyLlmWritten: HighlightRule = {
  enabled: true,
  groups: [[numberCondition('focusedPangramScore', 'gt', POTENTIALLY_LLM_SCORE_MAX)]],
};

/**
 * Content that is mostly just a pointer elsewhere: little text of its own, and
 * either a single link or (for posts) a linkpost url.
 */
const probablyOffsiteContent: HighlightRule = {
  enabled: true,
  groups: [
    [numberCondition('focusedTextLength', 'lt', OFFSITE_MAX_PLAINTEXT_LENGTH), numberCondition('focusedLinkCount', 'eq', 1)],
    [numberCondition('focusedTextLength', 'lt', OFFSITE_MAX_PLAINTEXT_LENGTH), booleanCondition('focusedHasLinkpostUrl', true)],
  ],
};

const formattingRejectionRule: HighlightRule = {
  enabled: true,
  groups: [
    [regexCondition('focusedPlaintext', MULTIPLE_LOWERCASE_SENTENCE_STARTS_PATTERN, 'matchesRegexCaseSensitive', MULTIPLE_LOWERCASE_SENTENCE_STARTS_EXPLANATION)],
    [regexCondition('focusedPlaintext', MULTIPLE_MISSING_SENTENCE_SPACES_PATTERN, 'matchesRegexCaseSensitive', MULTIPLE_MISSING_SENTENCE_SPACES_EXPLANATION)],
    [regexCondition('focusedFormattingParagraphs', OVERLONG_FORMATTING_PARAGRAPH_PATTERN, 'matchesRegexCaseSensitive', OVERLONG_FORMATTING_PARAGRAPH_EXPLANATION)],
    [
      numberCondition('focusedFormattingParagraphCount', 'eq', 1),
      numberCondition('focusedTextLength', 'gte', REPEATED_PUNCTUATION_MIN_TEXT_LENGTH),
      numberCondition('focusedRepeatedPunctuationRunCount', 'gte', REPEATED_PUNCTUATION_MIN_RUNS),
    ],
    [
      numberCondition('focusedFormattingParagraphCount', 'eq', 1),
      numberCondition('focusedTextLength', 'gte', RUN_ON_MIN_TEXT_LENGTH),
      numberCondition('focusedLongestFormattingSentenceLength', 'gte', RUN_ON_MIN_SENTENCE_LENGTH),
    ],
  ],
};

export const DEFAULT_REJECTION_TEMPLATE_RULES: Record<string, HighlightRule> = {
  [REJECTION_TEMPLATE_IDS.probablyInsufficientQualityForAiContent]: {
    enabled: true,
    groups: [[focusedAiTopicCondition]],
  },
  [REJECTION_TEMPLATE_IDS.insufficientQualityForAiPosts]: {
    enabled: true,
    groups: [[booleanCondition('focusedIsPost', true), focusedAiTopicCondition]],
  },
  [REJECTION_TEMPLATE_IDS.insufficientQualityForAiComments]: {
    enabled: true,
    groups: [[booleanCondition('focusedIsPost', false), focusedAiTopicCondition]],
  },
  [REJECTION_TEMPLATE_IDS.insufficientQuality]: {
    enabled: true,
    groups: [
      ...formattingRejectionRule.groups,
      [
        booleanCondition('focusedIsPost', true),
        // Short linkposts are the offsite-content templates' business rather than this one's.
        booleanCondition('focusedHasLinkpostUrl', false),
        numberCondition('focusedTextLength', 'lt', INSUFFICIENT_QUALITY_MAX_POST_LENGTH),
      ],
      [
        booleanCondition('focusedIsPost', false),
        numberCondition('focusedTextLength', 'lt', INSUFFICIENT_QUALITY_MAX_COMMENT_LENGTH),
      ],
    ],
  },
  [REJECTION_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch]: {
    enabled: true,
    groups: [focusedAiResearchGroup],
  },
  [REJECTION_TEMPLATE_IDS.missingAiAlignmentBasics]: {
    enabled: true,
    groups: [[booleanCondition('focusedIsPost', true), focusedAiTopicCondition]],
  },
  [REJECTION_TEMPLATE_IDS.rokosBasilisk]: {
    enabled: true,
    groups: [[regexCondition('focusedTitleAndText', ROKO_PATTERN, 'matchesRegex', ROKO_EXPLANATION)]],
  },
  [REJECTION_TEMPLATE_IDS.duplicate]: {
    enabled: true,
    groups: [[booleanCondition('focusedDuplicatesExistingContent', true)]],
  },
  [REJECTION_TEMPLATE_IDS.noFollowupQuestions]: {
    enabled: true,
    groups: [[
      booleanCondition('focusedIsPost', true),
      booleanCondition('hasPriorRejection', true),
      regexCondition('focusedTitleAndText', MODERATION_DECISION_PATTERN, 'matchesRegex', MODERATION_DECISION_EXPLANATION),
    ]],
  },
  [REJECTION_TEMPLATE_IDS.politicalNorm]: {
    enabled: true,
    groups: [[distinctRegexMatchesCondition(
      'focusedTitleAndText',
      POLITICAL_TERMS_PATTERN,
      2,
      false,
      POLITICAL_TERMS_EXPLANATION,
    )]],
  },
  [REJECTION_TEMPLATE_IDS.noLlmCaseStudies]: {
    enabled: true,
    groups: [[
      regexCondition('focusedTitleAndText', LLM_CONVERSATION_PATTERN, 'matchesRegex', LLM_CONVERSATION_EXPLANATION),
      distinctRegexMatchesCondition(
        'focusedTitleAndText',
        LLM_SPECULATION_TERMS_PATTERN,
        1,
        false,
        LLM_SPECULATION_TERMS_EXPLANATION,
      ),
    ]],
  },
  [REJECTION_TEMPLATE_IDS.llmSycophancyTrap]: {
    enabled: true,
    groups: [[
      numberCondition('focusedPangramScore', 'gt', 0),
      distinctRegexMatchesCondition(
        'focusedTitleAndText',
        LLM_SPECULATION_TERMS_PATTERN,
        2,
        false,
        LLM_SPECULATION_TERMS_EXPLANATION,
      ),
    ]],
  },
  [REJECTION_TEMPLATE_IDS.potentiallyPartiallyLlm]: {
    enabled: true,
    groups: [[
      numberCondition('focusedPangramScore', 'gt', POTENTIALLY_LLM_SCORE_MIN),
      numberCondition('focusedPangramScore', 'lt', POTENTIALLY_LLM_SCORE_MAX),
    ]],
  },
  [REJECTION_TEMPLATE_IDS.noLlm]: probablyLlmWritten,
  [REJECTION_TEMPLATE_IDS.noLlmAutoreject]: probablyLlmWritten,
  [REJECTION_TEMPLATE_IDS.difficultToEvaluateOffsiteContent]: probablyOffsiteContent,
  [REJECTION_TEMPLATE_IDS.notObviouslyNotSpam]: probablyOffsiteContent,
  [REJECTION_TEMPLATE_IDS.englishLanguageOnly]: {
    enabled: true,
    groups: [[
      numberCondition('focusedLetterCount', 'gte', NON_LATIN_MIN_LETTERS),
      numberCondition('focusedNonLatinLetterRatio', 'gt', NON_LATIN_LETTER_MIN_RATIO),
    ]],
  },
  [REJECTION_TEMPLATE_IDS.submittedByAccident]: {
    enabled: true,
    groups: [[
      booleanCondition('focusedIsPost', true),
      numberCondition('focusedTextLength', 'lt', ACCIDENT_MAX_PLAINTEXT_LENGTH),
    ]],
  },
  // Tuned against past moderation decisions (Aug 2026): together the two groups catch
  // ~49% of past clearer-intro rejections while firing on ~13% of approved new-author posts.
  [REJECTION_TEMPLATE_IDS.clearerIntro]: {
    enabled: true,
    groups: [
      [
        booleanCondition('focusedIsPost', true),
        numberCondition('focusedTextLength', 'gte', CLEARER_INTRO_MIN_TEXT_LENGTH),
        numberCondition('focusedLinkCount', 'eq', 0),
        regexCondition('focusedPlaintext', UNSIGNPOSTED_INTRO_PATTERN, 'matchesRegex', UNSIGNPOSTED_INTRO_EXPLANATION),
      ],
      [
        booleanCondition('focusedIsPost', true),
        numberCondition('focusedTextLength', 'gte', CLEARER_INTRO_MIN_TEXT_LENGTH),
        distinctRegexMatchesCondition(
          'focusedPlaintext',
          GRANDIOSE_TERMS_PATTERN,
          GRANDIOSE_MIN_DISTINCT_TERMS,
          false,
          GRANDIOSE_TERMS_EXPLANATION,
        ),
      ],
    ],
  },
  [REJECTION_TEMPLATE_IDS.tooChonkyAbstractParagraph]: {
    enabled: true,
    groups: [[
      booleanCondition('focusedIsPost', true),
      numberCondition('focusedFirstParagraphLength', 'gt', CHONKY_ABSTRACT_MIN_FIRST_PARAGRAPH_LENGTH),
    ]],
  },
  [REJECTION_TEMPLATE_IDS.formatting]: formattingRejectionRule,
};

function toSignalContext(ctx: TemplateHighlightContext, focusedContent: ContentItem | null): HighlightSignalContext {
  return {
    user: ctx.user,
    moderatorActions: ctx.moderatorActions,
    posts: ctx.posts,
    comments: ctx.comments,
    focusedContent,
  };
}

function addMatchingRules(
  highlighted: Set<string>,
  rules: Record<string, HighlightRule>,
  signalContext: HighlightSignalContext,
) {
  for (const [templateId, rule] of Object.entries(rules)) {
    try {
      if (highlightRuleMatches(rule, signalContext)) highlighted.add(templateId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for template ${templateId}:`, e);
    }
  }
}

/** No consumer yet; the rejection composer that calls this lands with the inbox UI PR. */
export function getHighlightedRejectionTemplateIds(
  focusedContent: ContentItem | null | undefined,
  ctx: TemplateHighlightContext,
): Set<string> {
  const highlighted = new Set<string>();
  if (!focusedContent) return highlighted;
  const rules = resolveHighlightRules(DEFAULT_REJECTION_TEMPLATE_RULES, ctx.ruleOverrides, 'rejectionTemplates');
  addMatchingRules(highlighted, rules, toSignalContext(ctx, focusedContent));
  return highlighted;
}

export function getHighlightedTemplateIds(
  ctx: Omit<TemplateHighlightContext, 'posts' | 'comments'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  const fullCtx: TemplateHighlightContext = { ...ctx, posts, comments };
  const highlighted = new Set<string>();
  const rules = resolveHighlightRules(DEFAULT_MESSAGE_TEMPLATE_RULES, ctx.ruleOverrides, 'messageTemplates');
  addMatchingRules(highlighted, rules, toSignalContext(fullCtx, null));
  return highlighted;
}
