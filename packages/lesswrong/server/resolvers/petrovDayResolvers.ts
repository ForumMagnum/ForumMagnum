import { PetrovDayLaunchs } from '../../server/collections/petrovDayLaunchs/collection';
import { createMutator } from "../vulcan-lib/mutators";
import { petrovDayLaunchCode } from "../../components/seasonal/PetrovDayButton";
import { userCanLaunchPetrovMissile } from "../../lib/petrovHelpers";
import gql from 'graphql-tag';

export const petrovDayLaunchGraphQLTypeDefs = gql`
  type PetrovDayCheckIfIncomingData {
    launched: Boolean
    createdAt: Date
  }
  type PetrovDayLaunchMissileData {
    launchCode: String
    createdAt: Date
  }
  extend type Query {
    PetrovDayCheckIfIncoming: PetrovDayCheckIfIncomingData
  }
  extend type Mutation {
    PetrovDayLaunchMissile(launchCode: String): PetrovDayLaunchMissileData
  }
`

export const petrovDayLaunchGraphQLQueries = {
  async PetrovDayCheckIfIncoming(root: void, context: ResolverContext) {
    const launches = await PetrovDayLaunchs.find().fetch()

    for (const launch of launches) {
      if (launch.launchCode === petrovDayLaunchCode) {
        return { launched: true, createdAt: launch.createdAt }
      }
    }
    return { launched: false }
  }
}

export const petrovDayLaunchGraphQLMutations = {
  async PetrovDayLaunchMissile(root: void, {launchCode}: {launchCode: string}, context: ResolverContext) {
    const { currentUser } = context
    if (userCanLaunchPetrovMissile(currentUser)) {
      const newLaunch = await createMutator({
        collection: PetrovDayLaunchs,
        document: {
          launchCode,
          // hashedLaunchCode: hashPetrovCode(launchCode),
          // userId: currentUser._id
        },
        validate: false,
      });
      // await updateMutator({
      //   collection: Users,
      //   documentId: currentUser._id,
      //   data: {
      //     petrovLaunchCodeDate: new Date()
      //   },
      //   validate: false
      // })
      return newLaunch.data
    } else {
      throw new Error("User not authorized to launch")
    }
  } 
}