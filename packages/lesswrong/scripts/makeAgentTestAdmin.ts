import Users from "@/server/collections/users/collection";

/**
 * Dev-only helper: grant the `agent-test` browser-automation account admin
 * (needed for /research) and beta (needed for the Lexical editor).
 * Run via: yarn repl dev lw packages/lesswrong/scripts/makeAgentTestAdmin.ts "makeAgentTestAdmin()"
 */
export async function makeAgentTestAdmin() {
  const user = await Users.findOne({ username: "agent-test" });
  if (!user) {
    // eslint-disable-next-line no-console
    console.log("agent-test user not found — sign it up in the browser first");
    return;
  }
  await Users.rawUpdateOne({ _id: user._id }, { $set: { isAdmin: true, beta: true } });
  // eslint-disable-next-line no-console
  console.log(`agent-test (${user._id}) is now admin+beta`);
}
