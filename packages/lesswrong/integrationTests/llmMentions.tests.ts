import { mocked } from "jest-mock";
import assert from "node:assert/strict";
import "./integrationTestSetup";
import { createDummyUser, createDummyPost, createDummyComment } from "./utils";
import { randomId } from "@/lib/random";
import LlmRunTranscriptEntries from "@/server/collections/llmRunTranscriptEntries/collection";
import LlmRuns from "@/server/collections/llmRuns/collection";
import Comments from "@/server/collections/comments/collection";
import Posts from "@/server/collections/posts/collection";
import Revisions from "@/server/collections/revisions/collection";
import Notifications from "@/server/collections/notifications/collection";
import Users from "@/server/collections/users/collection";
import { createComment, updateComment } from "@/server/collections/comments/mutations";
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
  if (await Users.findOne({ slug: "grok" })) return;
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


async function fixture({ karma = 2000, admin = true, af = false } = {}) {
  const user = await createDummyUser({ isAdmin: admin, karma, isAf: af });
  const post = await createDummyPost(user, { draft: false, af });
  await Revisions.rawUpdateOne(post.contents_latest, { $set: { html: "<p>Synthetic post body: the hidden marker is PERSIMMON-13052.</p>" } });
  const context = computeContextFromUser({ user, isSSR: false, forumType: af ? "AlignmentForum" : "LessWrong" });
  const comment = await createComment({ data: { postId: post._id, af, contents: { originalContents: { type: "html", data: mention } } } }, context);
  const run = await LlmRuns.findOne({ triggerCommentId: comment._id });
  assert(run);
  // Setup finishes before the human's mutation returns; the worker runs later.
  expect(await Comments.find({ llmRunId: run._id }).count()).toBe(1);
  await waitForBackgroundTasks();
  return { user, post, comment, context, run };
}

test("ordinary comment produces one placeholder and a completed reply", async () => {
  const { run, comment } = await fixture();
  expect(run.status).toBe("pending");
  expect(await Comments.find({ llmRunId: run._id }).count()).toBe(1);
  expect(requestLlmRun).toHaveBeenCalledWith(run._id);
  await runLlmRun(run._id);
  await waitForBackgroundTasks();
  const finished = await LlmRuns.findOne(run._id);
  assert(finished);
  const reply = await Comments.findOne({ llmRunId: run._id });
  assert(reply);
  expect(finished.status).toBe("completed");
  expect(reply.contents?.html).toContain("Successful answer");
  expect(reply.parentCommentId).toBe(comment._id);
});

test("80 simultaneous database claims admit exactly one worker", async () => {
  const { run, context } = await fixture();
  const claims = await Promise.all(Array.from({ length: 80 }, () => context.repos.llmRuns.claimRun(run._id, new Date(Date.now() - 900000), 3)));
  expect(claims.filter(Boolean)).toHaveLength(1);
  expect((await LlmRuns.findOne(run._id))?.attemptCount).toBe(1);
});

test("20 duplicate kickoff requests generate only one answer", async () => {
  const { run } = await fixture();
  await Promise.all(Array.from({ length: 20 }, () => runLlmRun(run._id)));
  expect(generateLlmRunResponse).toHaveBeenCalledTimes(1);
  expect((await LlmRuns.findOne(run._id))?.status).toBe("completed");
});

test("stale claims retry but a third attempt is the limit", async () => {
  const { run, context } = await fixture();
  await LlmRuns.rawUpdateOne(run._id, { $set: { status: "running", claimedAt: new Date(Date.now() - 960000), attemptCount: 2 } });
  expect((await context.repos.llmRuns.claimRun(run._id, new Date(Date.now() - 900000), 3))?.attemptCount).toBe(3);
  await LlmRuns.rawUpdateOne(run._id, { $set: { claimedAt: new Date(Date.now() - 960000) } });
  expect(await context.repos.llmRuns.claimRun(run._id, new Date(Date.now() - 900000), 3))?.toBeNull();
});

test("Alignment Forum invocation creates an AF reply in shared data", async () => {
  const { run } = await fixture({ af: true });
  expect((await Comments.findOne({ llmRunId: run._id }))?.af).toBe(true);
  await runLlmRun(run._id);
  expect((await Comments.findOne({ llmRunId: run._id }))?.af).toBe(true);
});

test("draft mentions wait for publication", async () => {
  const user = await createDummyUser({ isAdmin: true });
  const post = await createDummyPost(user);
  const context = computeContextFromUser({ user, isSSR: false, forumType: "LessWrong" });
  const comment = await createComment({ data: {
    postId: post._id, draft: true, contents: { originalContents: { type: "html", data: mention } },
  } }, context);
  await waitForBackgroundTasks();
  expect(await LlmRuns.find({ triggerCommentId: comment._id }).count()).toBe(0);
  await updateComment({ selector: { _id: comment._id }, data: { draft: false } }, context);
  await waitForBackgroundTasks();
  expect(await LlmRuns.find({ triggerCommentId: comment._id }).count()).toBe(1);
});

test("a post made private before execution is not sent to the model", async () => {
  const { run, post } = await fixture();
  await Posts.rawUpdateOne(post._id, { $set: { draft: true } });
  await runLlmRun(run._id);
  expect(generateLlmRunResponse).not.toHaveBeenCalled();
});

test("a failed completion write must not regenerate or notify a published answer twice", async () => {
  const { run } = await fixture();
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
  const first = await fixture();
  const second = await fixture();
  await LlmRuns.rawUpdateOne(first.run._id, { $set: { createdAt: new Date(Date.now() - 180000) } });
  await LlmRuns.rawUpdateOne(second.run._id, { $set: { createdAt: new Date(Date.now() - 3700000) } });
  const originalFind = LlmRuns.find.bind(LlmRuns);
  jest.spyOn(LlmRuns, "find").mockImplementation((selector, ...rest) => {
    if (!selector?.$or) return originalFind(selector, ...rest);
    return { fetch: async () => {
      const snapshot = await originalFind({ _id: { $in: [first.run._id, second.run._id] } }).fetch();
      await runLlmRun(second.run._id);
      return snapshot;
    } };
  });
  await retryStalledLlmRuns();
  const run = await LlmRuns.findOne(second.run._id);
  assert(run);
  expect(run.status).toBe("completed");
});

test("a broken kickoff must not prevent other stalled runs from retrying", async () => {
  const first = await fixture();
  const second = await fixture();
  await LlmRuns.rawUpdateOne(first.run._id, { $set: { createdAt: new Date(Date.now() - 180000) } });
  await LlmRuns.rawUpdateOne(second.run._id, { $set: { createdAt: new Date(Date.now() - 180000) } });
  const rows = [await LlmRuns.findOne(first.run._id), await LlmRuns.findOne(second.run._id)];
  const originalFind = LlmRuns.find.bind(LlmRuns);
  jest.spyOn(LlmRuns, "find").mockImplementation((selector, ...rest) => selector?.$or ? { fetch: async () => rows } : originalFind(selector, ...rest));
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
  expect(count).toBeLessThanOrEqual(3);
});

test("making a post private must not leave its full text in guest run queries", async () => {
  const { run, post } = await fixture();
  await runLlmRun(run._id);
  await Posts.rawUpdateOne(post._id, { $set: { draft: true } });
  const query = `query($id: String!) { llmRun(selector: { _id: $id }) { result { _id contextMessage response transcriptEntries { text } } } }`;
  await expect(runQuery(query, { id: run._id }, createAnonymousContext({ forumType: "LessWrong" }))).rejects.toThrow("operation_not_allowed");
  const result = await runQuery(`{ llmRuns(limit: 1000) { results { _id contextMessage } } }`, {}, createAnonymousContext({ forumType: "LessWrong" }));
  expect(result.data?.llmRuns.results.some((r: { _id: string }) => r._id === run._id)).toBe(false);

});

test("karma and sequential daily quota are enforced before storing a comment", async () => {
  const user = await createDummyUser({ karma: 49, isAdmin: false });
  const post = await createDummyPost();
  const lowContext = computeContextFromUser({ user, isSSR: false, forumType: "LessWrong" });
  const data = { postId: post._id, contents: { originalContents: { type: "markdown", data: "[@Grok](/users/grok?mention=user&model=Grok4.7) Help." } } };
  await expect(createComment({ data }, lowContext)).rejects.toThrow("50 karma");
  expect(await Comments.find({ userId: user._id }).count()).toBe(0);
  await Users.rawUpdateOne(user._id, { $set: { karma: 50 } });
  const context = computeContextFromUser({ user: await Users.findOne(user._id), isSSR: false, forumType: "LessWrong" });
  for (let i = 0; i < 3; i++) {
    await createComment({ data }, context);
    await waitForBackgroundTasks();
  }
  await expect(createComment({ data }, context)).rejects.toThrow("limit of 3");
  expect(await context.repos.llmRuns.countRunsTriggeredByUserSince(user._id, new Date(Date.now() - 86400000))).toBe(3);
});

test("published edits do not create additional model runs", async () => {
  const { comment, context } = await fixture();
  await updateComment({ selector: { _id: comment._id }, data: { contents: { originalContents: { type: "html", data: mention + "Updated question" } } } }, context);
  expect(await LlmRuns.find({ triggerCommentId: comment._id }).count()).toBe(1);
});

test("a failed placeholder keeps the submitted comment and leaves a failed run", async () => {
  const user = await createDummyUser({ isAdmin: true });
  const post = await createDummyPost(user);
  const context = computeContextFromUser({ user, isSSR: false, forumType: "LessWrong" });
  const originalInsert = Comments.rawInsert.bind(Comments);
  jest.spyOn(Comments, "rawInsert").mockImplementation(async (data, ...rest) => {
    if (data.llmRunId) throw new Error("Injected placeholder insertion failure");
    return originalInsert(data, ...rest);
  });
  const saved = await createComment({ data: { postId: post._id, contents: { originalContents: { type: "html", data: mention } } } }, context);
  await waitForBackgroundTasks();
  const comments = await Comments.find({ postId: post._id, userId: user._id }).fetch();
  const runs = await LlmRuns.find({ triggerCommentId: { $in: comments.map(c => c._id) } }).fetch();
  expect(comments).toHaveLength(1);
  expect(comments[0]._id).toBe(saved._id);
  expect(runs).toHaveLength(1);
  expect(runs[0].status).toBe("failed");
  expect(runs[0].error).toContain("placeholder insertion failure");
});

test("deleting the invoking comment during generation must prevent publication", async () => {
  const { run, comment } = await fixture();
  mocked(generateLlmRunResponse).mockImplementationOnce(async () => {
    await Comments.rawUpdateOne(comment._id, { $set: { deleted: true } });
    return "Generated after the triggering comment was deleted";
  });
  await runLlmRun(run._id);
  const reply = await Comments.findOne({ llmRunId: run._id });
  assert(reply);
  expect(reply.contents?.html).not.toContain("Generated after");
});

test.each([false, true])("publication failure (write committed: %s) reuses the saved answer", async (committed) => {
  const { run } = await fixture();
  await LlmRunTranscriptEntries.rawInsert({
    llmRunId: run._id, attempt: 1, index: 0, type: "text", text: "Saved transcript",
    extra: null, query: null, title: null, toolCallId: null, toolName: null, url: null,
  });
  const original = Comments.rawUpdateOne.bind(Comments);
  let failOnce = true;
  jest.spyOn(Comments, "rawUpdateOne").mockImplementation(async (selector, modifier, ...rest) => {
    if (modifier.$set?.llmReplyPublishedAt && failOnce) {
      failOnce = false;
      if (committed) await original(selector, modifier, ...rest);
      throw new Error("Injected publication failure");
    }
    return original(selector, modifier, ...rest);
  });
  await runLlmRun(run._id);
  const first = await Comments.findOne({ llmRunId: run._id });
  assert(first);
  expect(!!first.llmReplyPublishedAt).toBe(committed);
  await runLlmRun(run._id);
  const reply = await Comments.findOne({ llmRunId: run._id });
  assert(reply);
  expect(reply.llmReplyPublishedAt).toBeInstanceOf(Date);
  expect(reply.contents?.html).toContain("Successful answer 1");
  expect(generateLlmRunResponse).toHaveBeenCalledTimes(1);
  if (committed) expect(reply.contents_latest).toBe(first.contents_latest);
  const result = await runQuery(`query($id: String!) {
    llmRun(selector: { _id: $id }) { result { status transcriptEntries { text } } }
  }`, { id: run._id }, createAnonymousContext({ forumType: "LessWrong" }));
  expect(result.data?.llmRun.result).toEqual({ status: "completed", transcriptEntries: [{ text: "Saved transcript" }] });
});

test.each([false, true])("completion failure on the last attempt (write committed: %s) preserves publication", async (committed) => {
  const { run } = await fixture();
  await LlmRuns.rawUpdateOne(run._id, { $set: { attemptCount: 2 } });
  const original = LlmRuns.rawUpdateOne.bind(LlmRuns);
  let failOnce = true;
  jest.spyOn(LlmRuns, "rawUpdateOne").mockImplementation(async (selector, modifier, ...rest) => {
    if (modifier.$set?.status === "completed" && failOnce) {
      failOnce = false;
      if (committed) await original(selector, modifier, ...rest);
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
  const { run, post, context } = await fixture();
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

test("a missing placeholder cannot stop recovery of the next run", async () => {
  const first = await fixture();
  const second = await fixture();
  await Comments.rawRemove({ llmRunId: first.run._id });
  await LlmRuns.rawUpdateOne(first.run._id, { $set: { attemptCount: 3, createdAt: new Date(0) } });
  const rows = [await LlmRuns.findOne(first.run._id), second.run];
  const originalFind = LlmRuns.find.bind(LlmRuns);
  jest.spyOn(LlmRuns, "find").mockImplementation((selector, ...rest) => selector?.$or ? { fetch: async () => rows } : originalFind(selector, ...rest));
  mocked(requestLlmRun).mockClear();
  await retryStalledLlmRuns();
  expect((await LlmRuns.findOne(first.run._id))?.status).toBe("failed");
  expect(requestLlmRun).toHaveBeenCalledWith(second.run._id);
});

test("placeholder insertion that commits then throws leaves a failed reply, not a pending orphan", async () => {
  const original = Comments.rawInsert.bind(Comments);
  jest.spyOn(Comments, "rawInsert").mockImplementation(async (data, ...rest) => {
    const id = await original(data, ...rest);
    if (data.llmRunId) throw new Error("Injected lost placeholder acknowledgement");
    return id;
  });
  const { run, comment } = await fixture();
  expect(await Comments.findOne(comment._id)).toBeTruthy();
  expect(run.status).toBe("failed");
  expect((await Comments.findOne({ llmRunId: run._id }))?.contents?.html).toContain("couldn't finish");
  expect(requestLlmRun).not.toHaveBeenCalled();
});

test("a failed initial kickoff leaves a pending run for cron to recover", async () => {
  mocked(requestLlmRun).mockRejectedValueOnce(new Error("Injected kickoff failure"));
  const { run } = await fixture();
  expect(run.status).toBe("pending");
  await LlmRuns.rawUpdateOne(run._id, { $set: { createdAt: new Date(Date.now() - 180000) } });
  mocked(requestLlmRun).mockClear();
  await retryStalledLlmRuns();
  expect(requestLlmRun).toHaveBeenCalledWith(run._id);
});
