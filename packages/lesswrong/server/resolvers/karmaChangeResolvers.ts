import Users from "../../lib/collections/users/collection";
import { isAF } from "../../lib/instanceSettings";
import { augmentFieldsDict } from '../../lib/utils/schemaUtils';
import { getKarmaChangeDateRange, getKarmaChangeNextBatchDate, getKarmaChanges } from "../karmaChanges";

augmentFieldsDict(Users, {
  karmaChanges: {
    type: 'KarmaChanges',
    resolveAs: {
      arguments: 'startDate: Date, endDate: Date',
      type: 'KarmaChanges',
      resolver: async (document, {startDate, endDate}, context: ResolverContext) => {
        const { currentUser } = context;
        if (!currentUser)
          return null;
        
        
        // If this isn't an SSR (ie, it might be a mutation), refetch the current
        // user, because the current user gets set at the beginning of the request,
        // which matters if we're refetching this because we just updated
        // karmaChangeLastOpened.
        const newCurrentUser = context.isSSR
          ? currentUser
          : await Users.findOne(currentUser._id)
        if (!newCurrentUser) throw Error(`Cant find user with ID: ${currentUser._id}`)
        
        const settings = newCurrentUser.karmaChangeNotifierSettings
        const now = new Date();
        
        // If date range isn't specified, infer it from user settings
        if (!startDate || !endDate) {
          // If the user has karmaChanges disabled, don't return anything
          if (settings.updateFrequency === "disabled") return null
          const lastOpened = newCurrentUser.karmaChangeLastOpened;
          const lastBatchStart = newCurrentUser.karmaChangeBatchStart;
          
          const dateRange = getKarmaChangeDateRange({settings, lastOpened, lastBatchStart, now})
          if (dateRange == null) return null;
          const {start, end} = dateRange;
          startDate = start;
          endDate = end;
        }
        
        const nextBatchDate = getKarmaChangeNextBatchDate({settings, now});
        
        return getKarmaChanges({
          user: document,
          startDate, endDate,
          nextBatchDate,
          af: isAF,
          context,
        });
      },
    },
  }
});
