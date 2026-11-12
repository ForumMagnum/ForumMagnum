import type { HighlightCondition, HighlightRule, HighlightRuleOverrides, HighlightRuleTemplateReference } from '@/lib/moderatorHighlights/highlightRuleTypes';

export const POLITICAL_PARTY_PATTERN = '\\b(?:Democratic Party|Democrats?|Republican Party|Republicans?|GOP|MAGA|Labour Party|Conservative Party|Tories|Tory|Liberal Democrats|Lib Dems|Reform UK|SNP|Liberal Party|NDP|Australian Labor Party|CDU|CSU|SPD|AfD|FDP|Die Linke|National Rally|Front National|La France Insoumise|BJP|Bharatiya Janata|Aam Aadmi|Likud|Fidesz|Law and Justice|United Russia|Chinese Communist Party|CCP|Liberal Democratic Party|Communist Party)\\b';

export const COUNTRY_PATTERN = '(?:\\b(?:United States|USA|US|America|United Kingdom|UK|Britain|Great Britain|England|Scotland|Wales|Ireland|Canada|Mexico|Brazil|Argentina|Venezuela|Colombia|Chile|Cuba|Haiti|France|Germany|Italy|Spain|Portugal|Netherlands|Belgium|Switzerland|Austria|Sweden|Norway|Denmark|Finland|Poland|Hungary|Czechia|Greece|Romania|Serbia|Croatia|Ukraine|Russia|Belarus|Turkey|Israel|Palestine|Gaza|Lebanon|Syria|Iraq|Iran|Saudi Arabia|Yemen|Egypt|Libya|Sudan|Ethiopia|Somalia|Nigeria|Kenya|South Africa|Rwanda|Morocco|Algeria|Tunisia|Afghanistan|Pakistan|India|Bangladesh|Sri Lanka|Myanmar|Thailand|Vietnam|Cambodia|Indonesia|Malaysia|Singapore|Philippines|China|Taiwan|Hong Kong|Japan|South Korea|North Korea|Korea|Australia|New Zealand)\\b|U\\.S\\.A?\\.?|U\\.K\\.)';

const PARTY_EXPLANATION = 'A post names a mainstream political party, such as the Democrats, Republicans, Tories, Labour Party, AfD, BJP, or Likud.';

const COUNTRY_EXPLANATION = 'A post names a country, such as the US, China, Russia, Israel, or Ukraine.';

type PoliticalRuleCategory = 'messageTemplates' | 'rejectionTemplates';

function patternCondition(signal: string, pattern: string, explanation: string): HighlightCondition {
  return { signal, operator: 'matchesRegexCaseSensitive', value: pattern, explanation };
}

function politicalTermGroups(category: PoliticalRuleCategory): HighlightCondition[][] {
  if (category === 'messageTemplates') {
    return [
      [patternCondition('postTitlesAndTexts', POLITICAL_PARTY_PATTERN, PARTY_EXPLANATION)],
      [patternCondition('postTitlesAndTexts', COUNTRY_PATTERN, COUNTRY_EXPLANATION)],
    ];
  }
  const isPost: HighlightCondition = { signal: 'focusedIsPost', operator: 'isTrue', value: null };
  return [
    [isPost, patternCondition('focusedTitleAndText', POLITICAL_PARTY_PATTERN, PARTY_EXPLANATION)],
    [isPost, patternCondition('focusedTitleAndText', COUNTRY_PATTERN, COUNTRY_EXPLANATION)],
  ];
}

/** Either pattern counts, so dropping just the noisier half of the pair sticks. */
function alreadyChecksPoliticalTerms(rule: HighlightRule): boolean {
  return rule.groups.some(group => group.some(condition =>
    condition.value === POLITICAL_PARTY_PATTERN || condition.value === COUNTRY_PATTERN
  ));
}

function upgradeCategory(
  rules: Record<string, HighlightRule>,
  category: PoliticalRuleCategory,
  templates: HighlightRuleTemplateReference[],
): Record<string, HighlightRule> {
  const collectionName = category === 'messageTemplates' ? 'Messages' : 'Rejections';
  const upgraded = { ...rules };
  for (const template of templates) {
    if (template.collectionName !== collectionName || !template.name.toLowerCase().includes('politic')) continue;
    const rule = upgraded[template._id];
    // Additive, so the existing two-distinct-terms group and any edits to it survive.
    if (!rule || alreadyChecksPoliticalTerms(rule)) continue;
    upgraded[template._id] = { ...rule, groups: [...rule.groups, ...politicalTermGroups(category)] };
  }
  return upgraded;
}

export function upgradePoliticalTermHighlightRules(
  overrides: HighlightRuleOverrides,
  templates: HighlightRuleTemplateReference[],
): HighlightRuleOverrides {
  return {
    ...overrides,
    messageTemplates: upgradeCategory(overrides.messageTemplates, 'messageTemplates', templates),
    rejectionTemplates: upgradeCategory(overrides.rejectionTemplates, 'rejectionTemplates', templates),
  };
}
