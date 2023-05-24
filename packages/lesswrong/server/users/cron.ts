import { addCronJob } from '../cronUtil';
import Users from "../../lib/collections/users/collection";
import { ModeratorActions } from "../../lib/collections/moderatorActions";
import { allRateLimits } from "../../lib/collections/moderatorActions/schema";
import { getSignatureWithNote } from "../../lib/collections/users/helpers";
import * as _ from 'underscore';
import moment from 'moment';


addCronJob({
  name: 'expiredRateLimitsReturnToReviewQueue',
  interval: 'every 24 hours',
  async job() {
  
  
    const endOfDay = new Date()
    const startOfDay = moment(endOfDay).subtract(1, 'days').toDate()
    
    const rateLimitsExpiringToday = await ModeratorActions.find({type: {$in: allRateLimits}, endedAt: {$gte: startOfDay, $lt: endOfDay}}).fetch();
    const userIdsWithExpiringRateLimits = rateLimitsExpiringToday.map((action) => action.userId);
    const usersWithExpiringRateLimits = await Users.find({_id: {$in: userIdsWithExpiringRateLimits}}).fetch();
    
    if (!_.isEmpty(usersWithExpiringRateLimits)) {
      
      usersWithExpiringRateLimits.map(async user => {
        const updatedNotes = `${getSignatureWithNote('Automod', "Rate limit expired")}${user.sunshineNotes}`
        await Users.rawUpdateOne({_id: user._id}, {$set: {needsReview: true, sunshineNotes: updatedNotes}})
      })
      
      // log the action
      // eslint-disable-next-line no-console
      console.log('// Users with expired rate limits:', userIdsWithExpiringRateLimits); // eslint-disable-line
    }
  }
});
