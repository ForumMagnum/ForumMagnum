import { Globals } from "../vulcan-lib";
import fs from 'fs'

Globals.getReviewPrizesPost = async () => {
  const result = await createVotingPostHtml()
  fs.writeFile('reviewResultsPost.txt', result.toString(), err => {
    if (err) {
      console.error(err);
    }
  });
}
