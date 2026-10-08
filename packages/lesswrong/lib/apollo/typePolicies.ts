import type { TypePolicies, Reference } from '@apollo/client';

/**
 * Shared Apollo `InMemoryCache` field policies, applied to every cache instance
 * (the client cache and the per-request SSR caches) so the cache reconciles
 * identically across render contexts.
 */
export const apolloTypePolicies: TypePolicies = {
  Query: {
    fields: {
      researchConversationTranscript: {
        // One cache entry per conversation, shared by the three writers that
        // populate a transcript: the initial recent-window load, older-page
        // `loadOlder` fetches (scroll-up), and live SSE appends. Collapsing the
        // `before`/`limit` arg variants onto `conversationId` is what lets those
        // sources coalesce instead of each owning a separate list.
        keyArgs: ['conversationId'],
        // Union by `seq` — an append-only, monotonic key — keeping the list in
        // seq order. Because a network result is merged (not substituted), a
        // refetch can never drop events another writer added; that substitution
        // was the replay loop where an idle refetch wiped the live-streamed tail
        // and re-armed the stream. Events are immutable once persisted, so a
        // grow-only union never surfaces stale data.
        //
        // `existing` is already seq-sorted (this merge's own prior output) and
        // `incoming` is small — one live SSE event, or one fetched page — so we
        // dedupe+sort only `incoming` and linear-merge it in, rather than
        // re-sorting the whole (potentially thousands-long) list on every write.
        merge(
          existing: readonly Reference[] | undefined,
          incoming: readonly Reference[],
          { readField },
        ) {
          const ex = existing ?? [];

          const incomingBySeq = new Map<number, Reference>();
          for (const ref of incoming) {
            incomingBySeq.set(readField<number>('seq', ref) ?? -1, ref);
          }
          if (incomingBySeq.size === 0) return ex;
          const inc = [...incomingBySeq.values()].sort(
            (a, b) => (readField<number>('seq', a) ?? -1) - (readField<number>('seq', b) ?? -1),
          );

          // Two-pointer union of two ascending-by-seq lists; on equal seq the
          // incoming (freshly fetched) row replaces its cached twin.
          const merged: Reference[] = [];
          let i = 0;
          let j = 0;
          while (i < ex.length && j < inc.length) {
            const exSeq = readField<number>('seq', ex[i]) ?? -1;
            const incSeq = readField<number>('seq', inc[j]) ?? -1;
            if (exSeq < incSeq) merged.push(ex[i++]);
            else if (exSeq > incSeq) merged.push(inc[j++]);
            else { merged.push(inc[j++]); i++; }
          }
          while (i < ex.length) merged.push(ex[i++]);
          while (j < inc.length) merged.push(inc[j++]);
          return merged;
        },
      },
    },
  },
};
