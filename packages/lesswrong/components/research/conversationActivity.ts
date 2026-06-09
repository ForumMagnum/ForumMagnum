import type { StreamStatus } from './hooks/useConversationStream';

interface ConversationActivityState {
  status: StreamStatus;
  turnInFlight: boolean;
}

export function shouldShowAgentActivity({ status, turnInFlight }: ConversationActivityState): boolean {
  if (turnInFlight) return true;
  return status === 'connecting' || status === 'streaming' || status === 'reconnecting';
}
