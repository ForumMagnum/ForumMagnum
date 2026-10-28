import { mocked } from "jest-mock";
import assert from "node:assert/strict";
import "./integrationTestSetup";
import { createDummyUser, createDummyPost } from "./utils";
import LlmRuns from "@/server/collections/llmRuns/collection";
import Comments from "@/server/collections/comments/collection";
import Posts from "@/server/collections/posts/collection";
import Notifications from "@/server/collections/notifications/collection";
import Users from "@/server/collections/users/collection";
import { createComment } from "@/server/collections/comments/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { runQuery } from "@/server/vulcan-lib/query";
import { runLlmRun } from "@/server/languageModels/llmRuns";
import { generateLlmRunResponse } from "@/server/languageModels/llmRunResponse";
import { waitForBackgroundTasks } from "@/server/utils/backgroundTask";
import { llmMentionsEnabledSetting } from "@/lib/llmReplies/llmMentions";

jest.mock("@/server/languageModels/requestLlmRun", () => ({ requestLlmRun: jest.fn(async () => {}) }));
jest.mock("@/server/languageModels/llmRunResponse", () => ({ generateLlmRunResponse: jest.fn() }));

const mention = '<p><a href="/users/grok?mention=user&model=Grok4.7">@Grok</a> Explain Bayes.</p>';

beforeAll(async () => {
  process.env.LLM_REPLIES_AI_GATEWAY_API_KEY = "isolated-test-no-network";
  const modelUser = await createDummyUser({ displayName: "Grok", username: "testGrok" });
  await Users.rawUpdateOne(modelUser._id, { $set: { slug: "grok" } });
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(llmMentionsEnabledSetting, "get").mockReturnValue(true);
  mocked(generateLlmRunResponse).mockReset().mockImplementation(async (run, options) => {
    const response = `Successful answer ${mocked(generateLlmRunResponse).mock.calls.length}`;
    await LlmRuns.rawUpdateOne(run._id, { $set: { contextMessage: options.contextMessage, response } });
    return response;
  });
});

async function createMentionFixture() {
  const user = await createDummyUser({ isAdmin: true });
  const post = await createDummyPost(user, { draft: false });
  const context = computeContextFromUser({ user, isSSR: false, forumType: "LessWrong" });
  const comment = await createComment({ data: { postId: post._id, contents: { originalContents: { type: "html", data: mention } } } }, context);
  const run = await LlmRuns.findOne({ triggerCommentId: comment._id });
  assert(run);
  expect(await Comments.find({ llmRunId: run._id }).count()).toBe(1);
  await waitForBackgroundTasks();
  return { post, run };
}

test("a failed completion write must not regenerate or notify a published answer twice", async () => {
  const { run } = await createMentionFixture();
  const original = LlmRuns.rawUpdateOne.bind(LlmRuns);
  let failOnce = true;
  jest.spyOn(LlmRuns, "rawUpdateOne").mockImplementation(async (selector, modifier, ...rest) => {
    if (modifier.$set?.status === "completed" && failOnce) {
      failOnce = false;
      throw new Error("Injected database disconnect after comment publication");
    }
    return original(selector, modifier, ...rest);
  });
  await runLlmRun(run._id);
  await waitForBackgroundTasks();
  const first = await Comments.findOne({ llmRunId: run._id });
  assert(first);
  const firstNotifications = await Notifications.find({ documentId: first._id }).count();
  expect(firstNotifications).toBeGreaterThan(0);
  await runLlmRun(run._id);
  await waitForBackgroundTasks();
  const second = await Comments.findOne({ llmRunId: run._id });
  assert(second);
  expect(generateLlmRunResponse).toHaveBeenCalledTimes(1);
  expect(second.contents?.html).toBe(first.contents?.html);
  expect(second.contents_latest).toBe(first.contents_latest);
  expect(await Notifications.find({ documentId: second._id }).count()).toBe(firstNotifications);
  expect((await LlmRuns.findOne(run._id))?.status).toBe("completed");
});

test("making a post private must not leave its full text in guest run queries", async () => {
  const { run, post } = await createMentionFixture();
  await runLlmRun(run._id);
  await Posts.rawUpdateOne(post._id, { $set: { draft: true } });
  const query = `query($id: String!) { llmRun(selector: { _id: $id }) { result { _id contextMessage response transcriptEntries { text } } } }`;
  await expect(runQuery(query, { id: run._id }, createAnonymousContext({ forumType: "LessWrong" }))).rejects.toThrow("operation_not_allowed");
  const result = await runQuery(`{ llmRuns(limit: 1000) { results { _id contextMessage } } }`, {}, createAnonymousContext({ forumType: "LessWrong" }));
  expect(result.data?.llmRuns.results).not.toContainEqual(expect.objectContaining({ _id: run._id }));
});
