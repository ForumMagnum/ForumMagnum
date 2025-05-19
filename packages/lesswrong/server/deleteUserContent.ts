import Comments from "../server/collections/comments/collection";
import Posts from "../server/collections/posts/collection";
import Users from "../server/collections/users/collection";
import { getAdminTeamAccount } from "./utils/adminTeamAccount";
import { exportUserData } from "./exportUserData";
import { sleep } from "../lib/utils/asyncUtils";
import { createAdminContext } from "./vulcan-lib/createContexts";
import { updateComment } from "./collections/comments/mutations";
import { updatePost } from "./collections/posts/mutations";
import { noDeletionPmReason } from "@/lib/collections/comments/constants";

/**
 * Please ensure that we know that the user is who they say they are!
 * Exported to allow running manually with "yarn repl"
 */
export const deleteUserContent = async (
  selector: {_id?: string, slug?: string, email?: string},
  outfile?: string,
) => {
  if (!selector._id && !selector.slug && !selector.email) {
    throw new Error("Must specify either an _id, slug or email");
  }

  if (outfile) {
    await exportUserData(selector, outfile);
  }

  const user = await Users.findOne(selector);
  if (!user) {
    throw new Error("User not found: " + JSON.stringify(selector));
  }

  const userId = user._id;

  const userComments = await Comments.find({ userId, deleted: false }).fetch();

  if (userComments.length > 1000) {
    throw new Error(`About to delete ${userComments.length} comments, please double-check that you want to do this and comment this line out if so!`);
  }

  const adminContext = createAdminContext();
  const adminTeamAccount = await getAdminTeamAccount(adminContext);
  if (!adminTeamAccount) throw new Error("Couldn't find admin team account");

  for (const userComment of userComments) {
    await updateComment({
      data: {
        deleted: true,
        deletedPublic: true,
        deletedByUserId: adminTeamAccount._id,
        deletedReason: noDeletionPmReason,
      },
      selector: { _id: userComment._id },
    }, adminContext);

    await sleep(50);
  }

  const userPosts = await Posts.find({ userId, deletedDraft: false }).fetch();
  if (userPosts.length > 100) {
    throw new Error(`About to delete ${userPosts.length} posts, please double-check that you want to do this and comment this line out if so!`);
  }

  for (const userPost of userPosts) {
    await updatePost({
      data: {
        draft: true,
        deletedDraft: true,
      },
      selector: { _id: userPost._id },
    }, adminContext);

    await sleep(50);
  }
};
