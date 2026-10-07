import { useMemo } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';

export const ResearchEnvironmentsByProjectQuery = gql(`
  query ResearchEnvironmentsByProjectQuery($projectId: String!) {
    researchEnvironments(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        label
        sourceEventId
        createdAt
      }
    }
    archivedEnvironments: researchEnvironments(selector: { byProjectArchived: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        label
        sourceEventId
        createdAt
      }
    }
  }
`);

export interface ActiveResearchEnvironmentIds {
  settled: boolean;
  activeIds: Set<string>;
}

export function useActiveResearchEnvironmentIds(projectId: string): ActiveResearchEnvironmentIds {
  const { data } = useQuery(ResearchEnvironmentsByProjectQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  return useMemo(() => ({
    settled: data !== undefined,
    activeIds: new Set((data?.researchEnvironments?.results ?? []).map((environment) => environment._id)),
  }), [data]);
}
