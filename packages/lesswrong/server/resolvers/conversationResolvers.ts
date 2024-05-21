import { defineMutation } from "../utils/serverGraphqlUtil";

defineMutation({
  name: "markConversationRead",
  resultType: "Boolean!",
  argTypes: "(conversationId: String!)",
  fn: async (_, {conversationId}: {conversationId: string }, {currentUser, repos}) => {
    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }
    await repos.conversations.markConversationRead(conversationId, currentUser._id);
    return true;
  }
});
