import Users from "../../lib/collections/users/collection";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { augmentFieldsDict } from '../../lib/utils/schemaUtils';
import { getKarmaChangeDateRange, getKarmaChangeNextBatchDate, getKarmaChanges, USER_KARMA_CHANGE_NOTIFIER_FIELDS } from "../karmaChanges";

augmentFieldsDict(Users, {
  karmaChanges: {
    type: 'KarmaChanges',
    resolveAs: {
      arguments: 'startDate: Date, endDate: Date',
      type: 'KarmaChanges',
      dependsOn: USER_KARMA_CHANGE_NOTIFIER_FIELDS,
      resolver: async (document, {startDate,endDate}, context: ResolverContext) => {
        const { currentUser } = context;
        if (!currentUser)
          return null;
        
        // Grab new current user, because the current user gets set at the beginning of the request, which
        // is out of date in this case, because we are depending on recent mutations being reflected on the current user
        const newCurrentUser = await Users.findOne(currentUser._id)
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
        
        const alignmentForum = forumTypeSetting.get() === 'AlignmentForum';
        return getKarmaChanges({
          user: document,
          startDate, endDate,
          nextBatchDate,
          af: alignmentForum,
          context,
        });
      },
    },
  }
});
