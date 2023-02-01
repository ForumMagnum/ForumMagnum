import { Globals } from "../vulcan-lib";
import fs from 'fs'
import { createVotingPostHtml } from "../../lib/reviewVoteUpdate";

Globals.getReviewPrizesPost = async () => {
  const result = await createVotingPostHtml()
  fs.writeFile('reviewResultsPost.txt', result.toString(), err => {
    if (err) {
      console.error(err);
    }
  });
}
