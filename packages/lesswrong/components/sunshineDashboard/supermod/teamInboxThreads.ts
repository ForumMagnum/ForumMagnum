import sortBy from 'lodash/sortBy';

export interface TeamInboxThread {
  conversation: TeamInboxConversation;
  appeal: RejectionAppealsModerationInfo | null;
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
  return sortBy([...awaitingReplyThreads, ...repliedAppealThreads], thread => thread.conversation.latestActivity).reverse();
}
