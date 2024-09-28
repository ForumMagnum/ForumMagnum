import Users from "@/lib/vulcan-users";
import { performVoteServer } from "../voteServer"
import { createMutator, Globals } from "../vulcan-lib"
import { Posts } from "@/lib/collections/posts";
import { karmaRewarderId100, karmaRewarderId1000 } from "@/lib/voting/vote";

const createKarmaAwardForUser = async (userId: string, karmaAmount: 100|1000, reason: string) => {
  const user = await Users.findOne({_id: userId});
  if (!user) return

  let karmaAwardGivingUser: DbUser|null = null;
  if (karmaAmount === 100) {
    karmaAwardGivingUser = await Users.findOne({_id: karmaRewarderId100.get()})
  }
  if (karmaAmount === 1000) {
    karmaAwardGivingUser = await Users.findOne({_id: karmaRewarderId1000.get()})
  }

  if (!karmaAwardGivingUser) return

  const post = await createMutator({
    collection: Posts,
    document: { userId: user._id, draft: true, deletedDraft: true, title: `100 karma award for ${reason}` },
    currentUser: user,
    validate: false,
  });

  performVoteServer({documentId: post.data._id, voteType: "upvote", user: karmaAwardGivingUser, collection: Posts, skipRateLimits: true});
}

const createKarmaAwards = async (userIds: string[], karmaAmount: 100|1000, reason: string) => {
  for (const userId of userIds) {
    createKarmaAwardForUser(userId, karmaAmount, reason);
  }
}

Globals.grantKarmaAwards = createKarmaAwards