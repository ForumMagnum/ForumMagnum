import { createPostgresView } from "./postgresView";

export const conversationUnreadMessagesView = createPostgresView(
  "ConversationUnreadMessages",
  `CREATE OR REPLACE VIEW "ConversationUnreadMessages" AS
    SELECT q."conversationId", q."userId", EXISTS (
      SELECT *
      FROM "Notifications" n
      INNER JOIN "Messages" m ON
        n."userId" = q."userId"
        AND n."documentId" = m."_id"
        AND n."documentType" = 'message'
        AND n."emailed" IS NOT TRUE
        AND n."waitingForBatch" IS NOT TRUE
        AND n."deleted" IS NOT TRUE
        AND n."viewed" IS NOT TRUE
        AND m."conversationId" = q."conversationId"
      ) "hasUnreadMessages"
    FROM (
      SELECT "_id" "conversationId", UNNEST("participantIds") "userId"
      FROM "Conversations"
    ) q
  `,
  [],
  undefined,
  [
    {type: "collection", name: "Notifications"},
    {type: "collection", name: "Messages"},
  ],
);
