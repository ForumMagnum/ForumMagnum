import {
  getFormattingParagraphPlaintextsFromHtml,
  getLongestFormattingSentenceLengthFromHtml,
  getRepeatedPunctuationRunCountFromHtml,
  stripHtml,
} from '@/components/sunshineDashboard/supermod/contentTextHelpers';
import { resolveHighlightRules } from '@/components/sunshineDashboard/supermod/declarativeHighlightRules';
import {
  DEFAULT_MESSAGE_TEMPLATE_RULES,
  DEFAULT_REJECTION_TEMPLATE_RULES,
  MESSAGE_TEMPLATE_IDS,
  REJECTION_TEMPLATE_IDS,
} from '@/components/sunshineDashboard/supermod/templateHighlightRules';
import {
  migrateLegacyTemplateRuleOverrideKeys,
  isCaseSensitiveRegexHighlightOperator,
  isItemCountRegexHighlightOperator,
  isRegexHighlightOperator,
  parseHighlightRuleOverrides,
  serializeHighlightRuleOverrides,
  type HighlightCondition,
  type HighlightRule,
  type HighlightRuleOverrides,
} from '@/lib/moderatorHighlights/highlightRuleTypes';

/** A user's posts, most recent first; rejection rules treat the first one as the selected content. */
interface PostFixture {
  text: string;
  rejected?: boolean;
}

function postTextSignalValues(signal: string, posts: PostFixture[]): string[] | null {
  switch (signal) {
    case 'contentTitlesAndTexts':
    case 'postTitlesAndTexts':
      return posts.map(post => post.text);
    case 'rejectedPostTitlesAndTexts':
      return posts.filter(post => post.rejected).map(post => post.text);
    case 'focusedTitleAndText':
      return posts.slice(0, 1).map(post => post.text);
    default:
      return null;
  }
}

function conditionMatchesPosts(condition: HighlightCondition, posts: PostFixture[]): boolean {
  if (condition.signal === 'focusedIsPost') return condition.operator === 'isTrue';
  const signalValues = postTextSignalValues(condition.signal, posts);
  if (!signalValues || typeof condition.value !== 'string') return false;
  if (!isRegexHighlightOperator(condition.operator)) return false;
  const flags = isCaseSensitiveRegexHighlightOperator(condition.operator) ? undefined : 'i';
  const regex = new RegExp(condition.value, flags);
  const matchingItems = signalValues.filter(signalValue => regex.test(signalValue)).length;
  const minimumItems = isItemCountRegexHighlightOperator(condition.operator) ? (condition.minimumMatches ?? 1) : 1;
  return matchingItems >= minimumItems;
}

function ruleMatchesPosts(rule: HighlightRule, posts: PostFixture[]): boolean {
  return rule.enabled && rule.groups.some(group =>
    group.every(condition => conditionMatchesPosts(condition, posts))
  );
}

type FormattingSignalValue = number | string | string[];

function formattingSignalValues(html: string): Record<string, FormattingSignalValue> {
  const plaintext = stripHtml(html).replace(/\s+/g, ' ').trim();
  const paragraphs = getFormattingParagraphPlaintextsFromHtml(html);
  return {
    focusedPlaintext: plaintext,
    focusedFormattingParagraphs: paragraphs,
    focusedFormattingParagraphCount: paragraphs.length,
    focusedTextLength: plaintext.length,
    focusedRepeatedPunctuationRunCount: getRepeatedPunctuationRunCountFromHtml(html),
    focusedLongestFormattingSentenceLength: getLongestFormattingSentenceLengthFromHtml(html),
  };
}

function formattingConditionMatches(
  condition: HighlightCondition,
  values: Record<string, FormattingSignalValue>,
): boolean {
  const signalValue = values[condition.signal];
  if (typeof signalValue === 'number' && typeof condition.value === 'number') {
    switch (condition.operator) {
      case 'gte': return signalValue >= condition.value;
      case 'lte': return signalValue <= condition.value;
      case 'gt': return signalValue > condition.value;
      case 'lt': return signalValue < condition.value;
      case 'eq': return signalValue === condition.value;
      default: return false;
    }
  }
  if (typeof condition.value !== 'string') return false;
  if (condition.operator !== 'matchesRegex' && condition.operator !== 'matchesRegexCaseSensitive') return false;
  const regex = new RegExp(condition.value, condition.operator === 'matchesRegexCaseSensitive' ? undefined : 'i');
  const textValues = typeof signalValue === 'string' ? [signalValue] : signalValue;
  return Array.isArray(textValues) && textValues.some(text => regex.test(text));
}

function formattingRuleMatches(rule: HighlightRule, html: string): boolean {
  const values = formattingSignalValues(html);
  return rule.enabled && rule.groups.some(group =>
    group.every(condition => formattingConditionMatches(condition, values))
  );
}

function buildRepeatedPunctuationHtml(textLength: number, punctuationRunCount: number): string {
  const punctuation = '... '.repeat(punctuationRunCount);
  return `<p>${punctuation}${'a'.repeat(textLength - punctuation.length)}</p>`;
}

function buildRunOnHtml(textLength: number, longestSentenceLength: number): string {
  const sentenceBoundary = '. ';
  const remainingLength = textLength - longestSentenceLength - sentenceBoundary.length;
  return `<p>${'a'.repeat(longestSentenceLength)}${sentenceBoundary}${'B'.repeat(remainingLength)}</p>`;
}

type ClearerIntroSignalValue = number | string | boolean;

function clearerIntroConditionMatches(
  condition: HighlightCondition,
  values: Record<string, ClearerIntroSignalValue>,
): boolean {
  const signalValue = values[condition.signal];
  if (typeof signalValue === 'boolean') {
    if (condition.operator === 'isTrue') return signalValue;
    if (condition.operator === 'isFalse') return !signalValue;
    return false;
  }
  if (typeof signalValue === 'number' && typeof condition.value === 'number') {
    switch (condition.operator) {
      case 'gte': return signalValue >= condition.value;
      case 'lt': return signalValue < condition.value;
      case 'eq': return signalValue === condition.value;
      default: return false;
    }
  }
  if (typeof signalValue !== 'string' || typeof condition.value !== 'string') return false;
  if (condition.operator === 'matchesRegex') return new RegExp(condition.value, 'i').test(signalValue);
  if (condition.operator === 'hasAtLeastDistinctRegexMatches') {
    const matches = new Set<string>();
    for (const match of signalValue.matchAll(new RegExp(condition.value, 'gi'))) {
      matches.add(match[0].toLowerCase());
    }
    return matches.size >= (condition.minimumMatches ?? 1);
  }
  return false;
}

function clearerIntroRuleMatches(text: string, linkCount: number): boolean {
  const rule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.clearerIntro];
  const values: Record<string, ClearerIntroSignalValue> = {
    focusedIsPost: true,
    focusedPlaintext: text,
    focusedTextLength: text.length,
    focusedLinkCount: linkCount,
  };
  return rule.enabled && rule.groups.some(group =>
    group.every(condition => clearerIntroConditionMatches(condition, values))
  );
}

function buildMeanderingText(length: number): string {
  const opening = 'It was a quiet morning and the intersection sat empty while the town slept on. ';
  return `${opening}${'a'.repeat(Math.max(0, length - opening.length))}`;
}

/** Only the length group can match here: the formatting groups all need text the fixture has none of. */
function insufficientQualityLengthRuleMatches(
  textLength: number,
  isPost: boolean,
  isLinkpost = false,
): boolean {
  const rule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.insufficientQuality];
  const values: Record<string, ClearerIntroSignalValue> = {
    focusedIsPost: isPost,
    focusedHasLinkpostUrl: isLinkpost,
    focusedPlaintext: '',
    focusedTextLength: textLength,
  };
  return rule.enabled && rule.groups.some(group =>
    group.every(condition => clearerIntroConditionMatches(condition, values))
  );
}

function buildExampleShapedHtml(): string {
  return `<p>${'a'.repeat(100)}........ ${'b'.repeat(100)}.... ${'c'.repeat(100)}....... ${'d'.repeat(1046)}...... ${'e'.repeat(155)}....</p>`;
}

describe('template highlight rules', () => {
  it('applies the formatting and grammar checks to the selected rejection content', () => {
    const messageGroups = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.formattingGrammar].groups;
    const rejectionGroups = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.formatting].groups;
    const selectedContentGroups = messageGroups.map(group => group.map(condition => ({
      ...condition,
      signal: condition.signal === 'contentPlaintexts'
        ? 'focusedPlaintext'
        : 'focusedFormattingParagraphs',
    })));

    expect(rejectionGroups.slice(0, selectedContentGroups.length)).toEqual(selectedContentGroups);
    expect(rejectionGroups).toHaveLength(5);
  });

  it('highlights formatting and insufficient quality for the example content shape', () => {
    const html = buildExampleShapedHtml();
    const formattingRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.formatting];
    const insufficientQualityRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.insufficientQuality];

    expect(formattingSignalValues(html)).toEqual(expect.objectContaining({
      focusedFormattingParagraphCount: 1,
      focusedTextLength: 1534,
      focusedRepeatedPunctuationRunCount: 5,
      focusedLongestFormattingSentenceLength: 1046,
    }));
    expect(formattingRuleMatches(formattingRule, html)).toBe(true);
    expect(formattingRuleMatches(insufficientQualityRule, html)).toBe(true);
  });

  it('highlights insufficient quality for short content, at separate post and comment lengths', () => {
    expect(insufficientQualityLengthRuleMatches(199, false)).toBe(true);
    expect(insufficientQualityLengthRuleMatches(200, false)).toBe(false);
    expect(insufficientQualityLengthRuleMatches(1999, true)).toBe(true);
    expect(insufficientQualityLengthRuleMatches(2000, true)).toBe(false);
    expect(insufficientQualityLengthRuleMatches(1999, true, true)).toBe(false);
  });

  it('applies the structural formatting rules below the overlong-paragraph threshold', () => {
    const formattingRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.formatting];

    expect(formattingRuleMatches(formattingRule, buildRepeatedPunctuationHtml(500, 3))).toBe(true);
    expect(formattingRuleMatches(formattingRule, buildRunOnHtml(600, 500))).toBe(true);
  });

  it('keeps the structural formatting thresholds and single-paragraph guards strict', () => {
    const formattingRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.formatting];
    const multiParagraphRunOn = `${buildRunOnHtml(600, 500)}${buildRunOnHtml(600, 500)}`;

    expect(formattingRuleMatches(formattingRule, buildRepeatedPunctuationHtml(499, 3))).toBe(false);
    expect(formattingRuleMatches(formattingRule, buildRepeatedPunctuationHtml(500, 2))).toBe(false);
    expect(formattingRuleMatches(formattingRule, buildRunOnHtml(599, 500))).toBe(false);
    expect(formattingRuleMatches(formattingRule, buildRunOnHtml(600, 499))).toBe(false);
    expect(formattingRuleMatches(formattingRule, multiParagraphRunOn)).toBe(false);
  });

  it('suggests clearer intro for long unsourced posts without a signposted opening', () => {
    const meandering = buildMeanderingText(3000);

    expect(clearerIntroRuleMatches(meandering, 0)).toBe(true);
    expect(clearerIntroRuleMatches(meandering, 1)).toBe(false);
    expect(clearerIntroRuleMatches(buildMeanderingText(2499), 0)).toBe(false);
    expect(clearerIntroRuleMatches(`TL;DR: traffic lights are interesting. ${meandering}`, 0)).toBe(false);
    expect(clearerIntroRuleMatches(`In this post I argue that ${meandering}`, 0)).toBe(false);
  });

  it('suggests clearer intro for long posts full of distinct grandiose terms', () => {
    const grandiose = `This manifesto offers a new paradigm for the consciousness of humanity. ${'a'.repeat(2500)}`;
    const merelyAmbitious = `A new paradigm for thinking about paradigm shifts in tax policy. ${'a'.repeat(2500)}`;

    expect(clearerIntroRuleMatches(grandiose, 5)).toBe(true);
    expect(clearerIntroRuleMatches(merelyAmbitious, 5)).toBe(false);
  });

  it('copies formatting defaults into insufficient quality while keeping overrides independent', () => {
    const formattingRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.formatting];
    const insufficientQualityRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.insufficientQuality];
    const disabledFormattingRule: HighlightRule = { enabled: false, groups: [] };
    const overrides: HighlightRuleOverrides = {
      actions: {},
      messageTemplates: {},
      rejectionTemplates: {
        [REJECTION_TEMPLATE_IDS.formatting]: disabledFormattingRule,
      },
    };
    const resolved = resolveHighlightRules(DEFAULT_REJECTION_TEMPLATE_RULES, overrides, 'rejectionTemplates');

    expect(insufficientQualityRule.groups.slice(0, formattingRule.groups.length)).toEqual(formattingRule.groups);
    expect(insufficientQualityRule.groups).not.toBe(formattingRule.groups);
    expect(resolved[REJECTION_TEMPLATE_IDS.formatting]).toBe(disabledFormattingRule);
    expect(resolved[REJECTION_TEMPLATE_IDS.insufficientQuality]).toBe(insufficientQualityRule);
  });

  it('expresses username pattern checks as editable regular expressions', () => {
    expect(DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.noOrgUsernames].groups).toEqual([[
      expect.objectContaining({
        signal: 'userDisplayName',
        operator: 'matchesRegex',
        value: '\\b(team|labs?|institute|foundation|research|official|inc|llc|ltd|ventures?|solutions|technologies|capital|group|systems|collective)\\b',
        explanation: expect.any(String),
      }),
    ]]);
  });

  it('expresses formatting and political checks as editable regular expressions', () => {
    expect(DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.formattingGrammar].groups).toHaveLength(3);
    expect(DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.formattingGrammar].groups.flat()
      .every(condition => condition.operator === 'matchesRegexCaseSensitive')).toBe(true);
    expect(DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.politics].groups).toEqual([[
      expect.objectContaining({
        signal: 'contentTitlesAndTexts',
        operator: 'hasAtLeastDistinctRegexMatches',
        value: '\\b(trump|biden|obama|kamala|democrats?|republicans?|left-wing|right-wing|elections?|presidential|congress|senate|immigration|abortion|transgender|woke|israel|gaza|palestine|palestinians?|culture war)\\b',
        minimumMatches: 2,
        explanation: expect.any(String),
      }),
    ]]);
  });

  it('explains every default regex condition and leaves other conditions unexplained', () => {
    const rules = [
      ...Object.values(DEFAULT_MESSAGE_TEMPLATE_RULES),
      ...Object.values(DEFAULT_REJECTION_TEMPLATE_RULES),
    ];
    const conditions = rules.flatMap(rule => [...rule.groups, ...(rule.level2Groups ?? [])]).flat();

    for (const condition of conditions) {
      if (isRegexHighlightOperator(condition.operator)) {
        expect(condition.explanation?.trim()).toBeTruthy();
      } else {
        expect(condition.explanation).toBeUndefined();
      }
    }
  });

  it('has declarative defaults for every formerly code-defined template rule', () => {
    const messageTemplateIds = [
      MESSAGE_TEMPLATE_IDS.noOrgUsernames,
      MESSAGE_TEMPLATE_IDS.makeUsernamePronounceable,
      MESSAGE_TEMPLATE_IDS.politics,
      MESSAGE_TEMPLATE_IDS.formattingGrammar,
      MESSAGE_TEMPLATE_IDS.semiAutomatedQualityInsufficientAi,
      MESSAGE_TEMPLATE_IDS.barelyApprovedAiContent,
      MESSAGE_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch,
    ];
    const rejectionTemplateIds = [
      REJECTION_TEMPLATE_IDS.probablyInsufficientQualityForAiContent,
      REJECTION_TEMPLATE_IDS.insufficientQuality,
      REJECTION_TEMPLATE_IDS.insufficientQualityForAiPosts,
      REJECTION_TEMPLATE_IDS.insufficientQualityForAiComments,
      REJECTION_TEMPLATE_IDS.rokosBasilisk,
      REJECTION_TEMPLATE_IDS.duplicate,
      REJECTION_TEMPLATE_IDS.noFollowupQuestions,
      REJECTION_TEMPLATE_IDS.politicalNorm,
      REJECTION_TEMPLATE_IDS.noLlmCaseStudies,
      REJECTION_TEMPLATE_IDS.llmSycophancyTrap,
      REJECTION_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch,
      REJECTION_TEMPLATE_IDS.missingAiAlignmentBasics,
    ];

    expect(messageTemplateIds.every(templateId => !!DEFAULT_MESSAGE_TEMPLATE_RULES[templateId])).toBe(true);
    expect(rejectionTemplateIds.every(templateId => !!DEFAULT_REJECTION_TEMPLATE_RULES[templateId])).toBe(true);
  });

  it('suggests the AI-quality templates for transformer research posts', () => {
    const aiResearchPostText = [
      'Natural Language Transcoders',
      'The natural language transcoder reads the delta between the input and output of a stack of transformer layers.',
      'For my first experiment, I trained the activation verbalizer and reconstructor.',
      'Below are the final evaluation results on 5,000 held-out examples.',
    ].join(' ');
    const posts = [{ text: aiResearchPostText }];
    const matchingMessageTemplateIds = Object.entries(DEFAULT_MESSAGE_TEMPLATE_RULES)
      .filter(([, rule]) => ruleMatchesPosts(rule, posts))
      .map(([templateId]) => templateId);
    const matchingRejectionTemplateIds = Object.entries(DEFAULT_REJECTION_TEMPLATE_RULES)
      .filter(([, rule]) => ruleMatchesPosts(rule, posts))
      .map(([templateId]) => templateId);

    expect(matchingMessageTemplateIds).toEqual(expect.arrayContaining([
      MESSAGE_TEMPLATE_IDS.semiAutomatedQualityInsufficientAi,
      MESSAGE_TEMPLATE_IDS.barelyApprovedAiContent,
    ]));
    expect(matchingRejectionTemplateIds).toEqual(expect.arrayContaining([
      REJECTION_TEMPLATE_IDS.probablyInsufficientQualityForAiContent,
      REJECTION_TEMPLATE_IDS.insufficientQualityForAiPosts,
      REJECTION_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch,
      REJECTION_TEMPLATE_IDS.missingAiAlignmentBasics,
    ]));
  });

  it('only suggests messaging about vibecoded AI research once two such posts exist and one was rejected', () => {
    const messageRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch];
    const aiResearchPost = (title: string, rejected?: boolean): PostFixture => ({
      text: `${title} I trained a transformer on my own dataset, and the evaluation results are below.`,
      ...(rejected === undefined ? {} : { rejected }),
    });
    const unrelatedPost: PostFixture = { text: 'Notes on my sourdough starter, which has been rejected by nobody.', rejected: true };

    expect(ruleMatchesPosts(messageRule, [aiResearchPost('Transcoders', true)])).toBe(false);
    expect(ruleMatchesPosts(messageRule, [aiResearchPost('Transcoders'), aiResearchPost('Transcoders II')])).toBe(false);
    expect(ruleMatchesPosts(messageRule, [aiResearchPost('Transcoders'), unrelatedPost])).toBe(false);
    expect(ruleMatchesPosts(messageRule, [
      aiResearchPost('Transcoders'),
      aiResearchPost('Transcoders II', true),
    ])).toBe(true);
  });

  it('expresses AI research checks as one condition group', () => {
    const messageRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch];
    const rejectionRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch];

    expect(messageRule.groups).toHaveLength(1);
    expect(messageRule.groups[0]).toEqual([
      expect.objectContaining({
        signal: 'postTitlesAndTexts',
        operator: 'matchesRegexInAtLeastItems',
        minimumMatches: 2,
        value: expect.stringContaining('language models?'),
      }),
      expect.objectContaining({
        signal: 'rejectedPostTitlesAndTexts',
        operator: 'matchesRegex',
        value: expect.stringContaining('experiments?'),
      }),
    ]);
    expect(rejectionRule.groups).toHaveLength(1);
    expect(rejectionRule.groups[0]).toHaveLength(3);
  });

  it('uses the same AI-topic regex for barely approved AI content', () => {
    const generalAiRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.semiAutomatedQualityInsufficientAi];
    const barelyApprovedAiRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.barelyApprovedAiContent];

    expect(barelyApprovedAiRule).toEqual(generalAiRule);
  });

  it('round-trips regex conditions and rejects invalid patterns', () => {
    const regexRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.noOrgUsernames];
    const distinctRegexRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.politics];
    const overrides: HighlightRuleOverrides = {
      actions: {},
      messageTemplates: {
        [MESSAGE_TEMPLATE_IDS.noOrgUsernames]: regexRule,
        [MESSAGE_TEMPLATE_IDS.politics]: distinctRegexRule,
      },
      rejectionTemplates: {},
    };

    expect(parseHighlightRuleOverrides(serializeHighlightRuleOverrides(overrides))).toEqual(overrides);
    expect(() => parseHighlightRuleOverrides({
      actions: {},
      messageTemplates: {
        [MESSAGE_TEMPLATE_IDS.noOrgUsernames]: {
          enabled: true,
          groups: [[{ signal: 'userDisplayName', operator: 'matchesRegex', value: '[' }]],
        },
      },
      rejectionTemplates: {},
    })).toThrow('invalid regex');
    expect(() => parseHighlightRuleOverrides({
      actions: {},
      messageTemplates: {
        [MESSAGE_TEMPLATE_IDS.politics]: {
          enabled: true,
          groups: [[{
            signal: 'contentTitlesAndTexts',
            operator: 'hasAtLeastDistinctRegexMatches',
            value: 'politics?',
          }]],
        },
      },
      rejectionTemplates: {},
    })).toThrow('positive integer minimum match count');
    expect(() => parseHighlightRuleOverrides({
      actions: {},
      messageTemplates: {
        [MESSAGE_TEMPLATE_IDS.noOrgUsernames]: {
          enabled: true,
          groups: [[{
            signal: 'userDisplayName',
            operator: 'matchesRegex',
            value: 'team',
            explanation: 123,
          }]],
        },
      },
      rejectionTemplates: {},
    })).toThrow('needs a text explanation');
  });

  it('migrates legacy name-keyed overrides to template IDs', () => {
    const legacyRule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.formatting];
    const overrides: HighlightRuleOverrides = {
      actions: {},
      messageTemplates: {},
      rejectionTemplates: { Formatting: legacyRule },
    };
    const migrated = migrateLegacyTemplateRuleOverrideKeys(overrides, [{
      _id: REJECTION_TEMPLATE_IDS.formatting,
      name: 'Formatting',
      collectionName: 'Rejections',
    }]);

    expect(migrated.rejectionTemplates).toEqual({
      [REJECTION_TEMPLATE_IDS.formatting]: legacyRule,
    });
  });

  it('extracts formatting paragraphs without combining separate blocks', () => {
    expect(getFormattingParagraphPlaintextsFromHtml('<p>one</p><p>two <strong>three</strong></p>'))
      .toEqual(['one', 'two three']);
    expect(getFormattingParagraphPlaintextsFromHtml('one   two')).toEqual(['one two']);
    expect(getFormattingParagraphPlaintextsFromHtml('one<br>two')).toEqual([]);
  });

  it('measures repeated punctuation and sentence-like runs mechanically', () => {
    expect(getRepeatedPunctuationRunCountFromHtml('<p>Wait... what??? Really!!</p>')).toBe(2);
    expect(getLongestFormattingSentenceLengthFromHtml('<p>short. no-space...continuation?</p>')).toBe(23);
  });
});
