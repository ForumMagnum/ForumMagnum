import AbstractRepo from "./AbstractRepo";
import Conversations from "../../server/collections/conversations/collection";
import keyBy from "lodash/keyBy";
import { recordPerfMetrics } from "./perfMetricWrapper";

class ConversationsRepo extends AbstractRepo<"Conversations"> {
  constructor() {
    super(Conversations);
  }

  moveUserConversationsToNewUser(oldUserId: string, newUserId: string): Promise<null> {
    return this.none(`
      -- ConversationsRepo.moveUserConversationsToNewUser
      UPDATE "Conversations"
      SET "participantIds" = ARRAY_APPEND(ARRAY_REMOVE("participantIds", $1), $2)
      WHERE ARRAY_POSITION("participantIds", $1) IS NOT NULL
    `, [oldUserId, newUserId]);
  }

  async getLatestMessages(conversationIds: string[]): Promise<(DbMessage | null)[]> {
    const messages = await this.getRawDb().manyOrNone<DbMessage>(`
      -- ConversationsRepo.getLatestMessages
      SELECT m.*
      FROM "Messages" m
      JOIN (
          SELECT "conversationId", MAX("createdAt") AS max_createdAt
          FROM "Messages"
          WHERE "conversationId" IN ($1:csv)
          GROUP BY "conversationId"
      ) sq
      ON m."conversationId" = sq."conversationId" AND m."createdAt" = sq.max_createdAt;
    `, [conversationIds]);
    
    const messagesByConversation = keyBy(messages, m => m.conversationId);
    return conversationIds.map(id => messagesByConversation[id] ?? null);
  }

  /** The first user message after the last staff or team-bot reply, batched across the inbox. */
  async getModeratorReplyWaitingSince(conversationIds: string[], teamAccountId: string | null): Promise<(Date | null)[]> {
    const results = await this.getRawDb().manyOrNone<{
      conversationId: string;
      waitingSince: Date;
    }>(`
      -- ConversationsRepo.getModeratorReplyWaitingSince
      WITH messages AS (
        SELECT m."_id", m."conversationId", m."createdAt",
          (u."isAdmin" IS TRUE
            OR COALESCE('sunshineRegiment' = ANY(u."groups"), FALSE)
            OR u."_id" IS NOT DISTINCT FROM $(teamAccountId)) AS "isStaff"
        FROM "Messages" m
        JOIN "Users" u ON u."_id" = m."userId"
        WHERE m."conversationId" IN ($(conversationIds:csv))
      ), last_reply AS (
        SELECT DISTINCT ON ("conversationId") "conversationId", "createdAt", "_id"
        FROM messages
        WHERE "isStaff"
        ORDER BY "conversationId", "createdAt" DESC, "_id" DESC
      )
      SELECT m."conversationId", MIN(m."createdAt") AS "waitingSince"
      FROM messages m
      LEFT JOIN last_reply r ON r."conversationId" = m."conversationId"
      WHERE NOT m."isStaff"
        AND (r."_id" IS NULL OR (m."createdAt", m."_id") > (r."createdAt", r."_id"))
      GROUP BY m."conversationId"
    `, { conversationIds, teamAccountId });
    const byConversation = keyBy(results, result => result.conversationId);
    return conversationIds.map(id => byConversation[id]?.waitingSince ?? null);
  }

  async getReadStatuses(
    userId: string,
    conversationIds: string[],
  ): Promise<boolean[]> {
    const results = await this.getRawDb().manyOrNone<{
      conversationId: string,
      hasUnreadMessages: boolean,
    }>(`
      -- ConversationsRepo.getReadStatuses
      SELECT
        c."_id" AS "conversationId",
        EXISTS (
          SELECT 1
          FROM "Notifications" n
          INNER JOIN "Messages" m ON
            n."documentId" = m."_id"
            AND n."documentType" = 'message'
            AND n."userId" = $2
            AND m."conversationId" = c."_id"
          WHERE
            n."emailed" IS NOT TRUE
            AND n."waitingForBatch" IS NOT TRUE
            AND n."deleted" IS NOT TRUE
            AND n."viewed" IS NOT TRUE
        ) AS "hasUnreadMessages"
      FROM "Conversations" c
      WHERE c."_id" IN ($1:csv)
    `, [conversationIds, userId]);
    const statusesByConversation = keyBy(results, (res) => res.conversationId);
    return conversationIds.map(
      (id) => statusesByConversation[id]?.hasUnreadMessages ?? false,
    );
  }

  async markConversationRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.getRawDb().none(`
      UPDATE "Notifications" AS n
      SET "viewed" = TRUE
      FROM "Messages" AS m
      WHERE
        m."conversationId" = $1 AND
        n."documentId" = m."_id" AND
        n."userId" = $2 AND
        n."type" = 'newMessage' AND
        n."documentType" = 'message' AND
        n."emailed" IS NOT TRUE AND
        n."waitingForBatch" IS NOT TRUE AND
        n."deleted" IS NOT TRUE
    `, [conversationId, userId]);
  }
}

recordPerfMetrics(ConversationsRepo);

export default ConversationsRepo;
