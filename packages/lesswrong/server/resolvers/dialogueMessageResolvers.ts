import { fetchFragmentSingle } from "../fetchFragment";
import { cheerioParse } from "../utils/htmlUtil";
import { defineQuery } from "../utils/serverGraphqlUtil";

const extractLatestDialogueMessages = async (dialogueHtml: string, numMessages: number): Promise<String[]> => {
  if (numMessages <= 0) return Promise.resolve([])
  const $ = cheerioParse(dialogueHtml);
  const messages = $('.dialogue-message');
  return messages.toArray().slice(-numMessages).map(message => $(message).toString());
};

defineQuery({
  name: "latestDialogueMessages",
  resultType: "[String!]",
  argTypes: "(dialogueId: String!, numMessages: Int!)",
  fn: async (_, { dialogueId, numMessages }: { dialogueId: string, numMessages: number }, context: ResolverContext): Promise<String[]> => {
    const dialogue = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentName: "PostsPage",
      selector: {_id: dialogueId},
      currentUser: context.currentUser,
      context,
    });
    if (!dialogue || !dialogue.collabEditorDialogue) return []
    return await extractLatestDialogueMessages(dialogue?.contents?.html ?? "", numMessages);
  }
})
