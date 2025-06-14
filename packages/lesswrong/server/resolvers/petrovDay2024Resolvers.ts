import PetrovDayActions from "@/server/collections/petrovDayActions/collection";
import { petrovBeforeTime } from '@/lib/publicSettings';
import { DatabaseServerSetting } from "../databaseSettings";
import { inWarningWindow } from '@/lib/collections/petrovDayActions/helpers';
import gql from "graphql-tag";

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

export const petrovDay2024GraphQLTypeDefs = gql`
  type PetrovDay2024CheckNumberOfIncomingData {
    count: Int
  }
  extend type Query {
    PetrovDay2024CheckNumberOfIncoming: PetrovDay2024CheckNumberOfIncomingData
    petrov2024checkIfNuked: Boolean
  }
`

export const petrovDay2024GraphQLQueries = {
  async PetrovDay2024CheckNumberOfIncoming(root: void, args: void, context: ResolverContext) {
    const startTime = new Date(petrovBeforeTime.get())
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
  },
  async petrov2024checkIfNuked(root: void, args: void, context: ResolverContext): Promise<boolean> {
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
};
