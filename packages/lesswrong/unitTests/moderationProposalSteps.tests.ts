import {
  parseProposalSteps,
  validateProposalSteps,
  describeProposalStepParts,
  type ModerationProposalStep,
} from '@/lib/collections/moderationProposals/proposalSteps';

describe('proposalStepSchema', () => {
  test('accepts a valid multi-step plan', () => {
    const result = validateProposalSteps([
      { action: 'rejectContent', documentId: 'abc', collectionName: 'Comments', rejectedReason: '<p>Spam</p>' },
      { action: 'setContentPermission', permission: 'posting', disabled: true, note: 'repeat spam' },
      { action: 'banUser', months: 3 },
    ]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.steps).toHaveLength(3);
    }
  });

  test('rejects plans with more than one queue-terminal step', () => {
    const result = validateProposalSteps([
      { action: 'approveUser' },
      { action: 'banUser', months: 1 },
    ]);
    expect(result.valid).toBe(false);
  });

  test('rejects unknown actions and missing parameters', () => {
    expect(validateProposalSteps([{ action: 'purgeUser' }]).valid).toBe(false);
    expect(validateProposalSteps([{ action: 'snooze' }]).valid).toBe(false);
    expect(validateProposalSteps([]).valid).toBe(false);
    expect(validateProposalSteps('not an array').valid).toBe(false);
  });

  test('parseProposalSteps maps malformed entries to null without rejecting the rest', () => {
    const parsed = parseProposalSteps([
      { action: 'approveUser' },
      { action: 'nonsense' },
      { action: 'snooze', contentCount: 5 },
    ]);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]?.action).toBe('approveUser');
    expect(parsed[1]).toBeNull();
    expect(parsed[2]?.action).toBe('snooze');
  });

  test('describeProposalStepParts labels every action', () => {
    const steps: ModerationProposalStep[] = [
      { action: 'approveUser' },
      { action: 'approveCurrentContentOnly' },
      { action: 'snooze', contentCount: 10 },
      { action: 'removeFromQueue' },
      { action: 'rejectContentAndRemoveFromQueue', documentId: 'a', collectionName: 'Posts', rejectedReason: 'r' },
      { action: 'rejectContentAndRemoveFromQueue', documentId: 'a', collectionName: 'Posts', rejectedReason: 'r', messageHtml: '<p>m</p>' },
      { action: 'rejectContent', documentId: 'a', collectionName: 'Comments', rejectedReason: 'r' },
      { action: 'unrejectContent', documentId: 'a', collectionName: 'Comments' },
      { action: 'banUser', months: 6 },
      { action: 'flagUser', flagged: true },
      { action: 'setContentPermission', permission: 'voting', disabled: true },
      { action: 'setRateLimit', type: 'allComments', intervalUnit: 'days', intervalLength: 1, actionsPerInterval: 3 },
      { action: 'sendModeratorMessage', subject: 's', messageHtml: '<p>m</p>' },
      { action: 'appendSunshineNote', note: 'n' },
    ];
    for (const step of steps) {
      expect(describeProposalStepParts(step).length).toBeGreaterThan(0);
    }
    // Composite actions decompose into their semantic parts
    expect(describeProposalStepParts({ action: 'rejectContentAndRemoveFromQueue', documentId: 'a', collectionName: 'Posts', rejectedReason: 'r', messageHtml: '<p>m</p>' })).toHaveLength(4);
    expect(describeProposalStepParts({ action: 'rejectContentAndRemoveFromQueue', documentId: 'a', collectionName: 'Posts', rejectedReason: 'r' })).toHaveLength(2);
    expect(describeProposalStepParts({ action: 'approveUser' })).toHaveLength(2);
  });
});
