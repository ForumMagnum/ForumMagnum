'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import type { SupermodQueueChangesQueryQuery } from '@/lib/generated/gql-codegen/graphql';

const SupermodQueueChangesQuery = gql(`
  query SupermodQueueChangesQuery($userIds: [String!]!, $postIds: [String!]!, $since: Date!) {
    supermodQueueChanges(userIds: $userIds, postIds: $postIds, since: $since) {
      documentId
      moderatorName
      lastChangedAt
    }
  }
`);

const POLL_INTERVAL_MS = 10_000;

export type ConcurrentModeratorChange = SupermodQueueChangesQueryQuery['supermodQueueChanges'][number];

export const ConcurrentModeratorChangesContext = createContext<Partial<Record<string, ConcurrentModeratorChange[]>>>({});

export function useConcurrentModeratorChanges(userIds: string[], postIds: string[], since: Date): Partial<Record<string, ConcurrentModeratorChange[]>> {
  const skip = userIds.length + postIds.length === 0;
  const { data, refetch } = useQuery(SupermodQueueChangesQuery, {
    variables: { userIds, postIds, since },
    skip,
    ssr: false,
    fetchPolicy: 'network-only',
    pollInterval: POLL_INTERVAL_MS,
    skipPollAttempt: () => document.hidden,
  });

  useEffect(() => {
    if (skip) return;
    const handleVisibilityChange = () => {
      if (!document.hidden) void refetch();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [skip, refetch]);

  return useMemo(() => groupBy(data?.supermodQueueChanges ?? [], change => change.documentId), [data]);
}

export function useConcurrentModeratorChangesFor(documentId: string): ConcurrentModeratorChange[] {
  return useContext(ConcurrentModeratorChangesContext)[documentId] ?? [];
}
