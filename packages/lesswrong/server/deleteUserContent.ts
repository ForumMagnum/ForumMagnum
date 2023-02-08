import Comments from "../lib/collections/comments/collection";
import Posts from "../lib/collections/posts/collection";
import Users from "../lib/collections/users/collection";
import { getAdminTeamAccount, noDeletionPmReason } from "./callbacks/commentCallbacks";
import { exportUserData } from "./exportUserData";
import { createAdminContext, Globals, updateMutator } from './vulcan-lib';

const sleep = (ms: number) => {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
};

/** Please ensure that we know that the user is who they say they are! */
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

  const adminContext = createAdminContext();
  const adminTeamAccount = await getAdminTeamAccount();

  for (const userComment of userComments) {
    await updateMutator({
      collection: Comments,
      documentId: userComment._id,
      set: {
        deleted: true,
        deletedPublic: true,
        deletedByUserId: adminTeamAccount._id,
        deletedReason: noDeletionPmReason
      },
      context: adminContext
    });

    await sleep(50);
  }

  const userPosts = await Posts.find({ userId, deletedDraft: false }).fetch();

  for (const userPost of userPosts) {
    await updateMutator({
      collection: Posts,
      documentId: userPost._id,
      set: {
        draft: true,
        deletedDraft: true,
      },
      context: adminContext
    });

    await sleep(50);
  }
};

Globals.deleteUserContent = deleteUserContent;
