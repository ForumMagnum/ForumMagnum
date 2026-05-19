import schema from "@/lib/collections/workspaceRepos/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import { WorkspaceReposViews } from "@/lib/collections/workspaceRepos/views";
import gql from "graphql-tag";

export const graphqlWorkspaceRepoQueryTypeDefs = gql`
  type WorkspaceRepo ${ getAllGraphQLFields(schema) }

  input SingleWorkspaceRepoInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleWorkspaceRepoOutput {
    result: WorkspaceRepo
  }

  input WorkspaceRepoSelector {
    myRepos: EmptyViewInput
  }

  input MultiWorkspaceRepoInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiWorkspaceRepoOutput {
    results: [WorkspaceRepo!]!
    totalCount: Int
  }

  extend type Query {
    workspaceRepo(
      selector: SelectorInput
    ): SingleWorkspaceRepoOutput
    workspaceRepos(
      selector: WorkspaceRepoSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiWorkspaceRepoOutput
  }
`;

export const workspaceRepoGqlQueryHandlers = getDefaultResolvers('WorkspaceRepos', WorkspaceReposViews);
export const workspaceRepoGqlFieldResolvers = getFieldGqlResolvers('WorkspaceRepos', schema);
