import type { StreamStatus } from './hooks/useConversationStream';

export interface ResearchChatSubmitState {
  conversationId: string | null;
  streamStatus: StreamStatus;
  turnInFlight: boolean;
}

export function shouldInterruptBeforeResearchChatSend({
  conversationId,
  streamStatus,
  turnInFlight,
}: ResearchChatSubmitState): boolean {
  if (!conversationId) return false;

  return turnInFlight || (
    streamStatus === 'connecting' ||
    streamStatus === 'streaming' ||
    streamStatus === 'reconnecting'
  );
}

