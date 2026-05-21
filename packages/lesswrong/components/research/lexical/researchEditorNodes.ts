import type { LexicalNodeConfig } from 'lexical';
import { AgentBlockNode } from './AgentBlockNode';
import { MentionNode } from './MentionNode';
import { QueryInputNode } from './QueryInputNode';
import { QueryInputHeaderNode } from './QueryInputHeaderNode';
import { QueryInputContentNode } from './QueryInputContentNode';

export const researchEditorNodes: LexicalNodeConfig[] = [
  AgentBlockNode,
  MentionNode,
  QueryInputNode,
  QueryInputHeaderNode,
  QueryInputContentNode,
];

/**
 * Strict subset of `researchEditorNodes` — `AgentBlockNode` is omitted
 * because the chat composer lacks the `ResearchEditorProvider` an
 * AgentBlock requires to render. Pasted HTML containing an AgentBlock
 * falls through `importDOM` to plain text rather than crashing.
 */
export const chatComposerNodes: LexicalNodeConfig[] = [MentionNode];
