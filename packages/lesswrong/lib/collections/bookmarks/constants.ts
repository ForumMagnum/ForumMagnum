import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';

export const bookmarkableCollectionNames = new TupleSet(["Posts", "Comments", "Sequences", "Collections"] as const);
export type BookmarkableCollectionName = UnionOf<typeof bookmarkableCollectionNames>;
