import ReviewVotes from "./collection.js"
import { ensureIndex } from '../../collectionUtils';

//Messages for a specific conversation
ReviewVotes.addView("reviewVotesFromUser", function ({userId}) {
  return {
    selector: {userId}
  };
});
ensureIndex(ReviewVotes, {userId: 1});

ReviewVotes.addView("reviewVotesForPost", function ({postId}) {
  return {
    selector: {postId},
  };
});
ensureIndex(ReviewVotes, {postId: 1});

ReviewVotes.addView("reviewVotesForPostAndUser", function ({postId, userId}) {
  return {
    selector: {postId, userId},
  };
});
ensureIndex(ReviewVotes, {postId: 1, userId: 1})