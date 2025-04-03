import Users from '../../server/collections/users/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';

const fixKarma = false;
const mainPostKarmaWeight = 10;
const mainCommentKarmaWeight = 1;
const discussionPostKarmaWeight = 1;
const discussionCommentKarmaWeight = 1;
const upvoteWeight = 1;
const downvoteWeight = 1;

if (fixKarma) { void (async ()=>{
  let usersCount = 0;
  const allUsers = await Users.find().fetch();
  await asyncForeachSequential(allUsers, async (user) => {
    if (user.legacy) {
      // Function to deal with fields sometimes being undefined. Casts undefined to 0;
      const f = (n: number) => n || 0;
      // @ts-ignore legacyData isn't handled right on the schema
      const mainPostKarma = (upvoteWeight * f(user.legacyData.karma_ups_link_lesswrong))
        // @ts-ignore for legacyData
        - (downvoteWeight * f(user.legacyData.karma_downs_link_lesswrong));

      // @ts-ignore for legacyData
      const mainCommentKarma = (upvoteWeight * f(user.legacyData.karma_ups_comment_lesswrong))
        // @ts-ignore for legacyData
        - (downvoteWeight * f(user.legacyData.karma_downs_comment_lesswrong))

      // @ts-ignore for legacyData
      const discussionPostKarma = (upvoteWeight * f(user.legacyData.karma_ups_link_discussion))
        // @ts-ignore for legacyData
        - (downvoteWeight * f(user.legacyData.karma_downs_link_discussion))

      // @ts-ignore for legacyData
      const discussionCommentKarma = (upvoteWeight * f(user.legacyData.karma_ups_comment_discussion))
        // @ts-ignore for legacyData
        - (downvoteWeight * f(user.legacyData.karma_downs_comment_discussion))

      const karma = (mainPostKarmaWeight*mainPostKarma)
        + (mainCommentKarmaWeight*mainCommentKarma)
        + (discussionPostKarmaWeight*discussionPostKarma)
        + (discussionCommentKarmaWeight*discussionCommentKarma)

      await Users.rawUpdateOne({_id: user._id}, {$set :{karma: karma}});
      usersCount++;

      if (usersCount % 1000 === 0 ){
        //eslint-disable-next-line no-console
        console.log("Updated karma of n users: ", usersCount);
      }
    }
  })
})() }
