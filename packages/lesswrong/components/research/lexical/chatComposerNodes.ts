import type { LexicalNodeConfig } from 'lexical';
import { MentionNode } from './MentionNode';

/**
 * Strict subset of `researchEditorNodes` — `AgentBlockNode` is omitted
 * because the chat composer lacks the `ResearchEditorProvider` an
 * AgentBlock requires to render. Pasted HTML containing an AgentBlock
 * falls through `importDOM` to plain text rather than crashing.
 */
export const chatComposerNodes: LexicalNodeConfig[] = [MentionNode];
