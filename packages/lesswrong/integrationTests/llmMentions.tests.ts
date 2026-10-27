import { mocked } from "jest-mock";
import assert from "node:assert/strict";
import "./integrationTestSetup";
import { createDummyUser, createDummyPost, createDummyComment } from "./utils";
import { randomId } from "@/lib/random";
import LlmRunTranscriptEntries from "@/server/collections/llmRunTranscriptEntries/collection";
import LlmRuns from "@/server/collections/llmRuns/collection";
import Comments from "@/server/collections/comments/collection";
import Posts from "@/server/collections/posts/collection";
import Notifications from "@/server/collections/notifications/collection";
import Users from "@/server/collections/users/collection";
import { createComment } from "@/server/collections/comments/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { runQuery } from "@/server/vulcan-lib/query";
import { runLlmRun, retryStalledLlmRuns } from "@/server/languageModels/llmRuns";
import { requestLlmRun } from "@/server/languageModels/requestLlmRun";
import { generateLlmRunResponse } from "@/server/languageModels/llmRunResponse";
import { startLlmReplyForComment } from "@/server/llmReplies/startLlmReplies";
import { waitForBackgroundTasks } from "@/server/utils/backgroundTask";

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
  mocked(requestLlmRun).mockReset().mockResolvedValue(undefined);
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
  return { user, post, comment, context, run };
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

test("stale cron snapshot must not overwrite a reply completed meanwhile", async () => {
  const { run } = await createMentionFixture();
  await LlmRuns.rawUpdateOne(run._id, { $set: { createdAt: new Date(Date.now() - 3700000) } });
  const originalFind = LlmRuns.find.bind(LlmRuns);
  jest.spyOn(LlmRuns, "find").mockImplementation((selector, ...rest) => {
    if (!selector?.$or) return originalFind(selector, ...rest);
    return { fetch: async () => {
      const snapshot = await originalFind({ _id: run._id }).fetch();
      await runLlmRun(run._id);
      return snapshot;
    } };
  });
  await retryStalledLlmRuns();
  expect((await LlmRuns.findOne(run._id))?.status).toBe("completed");
});

test("a broken kickoff must not prevent other stalled runs from retrying", async () => {
  const first = await createMentionFixture();
  const second = await createMentionFixture();
  await LlmRuns.rawUpdateOne(first.run._id, { $set: { createdAt: new Date(Date.now() - 180000) } });
  await LlmRuns.rawUpdateOne(second.run._id, { $set: { createdAt: new Date(Date.now() - 180000) } });
  const rows = [await LlmRuns.findOne(first.run._id), await LlmRuns.findOne(second.run._id)];
  const originalFind = LlmRuns.find.bind(LlmRuns);
  jest.spyOn(LlmRuns, "find").mockImplementation((selector, ...rest) => {
    if (selector?.$or) return { fetch: async () => rows };
    return originalFind(selector, ...rest);
  });
  mocked(requestLlmRun).mockClear().mockRejectedValueOnce(new Error("Injected 503"));
  await retryStalledLlmRuns();
  expect(requestLlmRun).toHaveBeenCalledWith(second.run._id);
});

test("eight simultaneous submissions must respect the three-run allowance", async () => {
  const user = await createDummyUser({ karma: 50, isAdmin: false });
  const post = await createDummyPost();
  const baseComment = await createDummyComment(user, { postId: post._id });
  assert(baseComment.contents);
  const contents = baseComment.contents;
  const comments = await Promise.all(Array.from({ length: 8 }, async () => {
    const data = { ...baseComment, _id: randomId(), contents: { ...contents, html: mention } };
    await Comments.rawInsert(data);
    return data;
  }));
  const context = computeContextFromUser({ user, isSSR: false, forumType: "LessWrong" });
  const originalCount = context.repos.llmRuns.countRunsTriggeredByUserSince.bind(context.repos.llmRuns);
  let ready = 0;
  let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  jest.spyOn(context.repos.llmRuns, "countRunsTriggeredByUserSince").mockImplementation(async (...args) => {
    const count = await originalCount(...args);
    if (++ready === 8) release();
    await barrier;
    return count;
  });
  await Promise.all(comments.map(comment => startLlmReplyForComment(comment, context)));
  const count = await originalCount(user._id, new Date(Date.now() - 86400000));
  expect(count).toBe(3);
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

test("deleting the invoking comment during generation must prevent publication", async () => {
  const { run, comment } = await createMentionFixture();
  mocked(generateLlmRunResponse).mockImplementationOnce(async () => {
    await Comments.rawUpdateOne(comment._id, { $set: { deleted: true } });
    return "Generated after the triggering comment was deleted";
  });
  await runLlmRun(run._id);
  const reply = await Comments.findOne({ llmRunId: run._id });
  assert(reply);
  expect(reply.contents?.html).not.toContain("Generated after");
});

test("retrying an unpublished reply reuses the saved answer and transcript", async () => {
  const { run } = await createMentionFixture();
  await LlmRunTranscriptEntries.rawInsert({
    llmRunId: run._id, attempt: 1, index: 0, type: "text", text: "Saved transcript",
    extra: null, query: null, title: null, toolCallId: null, toolName: null, url: null,
  });
  const original = Comments.rawUpdateOne.bind(Comments);
  let failOnce = true;
  jest.spyOn(Comments, "rawUpdateOne").mockImplementation(async (selector, modifier, ...rest) => {
    if (modifier.$set?.llmReplyPublishedAt && failOnce) {
      failOnce = false;
      throw new Error("Injected publication failure");
    }
    return original(selector, modifier, ...rest);
  });
  await runLlmRun(run._id);
  const first = await Comments.findOne({ llmRunId: run._id });
  assert(first);
  expect(first.llmReplyPublishedAt).toBeNull();
  await runLlmRun(run._id);
  const reply = await Comments.findOne({ llmRunId: run._id });
  assert(reply);
  expect(reply.llmReplyPublishedAt).toBeInstanceOf(Date);
  expect(reply.contents?.html).toContain("Successful answer 1");
  expect(generateLlmRunResponse).toHaveBeenCalledTimes(1);
  const result = await runQuery(`query($id: String!) {
    llmRun(selector: { _id: $id }) { result { status transcriptEntries { text } } }
  }`, { id: run._id }, createAnonymousContext({ forumType: "LessWrong" }));
  expect(result.data?.llmRun.result).toEqual({ status: "completed", transcriptEntries: [{ text: "Saved transcript" }] });
});

test("completion failure on the last attempt preserves a published answer", async () => {
  const { run } = await createMentionFixture();
  await LlmRuns.rawUpdateOne(run._id, { $set: { attemptCount: 2 } });
  const original = LlmRuns.rawUpdateOne.bind(LlmRuns);
  let failOnce = true;
  jest.spyOn(LlmRuns, "rawUpdateOne").mockImplementation(async (selector, modifier, ...rest) => {
    if (modifier.$set?.status === "completed" && failOnce) {
      failOnce = false;
      throw new Error("Injected completion failure");
    }
    return original(selector, modifier, ...rest);
  });
  await runLlmRun(run._id);
  const finished = await LlmRuns.findOne(run._id);
  assert(finished);
  expect(finished.status).toBe("completed");
  expect(finished.error).toBeNull();
  expect((await Comments.findOne({ llmRunId: run._id }))?.contents?.html).toContain("Successful answer");
  expect(generateLlmRunResponse).toHaveBeenCalledTimes(1);
});

test("a post made private during generation prevents publication and hides the saved run", async () => {
  const { run, post, context } = await createMentionFixture();
  const generate = mocked(generateLlmRunResponse).getMockImplementation();
  assert(generate);
  mocked(generateLlmRunResponse).mockImplementationOnce(async (...args) => {
    const response = await generate(...args);
    await Posts.rawUpdateOne(post._id, { $set: { onlyVisibleToLoggedIn: true } });
    return response;
  });
  await runLlmRun(run._id);
  expect((await Comments.findOne({ llmRunId: run._id }))?.llmReplyPublishedAt).toBeNull();
  const query = `query($id: String!) { llmRun(selector: { _id: $id }) { result { response } } }`;
  await expect(runQuery(query, { id: run._id }, createAnonymousContext({ forumType: "LessWrong" }))).rejects.toThrow("operation_not_allowed");
  const adminResult = await runQuery(query, { id: run._id }, context);
  expect(adminResult.data?.llmRun.result.response).toContain("Successful answer");
});

test("placeholder insertion that commits then throws leaves a failed reply, not a pending orphan", async () => {
  const original = Comments.rawInsert.bind(Comments);
  jest.spyOn(Comments, "rawInsert").mockImplementation(async (data, ...rest) => {
    const id = await original(data, ...rest);
    if (data.llmRunId) throw new Error("Injected lost placeholder acknowledgement");
    return id;
  });
  const { run, comment } = await createMentionFixture();
  expect(await Comments.findOne(comment._id)).toBeTruthy();
  expect(run.status).toBe("failed");
  expect((await Comments.findOne({ llmRunId: run._id }))?.contents?.html).toContain("couldn't finish");
  expect(requestLlmRun).not.toHaveBeenCalled();
});
