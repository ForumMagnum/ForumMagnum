import { TupleSet, UnionOf } from '@/lib/utils/typeGuardUtils';

export const bookmarkableCollectionNames = new TupleSet(["Posts", "Comments", "Sequences"] as const);
export type BookmarkableCollectionName = UnionOf<typeof bookmarkableCollectionNames>;
