import gql from "graphql-tag";
import { randomId } from "@/lib/random";
import { encryptUserSecret } from "@/server/research/userSecretsCrypto";
import { parseRepoUrl, repoScopeOf } from "@/lib/research/repoUrl";
import { fetchRepoDefaultBranch } from "@/server/research/githubApi";
import { inferWorkspaceRepoConfig } from "@/server/research/workspaceConfigAgent";
import { resolveUserSecret } from "@/server/research/userSecretAccess";
import { GITHUB_TOKEN_SECRET } from "@/lib/collections/userSecrets/userSecretNames";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

export const researchWorkspaceTypeDefs = gql`
  type WorkspaceRepoConfigProposal {
    defaultBranch: String!
    runtime: String!
    lockfilePath: String!
    installCommand: String!
    prepareCommand: String
    devCommand: String
  }

  type DeleteUserSecretOutput {
    success: Boolean!
  }

  extend type Query {
    currentWorkspaceRepos: [WorkspaceRepo!]!
  }

  extend type Mutation {
    deleteUserSecret(_id: String!): DeleteUserSecretOutput
    proposeWorkspaceRepoConfig(repoUrl: String!, githubToken: String): WorkspaceRepoConfigProposal
  }
`;

export const researchWorkspaceQueries = {
  async currentWorkspaceRepos(_root: void, _args: void, context: ResolverContext) {
    const { currentUser } = context;
    if (!currentUser) throw new Error("Not logged in");
    const rows = await context.repos.workspaceRepos.getCurrentByUserId(currentUser._id);
    return await accessFilterMultiple(currentUser, 'WorkspaceRepos', rows, context);
  },
};

export const researchWorkspaceMutations = {
  async deleteUserSecret(
    _root: void,
    args: { _id: string },
    context: ResolverContext,
  ) {
    const { currentUser, UserSecrets } = context;
    if (!currentUser) throw new Error("Not logged in");
    const row = await UserSecrets.findOne({ _id: args._id });
    if (!row || row.userId !== currentUser._id) throw new Error("Secret not found");
    await UserSecrets.rawRemove({ _id: args._id });
    return { success: true };
  },

  /**
   * Run the configuration agent against a repository and return its inferred
   * config for the client to pre-fill the Create Repo form. Stores a supplied
   * GitHub token as a repo-scoped secret. Creates no `WorkspaceRepos` row.
   */
  async proposeWorkspaceRepoConfig(
    _root: void,
    args: { repoUrl: string; githubToken?: string | null },
    context: ResolverContext,
  ) {
    const { currentUser, UserSecrets } = context;
    if (!currentUser) throw new Error("Not logged in");
    const repo = parseRepoUrl(args.repoUrl);
    const repoScope = repoScopeOf(repo);

    if (args.githubToken) {
      const now = new Date();
      const existing = await UserSecrets.findOne({ userId: currentUser._id, name: GITHUB_TOKEN_SECRET, repoScope });
      const encryptedValue = encryptUserSecret(args.githubToken);
      if (existing) {
        await UserSecrets.rawUpdateOne({ _id: existing._id }, { $set: { encryptedValue, updatedAt: now } });
      } else {
        await UserSecrets.rawInsert({
          _id: randomId(),
          userId: currentUser._id,
          repoScope,
          name: GITHUB_TOKEN_SECRET,
          encryptedValue,
          createdAt: now,
        });
      }
    }
    // A token supplied this call is authoritative — no need to read it back.
    const token =
      args.githubToken ??
      (await resolveUserSecret(context, currentUser._id, repoScope, GITHUB_TOKEN_SECRET));

    const defaultBranch = await fetchRepoDefaultBranch(repo, token);
    const config = await inferWorkspaceRepoConfig(repo, defaultBranch, token);
    if (!config) {
      throw new Error("The configuration agent could not infer a config — fill the form in by hand.");
    }
    return config;
  },
};
