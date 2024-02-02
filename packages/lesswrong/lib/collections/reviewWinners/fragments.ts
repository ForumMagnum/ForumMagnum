import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment ReviewWinnerEditDisplay on ReviewWinner {
    _id
    postId
    reviewYear
    curatedOrder
    reviewRanking
    isAI
  }
`);
