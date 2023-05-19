import { addCronJob } from '../cronUtil';
import Users from "../../lib/collections/users/collection";
import * as _ from 'underscore';
import { ModeratorActions } from "../../lib/collections/moderatorActions";
import moment from 'moment';
import {allRateLimits} from "../../lib/collections/moderatorActions/schema";
import {getNewModActionNotes, getSignatureWithNote} from "../../lib/collections/users/helpers";


addCronJob({
  name: 'expiredRateLimitsReturnToReviewQueue',
  interval: 'every 1 minute',
  async job() {
  
  
    const startOfDay = moment(new Date()).subtract(1, 'days').toDate()
    const endOfDay = moment(new Date()).add(1, 'days').toDate()
    
    const rateLimitsExpiringToday = await ModeratorActions.find({type: "rateLimit", endedAt: [{$gte: startOfDay}, {$lt: endOfDay}, ]}).fetch();
    const userIdsWithExpiringRateLimits = rateLimitsExpiringToday.map((action) => action.userId);
    const usersWithExpiringRateLimits = await Users.find({_id: {$in: userIdsWithExpiringRateLimits}}).fetch();
    
    if (!_.isEmpty(usersWithExpiringRateLimits)) {
      
      usersWithExpiringRateLimits.map(async user => {
        const updatedNotes = `${getSignatureWithNote('Automod', "Rate limit expired")}${user.sunshineNotes}`
        await Users.rawUpdateOne({_id: user._id}, {$set: {needsReview: true, sunshineNotes: updatedNotes}})
      })
      
      // log the action
      console.log('// Users with expired rate limits:', userIdsWithExpiringRateLimits); // eslint-disable-line
    }
  }
});
