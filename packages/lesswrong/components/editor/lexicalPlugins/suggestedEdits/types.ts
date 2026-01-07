export type SuggestionType = 'insertion' | 'deletion' | 'replacement';

export interface SuggestionThreadComment {
  _id: string;
  authorUserId: string;
  authorName: string;
  createdAtMs: number;
  body: string;
  deleted?: boolean;
}

export interface SuggestionMeta {
  suggestionId: string;
  suggestionType: SuggestionType;
  authorUserId: string;
  authorName: string;
  createdAtMs: number;
  groupId?: string;
  thread?: SuggestionThreadComment[];
}

export function createSuggestionId(): string {
  // Collision-resistant enough for client-side IDs; stored in JSON and replicated via Yjs.
  // We avoid crypto here to keep this browser-compatible in all environments.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

