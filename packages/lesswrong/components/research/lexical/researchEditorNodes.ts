import type { LexicalNodeConfig } from 'lexical';
import { AgentBlockNode } from './AgentBlockNode';
import { MentionNode } from './MentionNode';
import { QueryInputNode } from './QueryInputNode';
import { QueryInputHeaderNode } from './QueryInputHeaderNode';
import { QueryInputContentNode } from './QueryInputContentNode';
import { ConversationComposerNode } from './ConversationComposerNode';
import { ConversationTranscriptNode } from './ConversationTranscriptNode';
import { ResearchConversationNode } from './ResearchConversationNode';

export const researchEditorNodes: LexicalNodeConfig[] = [
  AgentBlockNode,
  MentionNode,
  QueryInputNode,
  QueryInputHeaderNode,
  QueryInputContentNode,
  ConversationComposerNode,
  ConversationTranscriptNode,
  ResearchConversationNode,
];
