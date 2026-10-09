import "./integrationTestSetup";
import { createDummyPost, createDummyUser } from "./utils";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { updatePost } from "@/server/collections/posts/mutations";
import { createRejectionAppealGqlMutation, updateRejectionAppeal } from "@/server/collections/rejectionAppeals/mutations";
import { sendMessageAs } from "@/server/utils/teamInbox";
import Posts from "@/server/collections/posts/collection";
import Conversations from "@/server/collections/conversations/collection";
import Messages from "@/server/collections/messages/collection";

let mockTeamAccount: DbUser | null = null;

jest.mock("../server/utils/adminTeamAccount", () => ({
  __esModule: true,
  getAdminTeamAccount: async () => mockTeamAccount,
  getAdminTeamAccountId: async () => mockTeamAccount?._id ?? null,
}));

function contextFor(user: DbUser) {
  return computeContextFromUser({ user, isSSR: false });
}

async function rejectPost(post: DbPost, moderator: DbUser) {
  await updatePost({
    data: { rejected: true, rejectedReason: "<p>Low quality</p>" },
    selector: { _id: post._id },
  }, contextFor(moderator));
  const rejectedPost = await Posts.findOne({ _id: post._id });
  if (!rejectedPost?.rejectionConversationId) throw new Error("Rejection didn't record a conversation");
  return rejectedPost;
}

async function getMessageHtmls(conversationId: string) {
  const messages = await Messages.find({ conversationId }, { sort: { createdAt: 1 } }).fetch();
  return messages.map(message => message.contents?.html ?? "");
}

async function getConversation(conversationId: string) {
  const conversation = await Conversations.findOne({ _id: conversationId });
  if (!conversation) throw new Error("Conversation not found");
  return conversation;
}

describe("rejection team inbox", () => {
  let moderator: DbUser;
  let author: DbUser;

  beforeEach(async () => {
    mockTeamAccount = await createDummyUser({ isAdmin: true });
    moderator = await createDummyUser({ groups: ["sunshineRegiment"] });
    author = await createDummyUser();
  });

  it("sends the rejection message from the moderator in a conversation they don't participate in", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    const conversation = await getConversation(post.rejectionConversationId!);
    const messages = await Messages.find({ conversationId: conversation._id }).fetch();

    expect(conversation.moderator).toBe(true);
    expect(conversation.participantIds.sort()).toEqual([author._id, mockTeamAccount!._id].sort());
    expect(messages.map(message => message.userId)).toEqual([moderator._id]);
  });

  it("tracks whether a user reply is awaiting a moderator, without adding replying moderators as participants", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    const conversationId = post.rejectionConversationId!;

    await sendMessageAs({ author, conversationId, html: "<p>Why?</p>", noEmail: true, context: contextFor(author) });
    expect((await getConversation(conversationId)).awaitingModeratorReply).toBe(true);

    const otherModerator = await createDummyUser({ groups: ["sunshineRegiment"] });
    await sendMessageAs({ author: otherModerator, conversationId, html: "<p>Because.</p>", noEmail: true, context: contextFor(otherModerator) });
    const conversation = await getConversation(conversationId);
    expect(conversation.awaitingModeratorReply).toBe(false);
    expect(conversation.participantIds).not.toContain(otherModerator._id);
  });

  it("answers a user's first reply with a link to the appeal page, without taking the reply out of the queue", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    const conversationId = post.rejectionConversationId!;

    await sendMessageAs({ author, conversationId, html: "<p>Why?</p>", noEmail: true, context: contextFor(author) });
    const messagesAfterFirstReply = await Messages.find({ conversationId }, { sort: { createdAt: 1 } }).fetch();
    expect(messagesAfterFirstReply.map(message => message.userId)).toEqual([moderator._id, author._id, mockTeamAccount!._id]);
    expect(messagesAfterFirstReply[2].contents?.html).toContain(`/rejection-review?postId=${post._id}`);
    expect((await getConversation(conversationId)).awaitingModeratorReply).toBe(true);

    await sendMessageAs({ author, conversationId, html: "<p>Hello?</p>", noEmail: true, context: contextFor(author) });
    expect(await Messages.find({ conversationId }).count()).toBe(4);
  });
});

describe("rejection appeals", () => {
  let moderator: DbUser;
  let author: DbUser;

  beforeEach(async () => {
    mockTeamAccount = await createDummyUser({ isAdmin: true });
    moderator = await createDummyUser({ groups: ["sunshineRegiment"] });
    author = await createDummyUser();
  });

  async function appeal(user: DbUser, postId: string) {
    return await createRejectionAppealGqlMutation(undefined, { data: { postId, reasonIds: ["llmWritten"], acknowledgedMisunderstandings: true, explanation: "It was a mistake" } }, contextFor(user));
  }

  it("only lets the author appeal rejected content, once", async () => {
    const unrejectedPost = await createDummyPost(author);
    await expect(appeal(author, unrejectedPost._id)).rejects.toThrow();

    const post = await rejectPost(await createDummyPost(author), moderator);
    await expect(appeal(await createDummyUser(), post._id)).rejects.toThrow();
    await appeal(author, post._id);
    await expect(appeal(author, post._id)).rejects.toThrow();
  });

  it("posts a summary of the appeal into the rejection conversation", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    const { data } = await appeal(author, post._id);

    expect(data?.conversationId).toBe(post.rejectionConversationId);
    const conversation = await getConversation(post.rejectionConversationId!);
    expect(conversation.awaitingModeratorReply).toBe(true);

    // The summary is the user's first message, but it isn't answered with the appeal link
    const htmls = await getMessageHtmls(conversation._id);
    expect(htmls).toHaveLength(2);
    expect(htmls[1]).toContain("Rejection review requested");
    expect(htmls[1]).toContain("It was a mistake");
  });

  it("doesn't allow appeals of content with no rejection message", async () => {
    const post = await createDummyPost(author);
    await Posts.rawUpdateOne({ _id: post._id }, { $set: { rejected: true } });
    await expect(appeal(author, post._id)).rejects.toThrow();
  });

  it("rejects unknown appeal reasons", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    await expect(createRejectionAppealGqlMutation(undefined, {
      data: { postId: post._id, reasonIds: ["notAReason"], acknowledgedMisunderstandings: false, explanation: "It was a mistake" },
    }, contextFor(author))).rejects.toThrow();
  });

  it("unrejects the content when approved", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    const { data } = await appeal(author, post._id);

    const resolvedAppeal = await updateRejectionAppeal({
      selector: { _id: data!._id! },
      data: { status: "approved" },
    }, contextFor(moderator));

    expect(resolvedAppeal.resolvedByUserId).toBe(moderator._id);
    expect((await Posts.findOne({ _id: post._id }))?.rejected).toBe(false);
  });

  it("tells the user the outcome and takes the thread out of the queue when an appeal is resolved", async () => {
    const post = await rejectPost(await createDummyPost(author), moderator);
    const { data } = await appeal(author, post._id);
    expect((await getConversation(post.rejectionConversationId!)).awaitingModeratorReply).toBe(true);

    await updateRejectionAppeal({
      selector: { _id: data!._id! },
      data: { status: "denied" },
    }, contextFor(moderator));

    const messages = await Messages.find({ conversationId: post.rejectionConversationId! }, { sort: { createdAt: 1 } }).fetch();
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.userId).toBe(mockTeamAccount!._id);
    expect(lastMessage.contents?.html).toContain("keeping the original decision");
    expect((await getConversation(post.rejectionConversationId!)).awaitingModeratorReply).toBe(false);
  });
});
