'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import groupBy from 'lodash/groupBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import type { SupermodQueueChangesQueryQuery } from '@/lib/generated/gql-codegen/graphql';

const SupermodQueueChangesQuery = gql(`
  query SupermodQueueChangesQuery($documentIds: [String!]!, $since: Date!) {
    supermodQueueChanges(documentIds: $documentIds, since: $since) {
      documentId
      moderatorName
      fieldNames
      lastChangedAt
    }
  }
`);

const POLL_INTERVAL_MS = 30_000;

export type ConcurrentModeratorChange = SupermodQueueChangesQueryQuery['supermodQueueChanges'][number];

export const ConcurrentModeratorChangesContext = createContext<Partial<Record<string, ConcurrentModeratorChange[]>>>({});

/** Polls for changes other moderators have made to the given users/posts since the inbox loaded */
export function useConcurrentModeratorChanges(documentIds: string[]): Partial<Record<string, ConcurrentModeratorChange[]>> {
  const [since] = useState(() => new Date());
  const { data } = useQuery(SupermodQueueChangesQuery, {
    variables: { documentIds, since },
    skip: documentIds.length === 0,
    ssr: false,
    fetchPolicy: 'network-only',
    pollInterval: POLL_INTERVAL_MS,
    skipPollAttempt: () => document.hidden,
  });
  return useMemo(() => groupBy(data?.supermodQueueChanges ?? [], change => change.documentId), [data]);
}

export function useConcurrentModeratorChangesFor(documentId: string): ConcurrentModeratorChange[] {
  return useContext(ConcurrentModeratorChangesContext)[documentId] ?? [];
}
