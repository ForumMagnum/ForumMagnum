import schema from "@/lib/collections/workspaceRepos/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { randomId } from "@/lib/random";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import {
  assignUserIdToData,
  getLegacyCreateCallbackProps,
  insertAndReturnCreateAfterProps,
  runFieldOnCreateCallbacks,
} from "@/server/vulcan-lib/mutators";
import { buildRepoInstallSnapshot } from "@/server/research/sandbox/buildRepoInstallSnapshot";
import { repoScopeOf } from "@/server/research/repoUrl";
import { resolveUserSecret } from "@/server/research/userSecretAccess";
import { GITHUB_TOKEN_SECRET } from "@/lib/collections/userSecrets/userSecretNames";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return !!user;
}

/**
 * Long-running create: builds the repo's install-cache snapshot, then inserts
 * the immutable `WorkspaceRepos` row and a `RepoInstallSnapshots` row pointing
 * at the new snapshot. A failure before the WorkspaceRepos insert leaves no
 * partial state; a failure between the two inserts leaves a repo row with no
 * cache snapshot — its first coding conversation would fail to provision, and
 * the user re-creates the repo.
 */
export async function createWorkspaceRepo(
  { data }: CreateWorkspaceRepoInput,
  context: ResolverContext,
) {
  const callbackProps = await getLegacyCreateCallbackProps('WorkspaceRepos', {
    context,
    data,
    schema,
  });
  data = callbackProps.document;
  assignUserIdToData(data, context.currentUser, schema);
  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  // Build the install-cache snapshot before the insert: the WorkspaceRepos row
  // and its snapshot are a unit, and we never want a repo row that points at
  // no snapshot.
  const repo = { host: data.host, owner: data.owner, name: data.name };
  if (!repo.host || !repo.owner || !repo.name) {
    throw new Error("host, owner, and name are required");
  }
  if (!data.defaultBranch || !data.lockfilePath || !data.installCommand || !data.runtime) {
    throw new Error("defaultBranch, runtime, lockfilePath, and installCommand are required");
  }
  if ((data.devCommand ?? null) === null !== ((data.devPort ?? null) === null)) {
    throw new Error("devCommand and devPort must be set together, or both left empty");
  }
  const token = await resolveUserSecret(context, data.userId!, repoScopeOf(repo), GITHUB_TOKEN_SECRET);
  const baseline = await context.SandboxBaselineSnapshots.findOne({ runtime: data.runtime });
  if (!baseline) {
    throw new Error(
      `No baseline snapshot for runtime "${data.runtime}". Build one with ` +
        "`yarn research-supervisor-build && yarn research-sandbox-build-snapshot`.",
    );
  }
  const built = await buildRepoInstallSnapshot({
    repo,
    defaultBranch: data.defaultBranch,
    lockfilePath: data.lockfilePath,
    installCommand: data.installCommand,
    baselineSnapshotId: baseline.vercelSnapshotId,
    token,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'WorkspaceRepos', callbackProps);
  const workspaceRepo = afterCreateProperties.document;

  await context.RepoInstallSnapshots.rawInsert({
    _id: randomId(),
    createdAt: new Date(),
    workspaceRepoId: workspaceRepo._id,
    manifestHash: built.manifestHash,
    vercelSnapshotId: built.vercelSnapshotId,
    sizeBytes: built.sizeBytes,
  });

  return workspaceRepo;
}

export const createWorkspaceRepoGqlMutation = makeGqlCreateMutation('WorkspaceRepos', createWorkspaceRepo, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'WorkspaceRepos', rawResult, context),
});

export const graphqlWorkspaceRepoTypeDefs = gql`
  input CreateWorkspaceRepoDataInput ${ getCreatableGraphQLFields(schema) }

  input CreateWorkspaceRepoInput {
    data: CreateWorkspaceRepoDataInput!
  }

  type WorkspaceRepoOutput {
    data: WorkspaceRepo
  }

  extend type Mutation {
    createWorkspaceRepo(data: CreateWorkspaceRepoDataInput!): WorkspaceRepoOutput
  }
`;
