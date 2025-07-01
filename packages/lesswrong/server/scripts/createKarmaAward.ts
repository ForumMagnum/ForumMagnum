import Users from "@/server/collections/users/collection";
import { performVoteServer } from "../voteServer"
import { Posts } from "@/server/collections/posts/collection.ts";
import { karmaRewarderId100, karmaRewarderId1000 } from '@/lib/publicSettings';
import { createPost } from "../collections/posts/mutations";
import { computeContextFromUser } from "../vulcan-lib/apollo-server/context";

const createKarmaAwardForUser = async (userId: string, karmaAmount: 100|1000, reason: string) => {
  // eslint-disable-next-line no-console
  console.log("Creating karma award for user", userId, karmaAmount, reason)
  const user = await Users.findOne({_id: userId});
  if (!user) {
    // eslint-disable-next-line no-console
    console.log("ERROR: Couldn't find user")
    return
  }

  let karmaAwardGivingUser: DbUser|null = null;
  if (karmaAmount === 100) {
    karmaAwardGivingUser = await Users.findOne({_id: karmaRewarderId100.get()})
  }
  if (karmaAmount === 1000) {
    karmaAwardGivingUser = await Users.findOne({_id: karmaRewarderId1000.get()})
  }

  if (!karmaAwardGivingUser) {
    // eslint-disable-next-line no-console
    console.log("ERROR: Couldn't find karma award giving user")
    return
  }
  const postInfo = `${karmaAmount} karma award for ${reason}`
  const contents = {originalContents: { data: postInfo, type: "ckEditorMarkup" }}

  const userContext = await computeContextFromUser({ user: user, isSSR: false });

  const post = await createPost({
    data: { userId: user._id, draft: true, deletedDraft: true, title: postInfo, contents } as CreatePostDataInput // deletedDraft isn't allowed through the create API, so we need validation disabled and a type cast
  }, userContext);

  void performVoteServer({documentId: post._id, voteType: "bigUpvote", user: karmaAwardGivingUser, collection: Posts, skipRateLimits: true});
}

// Exported to allow running manually with "yarn repl"
export const createKarmaAwards = async (userIds: string[], karmaAmount: 100|1000, reason: string) => {
  for (const userId of userIds) {
    void createKarmaAwardForUser(userId, karmaAmount, reason);
  }
}
