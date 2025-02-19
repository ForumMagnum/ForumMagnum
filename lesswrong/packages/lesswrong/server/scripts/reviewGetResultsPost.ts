import { Globals } from "../vulcan-lib";
import fs from 'fs'
import { createVotingPostHtml } from "../reviewVoteUpdate";

Globals.getReviewPrizesPost = async () => {
  const result = await createVotingPostHtml()
  fs.writeFile('reviewResultsPost.txt', result.toString(), err => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
}
