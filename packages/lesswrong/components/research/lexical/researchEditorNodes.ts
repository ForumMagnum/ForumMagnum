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
