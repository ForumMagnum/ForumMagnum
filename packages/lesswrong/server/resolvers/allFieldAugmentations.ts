import { postResolvers } from "./postResolvers";
import { commentResolvers } from "./commentResolvers";
import { userResolvers } from "./userResolvers";
import { tagResolvers, tagRelResolvers } from "./tagResolvers";
import { jargonTermResolvers } from "./jargonResolvers/jargonTermResolvers";
import { llmConversationResolvers } from "./llmConversationsResolvers";
import { multiDocumentResolvers } from "./multiDocumentResolvers";
import { revisionResolvers } from "./revisionResolvers";

export const allFieldAugmentations = {
  Posts: postResolvers,
  Comments: commentResolvers,
  Users: userResolvers,
  Tags: tagResolvers,
  TagRels: tagRelResolvers,
  JargonTerms: jargonTermResolvers,
  LlmConversations: llmConversationResolvers,
  MultiDocuments: multiDocumentResolvers,
  Revisions: revisionResolvers,
};
