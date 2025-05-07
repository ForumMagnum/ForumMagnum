import gql from "graphql-tag";
import { fetchFragmentSingle } from "../fetchFragment";
import { cheerioParse } from "../utils/htmlUtil";
import { PostsPage } from "@/lib/collections/posts/fragments";

const extractLatestDialogueMessages = async (dialogueHtml: string, numMessages: number): Promise<String[]> => {
  if (numMessages <= 0) return Promise.resolve([])
  const $ = cheerioParse(dialogueHtml);
  const messages = $('.dialogue-message');
  return messages.toArray().slice(-numMessages).map(message => $(message).toString());
};

export const dialogueMessageGqlTypeDefs = gql`
  extend type Query {
    latestDialogueMessages(dialogueId: String!, numMessages: Int!): [String!]
  }
`

export const dialogueMessageGqlQueries = {
  async latestDialogueMessages (_: void, { dialogueId, numMessages }: { dialogueId: string, numMessages: number }, context: ResolverContext): Promise<String[]> {
    const dialogue = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsPage,
      selector: {_id: dialogueId},
      currentUser: context.currentUser,
      context,
    });
    if (!dialogue || !dialogue.collabEditorDialogue) return []
    return await extractLatestDialogueMessages(dialogue?.contents?.html ?? "", numMessages);
  }
}
