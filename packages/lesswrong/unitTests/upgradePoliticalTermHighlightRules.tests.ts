import { upgradePoliticalTermHighlightRules } from '@/server/moderatorHighlights/upgradePoliticalTermHighlightRules';
import {
  emptyHighlightRuleOverrides,
  parseHighlightRuleOverrides,
  type HighlightRule,
} from '@/lib/moderatorHighlights/highlightRuleTypes';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';

const seeded = parseHighlightRuleOverrides(highlightRuleSeed);
const seededMessageRule = seeded.messageTemplates['Politics'];
const seededRejectionRule = seeded.rejectionTemplates['Political norm'];

const withoutPoliticalTermGroups = (rule: HighlightRule): HighlightRule => ({ ...rule, groups: rule.groups.slice(0, -2) });

const templates = [
  { _id: 'politicsMessage', name: 'Politics', collectionName: 'Messages' },
  { _id: 'politicalNorm', name: 'Political norm', collectionName: 'Rejections' },
  { _id: 'quality', name: 'Insufficient quality', collectionName: 'Rejections' },
];

describe('upgrading stored political highlights', () => {
  test('adds the party and country groups to both political templates', () => {
    const overrides = {
      ...emptyHighlightRuleOverrides(),
      messageTemplates: { politicsMessage: withoutPoliticalTermGroups(seededMessageRule) },
      rejectionTemplates: {
        politicalNorm: withoutPoliticalTermGroups(seededRejectionRule),
        quality: withoutPoliticalTermGroups(seededRejectionRule),
      },
    };
    const upgraded = upgradePoliticalTermHighlightRules(overrides, templates);
    expect(upgraded.messageTemplates.politicsMessage).toEqual(seededMessageRule);
    expect(upgraded.rejectionTemplates.politicalNorm).toEqual(seededRejectionRule);
    expect(upgraded.rejectionTemplates.quality).toEqual(withoutPoliticalTermGroups(seededRejectionRule));
    expect(upgradePoliticalTermHighlightRules(upgraded, templates)).toEqual(upgraded);
    expect(overrides.rejectionTemplates.politicalNorm).toEqual(withoutPoliticalTermGroups(seededRejectionRule));
  });

  test('preserves disabled rules and moderator-written groups', () => {
    const customGroup = [{ signal: 'focusedBaseScore', operator: 'lt', value: -10 }] satisfies HighlightRule['groups'][number];
    const overrides = {
      ...emptyHighlightRuleOverrides(),
      rejectionTemplates: { politicalNorm: { enabled: false, groups: [customGroup], level2Groups: [customGroup] } },
    };
    const upgraded = upgradePoliticalTermHighlightRules(overrides, templates);
    expect(upgraded.rejectionTemplates.politicalNorm.enabled).toBe(false);
    expect(upgraded.rejectionTemplates.politicalNorm.groups[0]).toEqual(customGroup);
    expect(upgraded.rejectionTemplates.politicalNorm.groups).toHaveLength(3);
    expect(upgraded.rejectionTemplates.politicalNorm.level2Groups).toEqual([customGroup]);
  });

  test('leaves overrides without a political rule unchanged', () => {
    expect(upgradePoliticalTermHighlightRules(emptyHighlightRuleOverrides(), templates)).toEqual(emptyHighlightRuleOverrides());
  });
});
