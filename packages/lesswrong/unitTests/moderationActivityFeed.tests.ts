jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: () => ({}), useStyles: () => ({}) }));
jest.mock('@/lib/crud/useQuery', () => ({ useQuery: jest.fn() }));
jest.mock('@/components/common/LWTooltip', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/common/FormatDate', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/common/ForumIcon', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/users/UsersName', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/messaging/ConversationPreview', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/components/sunshineDashboard/UserRateLimitItem', () => ({ getKarmaLiftDescription: jest.fn(), getRateLimitDescription: jest.fn() }));
jest.mock('@/components/sunshineDashboard/supermod/ModeratorNoteComposer', () => ({ __esModule: true, default: jest.fn() }));

import { getActivityItems } from '@/components/sunshineDashboard/supermod/ModerationActivityFeed';
import { REJECTED_POST, REJECTED_COMMENT, SENT_MODERATOR_MESSAGE } from '@/lib/collections/moderatorActions/constants';

const conversation: ConversationsList = {
  _id: 'conversation', title: 'Earlier discussion', participantIds: [], archivedByIds: [],
  participants: [], latestMessage: null, messageCount: 2, moderator: true,
  createdAt: '2026-10-01T12:00:00Z', latestActivity: '2026-10-10T12:00:00Z',
};

function action(_id: string, type: ModeratorActionType, createdAt: string): ModeratorActionDisplay {
  return { _id, type, createdAt, active: false, endedAt: createdAt, userId: 'user', user: null };
}

it('keeps rejection and message events on their own dates when a conversation spans them', () => {
  const moderatorActions = [
    action('rejected-post', REJECTED_POST, '2026-10-02T12:00:00Z'),
    action('rejected-comment', REJECTED_COMMENT, '2026-10-08T12:00:00Z'),
    action('message-sent', SENT_MODERATOR_MESSAGE, '2026-10-01T12:00:00Z'),
  ];
  const user = { moderatorActions, sunshineNotes: null, userRateLimits: [] };
  const now = new Date('2026-10-14T12:00:00Z');

  for (const latestActivity of ['2026-10-10T12:00:00Z', '2026-10-14T12:00:00Z']) {
    const entries = getActivityItems(user, [{ ...conversation, latestActivity }], now, true);
    expect(entries).toHaveLength(4);
    const actionRows = entries.flatMap(({ item }) => item.kind === 'moderatorAction' ? [item] : []);
    expect(actionRows.map(item => ({ id: item.key, date: item.date.toISOString() }))).toEqual([
      { id: 'rejected-comment', date: '2026-10-08T12:00:00.000Z' },
      { id: 'rejected-post', date: '2026-10-02T12:00:00.000Z' },
      { id: 'message-sent', date: '2026-10-01T12:00:00.000Z' },
    ]);
    expect(entries[0].item).toMatchObject({ kind: 'conversation', key: 'conversation', date: new Date(latestActivity) });
  }
});
