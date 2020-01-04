import ReviewVotes from "./collection.js"
import { ensureIndex } from '../../collectionUtils';

//Messages for a specific conversation
ReviewVotes.addView("reviewVotesFromUser", function ({userId}) {
  return {
    selector: {userId, deleted: false}
  };
});
ensureIndex(ReviewVotes, {deleted: 1, userId: 1});

ReviewVotes.addView("reviewVotesForPost", function ({postId}) {
  return {
    selector: {postId, deleted: false},
  };
});
ensureIndex(ReviewVotes, {deleted: 1, postId: 1});

ReviewVotes.addView("reviewVotesForPostAndUser", function ({postId, userId}) {
  return {
    selector: {postId, userId, deleted: false},
  };
});
ensureIndex(ReviewVotes, {deleted: 1, postId: 1, userId: 1})
