import highlightRulesJson from './highlightRules.json';
import { parseHighlightRuleOverrides, type HighlightRuleOverrides } from './highlightRuleTypes';

export const HIGHLIGHT_RULES_FILE_PATH = 'packages/lesswrong/lib/moderatorHighlights/highlightRules.json';

export const highlightRuleOverrides: HighlightRuleOverrides = parseHighlightRuleOverrides(highlightRulesJson);
