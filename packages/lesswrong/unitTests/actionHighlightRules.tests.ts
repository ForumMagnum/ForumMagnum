import { DEFAULT_ACTION_HIGHLIGHT_RULES } from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import { booleanCondition, numberCondition } from '@/components/sunshineDashboard/supermod/declarativeHighlightRules';

describe('default moderator action highlight rules', () => {
  it('only highlights Purge for users with at most three contents and no approved content', () => {
    expect(DEFAULT_ACTION_HIGHLIGHT_RULES.purge.groups).toEqual([[
      numberCondition('contentCount', 'lte', 3),
      numberCondition('approvedContentCount', 'eq', 0),
    ]]);
  });

  it('keeps the permissions toggle highlighted after all permissions are disabled', () => {
    expect(DEFAULT_ACTION_HIGHLIGHT_RULES.disablePermissions.groups).toEqual([
      [numberCondition('rejectedContentCount', 'gte', 2)],
      [booleanCondition('mostRecentContentIsRejected', true)],
    ]);
  });
});
