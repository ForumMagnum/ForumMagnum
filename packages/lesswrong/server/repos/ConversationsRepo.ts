import AbstractRepo from "./AbstractRepo";
import Conversations from "../../lib/collections/conversations/collection";

export default class ConversationsRepo extends AbstractRepo<DbConversation> {
  constructor() {
    super(Conversations);
  }

  moveUserConversationsToNewUser(oldUserId: string, newUserId: string): Promise<null> {
    return this.none(`
      UPDATE "Conversations"
      SET "participantIds" = ARRAY_APPEND(ARRAY_REMOVE("participantIds", $1), $2)
      WHERE ARRAY_POSITION("participantIds", $1) IS NOT NULL
    `, [oldUserId, newUserId]);
  }
}
