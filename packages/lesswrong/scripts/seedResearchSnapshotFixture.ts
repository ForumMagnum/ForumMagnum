import ResearchEnvironments from "@/server/collections/researchEnvironments/collection";
import Users from "@/server/collections/users/collection";
import { randomId } from "@/lib/random";

/**
 * Dev-only: insert a fake snapshot (ResearchEnvironment) for the agent-test
 * account so the sidebar's snapshot management UI can be exercised without
 * running a live sandbox. Run from the sandbox worktree:
 * yarn repl dev lw packages/lesswrong/scripts/seedResearchSnapshotFixture.ts "seedResearchSnapshotFixture('<projectId>')"
 */
export async function seedResearchSnapshotFixture(projectId: string) {
  const user = await Users.findOne({ username: "agent-test" });
  if (!user) {
    // eslint-disable-next-line no-console
    console.log("agent-test user not found");
    return;
  }
  const _id = randomId();
  await ResearchEnvironments.rawInsert({
    _id,
    userId: user._id,
    projectId,
    label: `Fixture snapshot ${_id.slice(0, 5)}`,
    vercelSnapshotId: `fixture-${_id}`,
    sourceEventId: null,
    createdAt: new Date(),
  });
  // eslint-disable-next-line no-console
  console.log(`Seeded snapshot ${_id} for project ${projectId}`);
}
