import Users from "../../server/collections/users/collection";
import { ModeratorActions } from "../../server/collections/moderatorActions/collection";
import { allRateLimits, MANUAL_RATE_LIMIT_EXPIRED } from "@/lib/collections/moderatorActions/constants";
import { createAdminContext } from "../vulcan-lib/createContexts";
import moment from 'moment';
import { createModeratorAction } from "../collections/moderatorActions/mutations";

export async function expiredRateLimitsReturnToReviewQueue() {
  const context = createAdminContext();
  const endOfDay = new Date()
  const startOfDay = moment(endOfDay).subtract(1, 'days').toDate()
  
  const rateLimitsExpiringToday = await ModeratorActions.find({type: {$in: allRateLimits}, endedAt: {$gte: startOfDay, $lt: endOfDay}}).fetch();
  const userIdsWithExpiringRateLimits = rateLimitsExpiringToday.map((action) => action.userId);
  const usersWithExpiringRateLimits = await Users.find({_id: {$in: userIdsWithExpiringRateLimits}}).fetch();
  
  if (usersWithExpiringRateLimits.length > 0) {
    await Promise.all(usersWithExpiringRateLimits.map(async user => {
      await createModeratorAction({
        data: {
          type: MANUAL_RATE_LIMIT_EXPIRED,
          userId: user._id,
        },
      }, context);
    }));
    
    // log the action
    // eslint-disable-next-line no-console
    console.log('// Users with expired rate limits:', userIdsWithExpiringRateLimits); // eslint-disable-line
  }
}
