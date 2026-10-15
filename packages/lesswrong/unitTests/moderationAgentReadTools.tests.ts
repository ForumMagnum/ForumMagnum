import { print } from "graphql";
import { createAdminContext, createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import * as queries from "@/server/vulcan-lib/query";
import * as sqlClient from "@/server/sql/sqlClient";
import { moderationReadTools } from "@/server/moderation/agentTools/readTools";

jest.mock("@/server/vulcan-lib/query", () => ({ runQuery: jest.fn() }));
jest.mock("@/server/sql/sqlClient", () => ({ getSqlClientOrThrow: jest.fn() }));
jest.mock("@/server/sqlConnection", () => ({
  ...jest.requireActual<typeof import("@/server/sqlConnection")>("@/server/sqlConnection"),
  createSqlConnection: jest.fn(() => {
    throw new Error("Unit tests must not access the database");
  }),
}));

const queryMock = jest.spyOn(queries, "runQuery");
const sqlClientMock = jest.spyOn(sqlClient, "getSqlClientOrThrow");
const actualQueries = jest.requireActual<typeof import("@/server/vulcan-lib/query")>("@/server/vulcan-lib/query");

function getTool(name: string) {
  const tool = moderationReadTools.find(tool => tool.name === name);
  if (!tool) throw new Error(`Missing moderation tool: ${name}`);
  return tool;
}

const findAltAccountsTool = getTool("find_alt_accounts");
const getModeratorDmMessagesTool = getTool("get_moderator_dm_messages");
const getModeratorDmsTool = getTool("get_moderator_dms");
const readDocumentBodyTool = getTool("read_document_body");

function message(_id: string, html = "<p>A message</p>") {
  return {
    _id,
    userId: "author",
    user: { _id: "author", displayName: "Author" },
    createdAt: "2026-10-14T00:00:00Z",
    contents: { _id: `${_id}_contents`, html, version: "1.0.0" },
  };
}

describe("moderation agent read tools", () => {
  beforeEach(() => {
    queryMock.mockReset();
    sqlClientMock.mockReset();
  });

  it.each(moderationReadTools)("$name refuses non-moderators before reading content", async tool => {
    await expect(tool.execute({}, createAnonymousContext()))
      .rejects.toThrow("Moderator access required");
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("uses the real access filter to reject another user's draft comment", async () => {
    const context = createAdminContext();
    if (!context.currentUser) throw new Error("Expected test user");
    context.currentUser._id = "moderator";
    context.currentUser.isAdmin = false;
    context.currentUser.groups = ["sunshineRegiment"];
    context.loaders.Comments.load = jest.fn().mockResolvedValue({ _id: "draft-comment", userId: "author", draft: true });
    queryMock.mockImplementation(actualQueries.runQuery);
    actualQueries.setOnGraphQLError(() => {});

    try {
      await expect(readDocumentBodyTool.execute({ documentId: "draft-comment", collectionName: "Comments" }, context))
        .rejects.toThrow("app.operation_not_allowed");
    } finally {
      actualQueries.setOnGraphQLError(null);
    }
  });

  it("uses the real contents resolver's published pointer and explicit version selection", async () => {
    const context = createAdminContext();
    const published = { _id: "published-revision", html: "<p>Published text</p>", version: "1.0.0" };
    const draft = { _id: "newer-autosave", html: "<p>Unpublished text</p>", version: "1.0.1", draft: true };
    const older = { _id: "older-revision", html: "<p>Older text</p>", version: "0.9.0" };
    context.loaders.Posts.load = jest.fn().mockResolvedValue({ _id: "post", contents_latest: "published-revision" });
    const loadRevision = jest.fn().mockResolvedValue(published);
    context.loaders.Revisions.load = loadRevision;
    const findRevision = jest.spyOn(context.Revisions, "findOne").mockImplementation(jest.fn().mockResolvedValue(draft));
    queryMock.mockImplementation(actualQueries.runQuery);

    try {
      const result = JSON.parse(await readDocumentBodyTool.execute({ documentId: "post", collectionName: "Posts" }, context));
      expect(result.bodyMarkdown).toBe("Published text");
      expect(result.version).toBe("1.0.0");
      expect(loadRevision).toHaveBeenCalledWith("published-revision");
      expect(findRevision).not.toHaveBeenCalled();

      findRevision.mockImplementation(jest.fn().mockResolvedValue(older));
      const previous = JSON.parse(await readDocumentBodyTool.execute({ documentId: "post", collectionName: "Posts", version: "0.9.0" }, context));
      expect(previous.bodyMarkdown).toBe("Older text");
      expect(findRevision).toHaveBeenCalledWith({ documentId: "post", fieldName: "contents", version: "0.9.0" });
    } finally {
      findRevision.mockRestore();
    }
  });

  it("pages by actual words without gaps and keeps the requested revision", async () => {
    queryMock.mockResolvedValue({ data: { post: { result: {
      _id: "post",
      contents: { _id: "revision", html: "<p>A extraordinarilylongword Z</p>", version: "1.0.0" },
    } } } });
    const context = createAdminContext();
    const args = { documentId: "post", collectionName: "Posts", version: "1.0.0", maxWords: 1 };
    const first = JSON.parse(await readDocumentBodyTool.execute(args, context));
    const second = JSON.parse(await readDocumentBodyTool.execute({ ...args, offsetWords: first.nextOffsetWords }, context));
    const third = JSON.parse(await readDocumentBodyTool.execute({ ...args, offsetWords: second.nextOffsetWords }, context));

    expect(first).toMatchObject({ totalWords: 3, nextOffsetWords: 1, bodyMarkdown: "A " });
    expect(second.bodyMarkdown).toBe("extraordinarilylongword ");
    expect(third).toMatchObject({ bodyMarkdown: "Z", hasMore: false, nextOffsetWords: null });
    expect(first.bodyMarkdown + second.bodyMarkdown + third.bodyMarkdown).toBe("A extraordinarilylongword Z");
    expect(queryMock).toHaveBeenLastCalledWith(expect.anything(), { documentId: "post", version: "1.0.0" }, context);
    await expect(readDocumentBodyTool.execute({ ...args, maxWords: 20001 }, context))
      .rejects.toThrow("Invalid arguments for read_document_body");
    expect(queryMock).toHaveBeenCalledTimes(3);
  });

  it("enforces the existing IP resolver's admin restriction for moderators", async () => {
    const context = createAdminContext();
    if (!context.currentUser) throw new Error("Expected test user");
    context.currentUser.isAdmin = false;
    context.currentUser.groups = ["sunshineRegiment"];

    queryMock.mockImplementation(actualQueries.runQuery);
    actualQueries.setOnGraphQLError(() => {});
    try {
      await expect(findAltAccountsTool.execute({ ipAddress: "192.0.2.1" }, context))
        .rejects.toThrow("Only admins can see IP address information");
    } finally {
      actualQueries.setOnGraphQLError(null);
    }
  });

  it("returns recent conversations with separate conversation and message continuation offsets", async () => {
    queryMock
      .mockResolvedValueOnce({ data: { conversations: {
        results: [{ _id: "recent", title: "Recent conversation", createdAt: "2026-10-14", latestActivity: "2026-10-14" }],
        totalCount: 25,
      } } })
      .mockResolvedValueOnce({ data: { messages: { results: [message("newest"), message("previous")], totalCount: 205 } } });
    const result = JSON.parse(await getModeratorDmsTool.execute({ userId: "target", offset: 20, limit: 1 }, createAdminContext()));

    expect(result).toMatchObject({ offset: 20, totalCount: 25, nextOffset: 21, hasMore: true });
    expect(result.conversations[0]).toMatchObject({ _id: "recent", totalCount: 205, nextOffset: 2, hasMore: true });
    expect(result.conversations[0].messages.map((item: { _id: string }) => item._id)).toEqual(["previous", "newest"]);
    const [query, variables] = queryMock.mock.calls[0];
    expect(typeof query === "string" ? query : print(query)).toContain("moderatorConversations: {userId: $userId, showArchive: true}");
    expect(variables).toMatchObject({ offset: 20, limit: 1 });
  });

  it("refuses to list messages from a non-moderator conversation", async () => {
    queryMock.mockResolvedValueOnce({ data: { conversation: { result: { _id: "private", moderator: false } } } });
    await expect(getModeratorDmMessagesTool.execute({ conversationId: "private" }, createAdminContext()))
      .rejects.toThrow("Moderator conversation not found or not accessible");
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-moderator message through the real document and contents resolvers", async () => {
    const context = createAdminContext();
    const conversation = { _id: "private", participantIds: ["author", "recipient"], moderator: false };
    context.loaders.Messages.load = jest.fn().mockResolvedValue({
      _id: "message", conversationId: "private", userId: "author",
      contents: { html: "<p>Private message</p>", version: "1.0.0", originalContents: null },
    });
    context.loaders.Conversations.load = jest.fn().mockResolvedValue(conversation);
    const findConversation = jest.spyOn(context.Conversations, "findOne").mockImplementation(jest.fn().mockResolvedValue(conversation));
    queryMock.mockImplementation(actualQueries.runQuery);
    try {
      await expect(readDocumentBodyTool.execute({ documentId: "message", collectionName: "Messages" }, context))
        .rejects.toThrow("Moderator conversation not found or not accessible");
    } finally {
      findConversation.mockRestore();
    }
  });

  it("keeps the real total count on a short page after an offset", async () => {
    const context = createAdminContext();
    const conversation = { _id: "conversation", participantIds: ["moderator", "author"], moderator: true };
    context.loaders.Conversations.load = jest.fn().mockResolvedValue(conversation);
    const row = { ...message("oldest"), conversationId: "conversation" };
    context.loaders.Users.load = jest.fn().mockResolvedValue(row.user);
    const fetchRows = jest.fn().mockResolvedValue([row]);
    sqlClientMock.mockImplementation(jest.fn().mockReturnValue({ any: fetchRows }));
    const count = jest.fn().mockResolvedValue(201);
    const findMessages = jest.spyOn(context.Messages, "find").mockImplementation(jest.fn().mockReturnValue({ count }));
    const findConversation = jest.spyOn(context.Conversations, "findOne").mockImplementation(jest.fn().mockResolvedValue(conversation));
    queryMock.mockImplementation(actualQueries.runQuery);
    try {
      const result = JSON.parse(await getModeratorDmMessagesTool.execute({ conversationId: "conversation", offset: 200 }, context));
      expect(result).toMatchObject({ totalCount: 201, offset: 200, nextOffset: null, hasMore: false });
      expect(result.messages[0]._id).toBe("oldest");
      expect(count).toHaveBeenCalledTimes(1);
      expect(fetchRows).toHaveBeenCalledTimes(1);
    } finally {
      findMessages.mockRestore();
      findConversation.mockRestore();
    }
  });
});
