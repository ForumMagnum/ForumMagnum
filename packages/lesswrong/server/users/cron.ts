import { addCronJob } from '../cron/cronUtil';
import Users from "../../server/collections/users/collection";
import { ModeratorActions } from "../../server/collections/moderatorActions/collection";
import { allRateLimits } from "../../lib/collections/moderatorActions/schema";
import { appendToSunshineNotes } from "../../lib/collections/users/helpers";
import { triggerReview } from "../callbacks/sunshineCallbackUtils";
import { createAdminContext } from "../vulcan-lib/createContexts";
import * as _ from 'underscore';
import moment from 'moment';


export const expiredRateLimitsReturnToReviewQueueCron = addCronJob({
  name: 'expiredRateLimitsReturnToReviewQueue',
  interval: 'every 24 hours',
  async job() {
    const context = createAdminContext();
    const endOfDay = new Date()
    const startOfDay = moment(endOfDay).subtract(1, 'days').toDate()
    
    const rateLimitsExpiringToday = await ModeratorActions.find({type: {$in: allRateLimits}, endedAt: {$gte: startOfDay, $lt: endOfDay}}).fetch();
    const userIdsWithExpiringRateLimits = rateLimitsExpiringToday.map((action) => action.userId);
    const usersWithExpiringRateLimits = await Users.find({_id: {$in: userIdsWithExpiringRateLimits}}).fetch();
    
    if (!_.isEmpty(usersWithExpiringRateLimits)) {
      usersWithExpiringRateLimits.map(async user => {
        await appendToSunshineNotes({
          moderatedUserId: user._id,
          adminName: "Automod",
          text: "Rate limit expired",
          context,
        });
        await triggerReview(user._id);
      })
      
      // log the action
      // eslint-disable-next-line no-console
      console.log('// Users with expired rate limits:', userIdsWithExpiringRateLimits); // eslint-disable-line
    }
  }
});
