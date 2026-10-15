import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';

export interface TeamInboxThread {
  conversation: TeamInboxConversation;
  appeal: RejectionAppealsModerationInfo | null;
}

/** A thread needs a moderator while the user is waiting on a reply or a rejection review is undecided */
export function isTeamInboxThreadOpen({ conversation, appeal }: TeamInboxThread): boolean {
  return !!conversation.awaitingModeratorReply || appeal?.status === 'open';
}

/** Open threads, longest-waiting first */
export function sortOpenTeamInboxThreads(threads: TeamInboxThread[]): TeamInboxThread[] {
  return sortBy(threads, thread => thread.conversation.latestActivity);
}

/** Done threads, most recent activity first */
export function sortDoneTeamInboxThreads(threads: TeamInboxThread[]): TeamInboxThread[] {
  return sortBy(threads, thread => thread.conversation.latestActivity).reverse();
}

export function getTeamInboxThreads(
  awaitingReplyConversations: TeamInboxConversation[],
  openAppeals: RejectionAppealsModerationInfo[],
): TeamInboxThread[] {
  const awaitingReplyThreads = awaitingReplyConversations.map(conversation => ({
    conversation,
    appeal: openAppeals.find(appeal => appeal.conversation?._id === conversation._id) ?? null,
  }));
  const repliedAppealThreads = openAppeals.flatMap(appeal => (
    appeal.conversation && !awaitingReplyConversations.some(conversation => conversation._id === appeal.conversation?._id)
      ? [{ conversation: appeal.conversation, appeal }]
      : []
  ));
  return sortOpenTeamInboxThreads([...awaitingReplyThreads, ...repliedAppealThreads]);
}

/**
 * Combines newly loaded done conversations with the done threads we already
 * have, leaving out any that are open.
 */
export function mergeDoneTeamInboxThreads(
  doneConversations: DoneTeamInboxConversation[],
  existingDoneThreads: TeamInboxThread[],
  openThreads: TeamInboxThread[],
): TeamInboxThread[] {
  const openIds = new Set(openThreads.map(thread => thread.conversation._id));
  const loadedThreads = doneConversations.map(conversation => ({ conversation, appeal: conversation.rejectionAppeal }));
  const threads = uniqBy([...loadedThreads, ...existingDoneThreads], thread => thread.conversation._id)
    .filter(thread => !openIds.has(thread.conversation._id));
  return sortDoneTeamInboxThreads(threads);
}
