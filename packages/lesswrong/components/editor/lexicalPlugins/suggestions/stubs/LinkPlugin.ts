import type { LinkNode } from '@lexical/link';
import type { TextNode } from 'lexical';
import { createCommand } from 'lexical';

export type LinkChangePayload = {
  linkNode: LinkNode | null;
  url: string | null;
  linkTextNode: TextNode | null;
  text: string | null;
};

export const LINK_CHANGE_COMMAND = createCommand<LinkChangePayload>('SUGGESTION_STUB_LINK_CHANGE_COMMAND');
