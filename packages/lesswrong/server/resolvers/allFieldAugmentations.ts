import { postResolvers } from "./postResolvers";
import { commentResolvers } from "./commentResolvers";
import { userResolvers } from "./userResolvers";
import { tagResolvers, tagRelResolvers } from "./tagResolvers";
import { jargonTermResolvers } from "./jargonResolvers/jargonTermResolvers";
import { llmConversationResolvers } from "./llmConversationsResolvers";
import { multiDocumentResolvers } from "./multiDocumentResolvers";
import { reviewWinnerArtResolvers } from "./reviewWinnerArtResolvers";
import { revisionResolvers } from "./revisionResolvers";
import { allSchemas } from "@/lib/schema/allOldSchemas";

export const allFieldAugmentations = {
  Posts: postResolvers,
  Comments: commentResolvers,
  Users: userResolvers,
  Tags: tagResolvers,
  TagRels: tagRelResolvers,
  JargonTerms: jargonTermResolvers,
  LlmConversations: llmConversationResolvers,
  MultiDocuments: multiDocumentResolvers,
  ReviewWinnerArts: reviewWinnerArtResolvers,
  Revisions: revisionResolvers,
};

// TODO: figure out how to do something less horrible than this.
export const augmentSchemas = (() => {
  let augmented = false;
  return () => {
    if (augmented) return;
    augmented = true;
    for (const collectionName in allFieldAugmentations) {
      const schema: SchemaType<CollectionNameString> = allSchemas[collectionName as CollectionNameString];
      const schemaAugmentations: Record<string, CollectionFieldSpecification<AnyBecauseHard>> = allFieldAugmentations[collectionName as keyof typeof allFieldAugmentations];
      if (schemaAugmentations) {
        for (const fieldName in schemaAugmentations) {
          schema[fieldName] = { ...schema[fieldName], ...schemaAugmentations[fieldName] };
        }
      }
    }
  }
})();
