import { PREMIUM_BOX_COST, REGULAR_BOX_COST, Unlockable, allUnlockables, defaultUserUnlockablesState } from "@/lib/loot/unlocks";
import { getSqlClientOrThrow, runSqlQuery } from "../sql/sqlClient";
import Unlockables from "../collections/unlockables/collection";
import { executeWithLock } from "../resolvers/jargonResolvers/jargonTermMutations";
import { createAnonymousContext } from "../vulcan-lib/createContexts";
import { randomId } from "@/lib/random";
import { gql } from "@apollo/client";
import { TupleSet } from "@/lib/utils/typeGuardUtils";


/**
 * Returns a list of unlocks (from `allUnlocks`) that have not been unlocked
 * for the given user, or which are repeatable.
 */
export function getAvailableUnlockables(user: DbUser|UsersMinimumInfo): Unlockable[] {
  // TODO
  //return allUnlockables.filter(u => u.repeatable || !userHasUnlock(user, u));
  return [];
}

export async function modifyUnlocksState({userId, clientId, context: givenContext, stateTransform}: {
  userId?: string,
  clientId?: string,
  context?: ResolverContext
  stateTransform: (oldState: UserUnlockablesState) => UserUnlockablesState
}) {
  if (!userId && !clientId) {
    throw new Error("modifyUnlocksState must have a user ID or a client DI");
  }
  const db = getSqlClientOrThrow();
  const context = givenContext ?? createAnonymousContext();
  await lockUserAndClientId(userId ?? null, clientId ?? null, async () => {
    const existingState = await fetchUnlockableState(userId ?? null, clientId!, context);
    if (!existingState) {
      throw new Error(`Could not get unlockable state for ${userId}/${clientId}`);
    }
    const newState = stateTransform(existingState.unlockablesState);
    await Unlockables.rawUpdateOne(
      {_id: existingState._id},
      {$set: {
        unlockablesState: newState,
      }}
    );
  });
}

const lockUserAndClientId = async (userId: string|null, clientId: string|null, cb: () => Promise<void>) => {
  await executeWithLock(`loot_${userId ?? clientId ?? "unknown"}`, cb);
}

export async function grantUnlockToUserId(userId: string, unlockableName: string, context?: ResolverContext) {
  await modifyUnlocksState({
    userId, context,
    stateTransform: (oldState) => {
      return {
        ...oldState,
        unlocks: {
          ...oldState.unlocks,
          [unlockableName]: (oldState.unlocks?.[unlockableName] ?? 0) + 1,
        },
      };
    }
  });
}

export async function grantUnlockToClientId(clientId: string, unlockableName: string, context?: ResolverContext) {
  await modifyUnlocksState({
    clientId, context,
    stateTransform: (oldState) => {
      return {
        ...oldState,
        unlocks: {
          ...oldState.unlocks,
          [unlockableName]: (oldState.unlocks?.[unlockableName] ?? 0) + 1,
        },
      };
    }
  });
}


type PurchaseLootBoxArgs = {
  boxType: 'regular' | 'premium';
  context: ResolverContext;
} & ({ userId: string; clientId: string } | { userId?: undefined; clientId: string; });

async function purchaseLootBoxTransaction({ userId, clientId, boxType, context }: PurchaseLootBoxArgs) {
  return await modifyUnlocksState({
    userId, clientId, context,
    stateTransform: (oldState) => {
      const selectedBoxCost = boxType === 'regular' ? REGULAR_BOX_COST : PREMIUM_BOX_COST;
      const updatedLwBucks = oldState.lwBucks - selectedBoxCost;

      const updatedSpinState = boxType === 'regular'
        ? { spinsRemaining: oldState.spinsRemaining + 1 }
        : { premiumSpinsRemaining: oldState.premiumSpinsRemaining + 1 };

      return {
        ...oldState,
        lwBucks: updatedLwBucks,
        ...updatedSpinState,
      };
    }
  });
}

async function fetchUnlockableState(userId: string|null, clientId: string|null, context: ResolverContext): Promise<DbUnlockable> {
  if (!userId && !clientId) {
    throw new Error("fetchUnlockableState requires a userId or a clientId");
  }
  
  // Find unlockable inventories associated with this userId *or* client ID
  const relevantUnlockableStates = await Unlockables.find({
    $or: [
      ...(userId ? [{ userId, }] : []),
      ...(clientId ? [{ clientId, }] : []),
    ]
  }, {}).fetch();
  
  // TODO: Better handling for the case where we find more than one result (eg, a user does some spins logged out on one device, and some spins logged in on another device, then logs in).
  if (relevantUnlockableStates.length > 0) {
    const inventoriesWithUserId = relevantUnlockableStates.filter(u => !!u.userId)
    if (inventoriesWithUserId.length > 0) {
      return inventoriesWithUserId[0];
    } else {
      return relevantUnlockableStates[0];
    }
  }

  const convertedLwBucks = context.currentUser
    ? context.currentUser.karma
    : 0;
  
  const resultId = await Unlockables.rawInsert({
    _id: randomId(),
    userId: userId,
    clientId: clientId,
    unlockablesState: {
      ...defaultUserUnlockablesState,
      lwBucks: convertedLwBucks,
    },
  });
  const result = await Unlockables.findOne({_id: resultId});
  return result!;
}

const validBoxTypes = new TupleSet(["regular", "premium"] as const);

export const unlockablesGraphQLQueries = {
  async CurrentUserUnlockableState(root: void, args: {}, context: ResolverContext) {
    const userId = context.currentUser?._id ?? null;
    const dbUnlockState: DbUnlockable = await fetchUnlockableState(userId, context.clientId!, context);
    return dbUnlockState.unlockablesState;
  },
};

export const unlockablesGraphQLMutations = {
  async BuyLootBox(root: void, args: { boxType: string }, context: ResolverContext) {
    const userId = context.currentUser?._id;
    const clientId = context.clientId!;

    const boxType = args.boxType;
    if (!validBoxTypes.has(boxType)) {
      throw new Error(`Invalid box type: ${boxType}`);
    }

    await purchaseLootBoxTransaction({ userId, clientId, boxType, context });
    return true;
  }
};

export const unlockablesGqlTypeDefs = gql`
  extend type Query {
    CurrentUserUnlockableState: JSON!
  }

  extend type Mutation {
    BuyLootBox(boxType: String!): Boolean!
  }
`;
