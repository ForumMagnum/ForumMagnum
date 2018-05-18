import { Votes } from 'meteor/vulcan:voting';
import moment from 'moment';

Votes.addView('sunshineDownvotes', function(terms) {
  const fiveDaysAgo = moment().subtract(6, 'days').toDate();

  return {
    selector: {
      power: {$lt:0},
      // documentUserSlug: "raemon"
      votedAt: {$gt: fiveDaysAgo }
    },
    options: {
      sort: {
        votedAt: -1,
      }
    }
  }
});
