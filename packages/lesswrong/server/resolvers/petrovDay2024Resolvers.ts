import { PetrovDayLaunchs } from "@/lib/collections/petrovDayLaunchs";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../vulcan-lib";
import { petrovDayLaunchCode } from "@/components/seasonal/PetrovDayButton";
import PetrovDayActions from "@/lib/collections/petrovDayActions/collection";
import { petrovBeforeTime } from "@/components/Layout";
import { DatabaseServerSetting } from "../databaseSettings";
import sample from "lodash/sample";
import { inWarningWindow } from "@/components/seasonal/petrovDay/PetrovWarningConsole";

const petrovFalseAlarmMissileCount = new DatabaseServerSetting<number[]>('petrovFalseAlarmMissileCount', [])
const petrovRealAttackMissileCount = new DatabaseServerSetting<number[]>('petrovRealAttackMissileCount', [])

const getIncomingCount = (incoming: boolean, role: 'eastPetrov' | 'westPetrov') => {
  const currentHour = new Date().getHours();
  const roleSeed = role === 'eastPetrov' ? 0 : 13;
  const seed = currentHour + roleSeed + (incoming ? 17 : 0); // Different seed for each hour, role, and incoming state

  const missileCountArray = incoming ? petrovRealAttackMissileCount.get() : petrovFalseAlarmMissileCount.get();

  const result = seed % missileCountArray.length
  console.log({currentHour, roleSeed, incoming, seed, result})
  return missileCountArray[result];
}

const PetrovDay2024CheckNumberOfIncomingData = `type PetrovDay2024CheckNumberOfIncomingData {
  count: Int
}`

addGraphQLSchema(PetrovDay2024CheckNumberOfIncomingData);

const petrovDay2024Resolvers = {
  Query: {
    async PetrovDay2024CheckNumberOfIncoming(root: void, args: void, context: ResolverContext) {
      const startTime = new Date(petrovBeforeTime.get())
      const actions = await PetrovDayActions.find({createdAt: {$gte: startTime}, actionType: {$ne: 'optIn'}}, {limit: 100}).fetch()

      if (!inWarningWindow(new Date().getMinutes())) {
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
