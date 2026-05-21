import { gql } from '@/lib/generated/gql-codegen';

export const CurrentWorkspaceReposQuery = gql(`
  query ResearchCurrentWorkspaceReposQuery {
    currentWorkspaceRepos {
      _id
      host
      owner
      name
      defaultBranch
      runtime
      lockfilePath
      installCommand
      prepareCommand
      devCommand
      createdAt
    }
  }
`);
