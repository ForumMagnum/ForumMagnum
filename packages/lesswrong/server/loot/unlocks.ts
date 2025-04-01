import { PREMIUM_BOX_COST, REGULAR_BOX_COST, REGULAR_BOX_PICO_COST, Unlockable, defaultUserUnlockablesState, cylinder0Rewards, cylinder1Rewards, cylinder2Rewards, CurrencyReward, PREMIUM_BOX_PICO_COST } from "@/lib/loot/unlocks";
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


// type PurchaseLootBoxArgs = {
//   boxType: 'regular' | 'premium';
//   context: ResolverContext;
// } & ({ userId: string; clientId: string } | { userId?: undefined; clientId: string; });

// async function purchaseLootBoxTransaction({ userId, clientId, boxType, context }: PurchaseLootBoxArgs) {
//   return await modifyUnlocksState({
//     userId, clientId, context,
//     stateTransform: (oldState) => {
//       const selectedBoxCost = boxType === 'regular' ? REGULAR_BOX_COST : PREMIUM_BOX_COST;
//       const updatedLwBucks = oldState.lwBucks - selectedBoxCost;

//       const updatedSpinState = boxType === 'regular'
//         ? { spinsRemaining: oldState.spinsRemaining + 1 }
//         : { premiumSpinsRemaining: oldState.premiumSpinsRemaining + 1 };

//       return {
//         ...oldState,
//         lwBucks: updatedLwBucks,
//         ...updatedSpinState,
//       };
//     }
//   });
// }

function getWeightedRandomReward<T extends { weight: number }>(rewards: T[]): { result: T, index: number } {
  const totalWeight = rewards.reduce((acc, reward) => acc + reward.weight, 0);
  const randomValue = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (const [index, reward] of rewards.entries()) {
    cumulativeWeight += reward.weight;
    if (randomValue <= cumulativeWeight) {
      return { result: reward, index };
    }
  }

  return { result: rewards[rewards.length - 1], index: rewards.length - 1 };
}

function getNewCurrencyAmounts(oldState: UserUnlockablesState, paymentMethod: "lwBucks" | "picoLightcones", boxType: "regular" | "premium", currencyRewardSpin: CurrencyReward) {
  const newState = { ...oldState };
  if (paymentMethod === "lwBucks") {
    newState.lwBucks -= boxType === "regular" ? REGULAR_BOX_COST : PREMIUM_BOX_COST;
  } else {
    newState.picoLightcones -= boxType === "regular" ? REGULAR_BOX_PICO_COST : PREMIUM_BOX_PICO_COST;
  }

  if (currencyRewardSpin.name === 'lwBucksSmall') {
    newState.lwBucks += 50;
  } else if (currencyRewardSpin.name === 'lwBucksMedium') {
    newState.lwBucks += 110;
  } else if (currencyRewardSpin.name === 'lwBucksLarge') {
    newState.lwBucks += 190;
  } else if (currencyRewardSpin.name === 'picoLightconesSmall') {
    newState.picoLightcones += 4;
  } else if (currencyRewardSpin.name === 'picoLightconesMedium') {
    newState.picoLightcones += 8;
  } else if (currencyRewardSpin.name === 'picoLightconesLarge') {
    newState.picoLightcones += 16;
  } else if (currencyRewardSpin.name === 'picoLightconesHuge') {
    newState.picoLightcones += 100;
  }
  return newState;
}

async function spinTreasureChestTransaction({ userId, clientId, paymentMethod, boxType, context }: {
  userId?: string,
  clientId: string,
  paymentMethod: "lwBucks" | "picoLightcones",
  boxType: "regular" | "premium",
  context: ResolverContext,
}) {
  const cylinder0SpinOutcome = getWeightedRandomReward(cylinder0Rewards);
  const cylinder1SpinOutcome = getWeightedRandomReward(cylinder1Rewards);
  const cylinder2SpinOutcome = getWeightedRandomReward(cylinder2Rewards);

  await modifyUnlocksState({
    userId, clientId, context,
    stateTransform: (oldState) => {
      if (oldState.hasFreeHomepageSpin) {
        return {
          ...oldState,
          hasFreeHomepageSpin: false,
        };
      };

      const hasEnoughOfPaymentMethod = paymentMethod === "lwBucks"
        ? oldState.lwBucks >= REGULAR_BOX_COST
        : oldState.picoLightcones >= REGULAR_BOX_PICO_COST;

      if (!hasEnoughOfPaymentMethod) {
        throw new Error(`Not enough ${paymentMethod} to spin the treasure chest`);
      }

      const stateWithUpdatedCurrencyAmounts = getNewCurrencyAmounts(oldState, paymentMethod, boxType, cylinder2SpinOutcome.result);

      const updatedUnlocks = {
        ...oldState.unlocks,
        [cylinder0SpinOutcome.result.name]: (oldState.unlocks[cylinder0SpinOutcome.result.name] ?? 0) + 1,
        [cylinder1SpinOutcome.result.name]: (oldState.unlocks[cylinder1SpinOutcome.result.name] ?? 0) + 1,
      };

      return {
        ...oldState,
        ...stateWithUpdatedCurrencyAmounts,
        spinsPerformed: oldState.spinsPerformed + 1,
        unlocks: updatedUnlocks,
      };
    }
  });

  return [cylinder0SpinOutcome.index, cylinder1SpinOutcome.index, cylinder2SpinOutcome.index];
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
const validPaymentMethods = new TupleSet(["lwBucks", "picoLightcones"] as const);

export const unlockablesGraphQLQueries = {
  async CurrentUserUnlockableState(root: void, args: {}, context: ResolverContext) {
    const userId = context.currentUser?._id ?? null;
    const dbUnlockState: DbUnlockable = await fetchUnlockableState(userId, context.clientId!, context);
    return dbUnlockState.unlockablesState;
  },
};

export const unlockablesGraphQLMutations = {
  // async BuyLootBox(root: void, args: { boxType: string }, context: ResolverContext) {
  //   const userId = context.currentUser?._id;
  //   const clientId = context.clientId!;

  //   const boxType = args.boxType;
  //   if (!validBoxTypes.has(boxType)) {
  //     throw new Error(`Invalid box type: ${boxType}`);
  //   }

  //   await purchaseLootBoxTransaction({ userId, clientId, boxType, context });
  //   return true;
  // },

  async SpinTreasureChest(root: void, args: { paymentMethod: string }, context: ResolverContext) {
    const userId = context.currentUser?._id;
    const clientId = context.clientId!;

    const paymentMethod = args.paymentMethod;
    if (!validPaymentMethods.has(paymentMethod) || (!userId && paymentMethod === "picoLightcones")) {
      throw new Error(`Invalid payment method: ${paymentMethod}`);
    }

    return await spinTreasureChestTransaction({ userId, clientId, paymentMethod, boxType: "regular", context });
  },
};

export const unlockablesGqlTypeDefs = gql`
  extend type Query {
    CurrentUserUnlockableState: JSON!
  }

  extend type Mutation {
    # BuyLootBox(boxType: String!): Boolean!
    SpinTreasureChest(paymentMethod: String!): [Int!]!
  }
`;
