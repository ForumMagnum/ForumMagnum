import Users from "../../lib/collections/users/collection";
import { getKarmaChanges, getKarmaChangeDateRange, getKarmaChangeNextBatchDate } from "../karmaChanges";
import { getSetting } from '../../lib/vulcan-lib';

Users.addField([
  {
    fieldName: 'karmaChanges',
    fieldSchema: {
      type: 'KarmaChanges',
      resolveAs: {
        arguments: 'startDate: Date, endDate: Date',
        type: 'KarmaChanges',
        resolver: async (document, {startDate,endDate}, {currentUser}) => {
          if (!currentUser)
            return null;
          
          // Grab new current user, because the current user gets set at the beginning of the request, which
          // is out of date in this case, because we are depending on recent mutations being reflected on the current user
          const newCurrentUser = await Users.findOne(currentUser._id)
          
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
          
          const alignmentForum = getSetting('forumType') === 'AlignmentForum';
          return getKarmaChanges({
            user: document,
            startDate, endDate,
            nextBatchDate,
            af: alignmentForum,
          });
        },
      },
    },
  },
]);
