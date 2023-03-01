import { userCanUseTags } from "../../lib/betas";
import { userCanVoteOnTag } from "../../lib/voting/tagRelVoteRules";
import { getCollectionHooks } from "../mutationCallbacks";
import { taggingNameSetting } from "../../lib/instanceSettings";
import { Posts } from "../../lib/collections/posts";

getCollectionHooks("TagRels").createBefore.add(async (_, {currentUser, newDocument}) => {
  const {tagId, postId} = newDocument;

  if (!userCanUseTags(currentUser) || !currentUser || !tagId) {
    throw new Error(`You do not have permission to add this ${taggingNameSetting.get()}`);
  }

  const canVoteOnTag = await userCanVoteOnTag(currentUser, tagId, postId, {Posts});
  if (canVoteOnTag.fail) {
    throw new Error(`You do not have permission to add this ${taggingNameSetting.get()}`);
  }

  return newDocument;
});
