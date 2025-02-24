import { PetrovDayLaunchs } from "@/lib/collections/petrovDayLaunchs/collection.ts";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { petrovDayLaunchCode } from "@/components/seasonal/PetrovDayButton";
import PetrovDayActions from "@/lib/collections/petrovDayActions/collection";
import { petrovBeforeTime } from "@/components/Layout";
import { DatabaseServerSetting } from "../databaseSettings";
import sample from "lodash/sample";
import { inWarningWindow } from "@/components/seasonal/petrovDay/PetrovWarningConsole";
import { defineQuery } from "../utils/serverGraphqlUtil";

const petrovFalseAlarmMissileCount = new DatabaseServerSetting<number[]>('petrovFalseAlarmMissileCount', [])
const petrovRealAttackMissileCount = new DatabaseServerSetting<number[]>('petrovRealAttackMissileCount', [])

const getIncomingCount = (incoming: boolean, role: 'eastPetrov' | 'westPetrov') => {
  const currentHour = new Date().getHours();
  const roleSeed = role === 'eastPetrov' ? 0 : 13;
  const seed = currentHour + roleSeed + (incoming ? 17 : 0); // Different seed for each hour, role, and incoming state

  const missileCountArray = incoming ? petrovRealAttackMissileCount.get() : petrovFalseAlarmMissileCount.get();

  const result = seed % missileCountArray.length
  return missileCountArray[result];
}

const PetrovDay2024CheckNumberOfIncomingData = `type PetrovDay2024CheckNumberOfIncomingData {
  count: Int
}`

addGraphQLSchema(PetrovDay2024CheckNumberOfIncomingData);
const startTime = new Date(petrovBeforeTime.get())

const petrovDay2024Resolvers = {
  Query: {
    async PetrovDay2024CheckNumberOfIncoming(root: void, args: void, context: ResolverContext) {
      const actions = await PetrovDayActions.find({createdAt: {$gte: startTime}, actionType: {$ne: 'optIn'}}).fetch()

      if (!inWarningWindow(new Date().getMinutes()) || !context.currentUser) {
        return { count: 0 }
      }

      const userRole = actions.filter(action => action.actionType === 'hasRole' && action.userId === context.currentUser?._id)?.[0]?.data?.role

      if (userRole === 'eastPetrov') {  
        const nukeTheEastActions = actions.filter(action => action.actionType === 'nukeTheEast')
        const incoming = !!(nukeTheEastActions?.length > 0)
        return { count: getIncomingCount(incoming, 'eastPetrov') }
      }
      if (userRole === 'westPetrov') {
        const nukeTheWestActions = actions.filter(action => action.actionType === 'nukeTheWest')
        const incoming = !!(nukeTheWestActions?.length > 0)
        return { count: getIncomingCount(incoming, 'westPetrov') }
      }
      return { count: 0 }
    }
  },
};

addGraphQLResolvers(petrovDay2024Resolvers);

addGraphQLQuery('PetrovDay2024CheckNumberOfIncoming: PetrovDay2024CheckNumberOfIncomingData');




defineQuery({
  name: "petrov2024checkIfNuked",
  resultType: "Boolean",
  fn: async (_, args, context: ResolverContext): Promise<Boolean> => {
    const { currentUser } = context;
    if (!currentUser) {
      return false;
    }

    const currentUserSideAction = await PetrovDayActions.findOne({ userId: currentUser._id, actionType: 'hasSide' });

    if (!currentUserSideAction) {
      return false;
    }

    const ninetyMinutesAgo = new Date(new Date().getTime() - (90 * 60 * 1000));
    const nukeActions = await PetrovDayActions.find({ actionType: { $in: ['nukeTheEast', 'nukeTheWest'] }, createdAt: { $lte: ninetyMinutesAgo } }).fetch();

    const userSide = currentUserSideAction.data.side;

    if (userSide === 'east') {
      const eastIsNuked = nukeActions.find(({actionType}) => actionType === 'nukeTheEast')
      return !!eastIsNuked;
    }

    if (userSide === 'west') {
      const westIsNuked = nukeActions.find(({actionType}) => actionType === 'nukeTheWest')
      return !!westIsNuked;
    }

    return false;
  }
})
