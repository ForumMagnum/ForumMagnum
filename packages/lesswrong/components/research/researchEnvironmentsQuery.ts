import { gql } from '@/lib/generated/gql-codegen';

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
