import { PREMIUM_BOX_COST, REGULAR_BOX_COST, REGULAR_BOX_PICO_COST, Unlockable, defaultUserUnlockablesState, cylinder0Rewards, cylinder1Rewards, cylinder2Rewards, CurrencyReward, PREMIUM_BOX_PICO_COST, twelveVirtues } from "@/lib/loot/unlocks";
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

export async function purchasePicoLightcones(userId: string, amount: number, context: ResolverContext) {
  await modifyUnlocksState({
    userId, context,
    stateTransform: (oldState) => {
      return {
        ...oldState,
        picoLightcones: oldState.picoLightcones + amount,
      };
    }
  });
}

function getWeightedRandomReward<T extends { name: string, weight: number }>(rewards: T[]): { result: T, index: number } {
  const possibleRewards = rewards.filter(r => r.weight > 0);
  const totalWeight = possibleRewards.reduce((acc, reward) => acc + reward.weight, 0);
  const randomValue = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (const reward of possibleRewards) {
    if (reward.weight === 0) {
      continue;
    }

    const originalIndex = rewards.findIndex(r => r.name === reward.name);
    cumulativeWeight += reward.weight;
    if (randomValue <= cumulativeWeight) {
      return { result: reward, index: originalIndex };
    }
  }

  const fallbackReward = possibleRewards[possibleRewards.length - 1];
  const originalIndex = rewards.findIndex(r => r.name === fallbackReward.name);
  return { result: fallbackReward, index: originalIndex };
}

function getNewCurrencyAmounts(oldState: UserUnlockablesState, paymentMethod: "lwBucks" | "picoLightcones" | "freeHomepageSpin", boxType: "regular" | "premium", currencyRewardSpin: CurrencyReward) {
  const newState = { ...oldState };
  if (paymentMethod === "lwBucks") {
    newState.lwBucks -= boxType === "regular" ? REGULAR_BOX_COST : PREMIUM_BOX_COST;
  } else if (paymentMethod === "picoLightcones") {
    newState.picoLightcones -= boxType === "regular" ? REGULAR_BOX_PICO_COST : PREMIUM_BOX_PICO_COST;
  } else if (paymentMethod === "freeHomepageSpin") {
    // Do nothing
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

  let usedFreeHomepageSpin = false;

  await modifyUnlocksState({
    userId, clientId, context,
    stateTransform: (oldState) => {
      const updatedVoteStrengthName = cylinder0SpinOutcome.result.name;
      const updatedVoteStrength = (oldState.unlocks[cylinder0SpinOutcome.result.name] ?? 0) + 1

      if (oldState.hasFreeHomepageSpin) {
        usedFreeHomepageSpin = true;
        const stateWithUpdatedCurrencyAmounts = getNewCurrencyAmounts(oldState, "freeHomepageSpin", boxType, cylinder2Rewards.find(r => r.name === "lwBucksLarge")!);

        return {
          ...stateWithUpdatedCurrencyAmounts,
          unlocks: {
            ...oldState.unlocks,
            ghiblify: (oldState.unlocks.ghiblify ?? 0) + 1,
            [updatedVoteStrengthName]: updatedVoteStrength,
          },
          hasFreeHomepageSpin: false,
        };
      };

      const hasEnoughOfPaymentMethod = paymentMethod === "lwBucks"
        ? oldState.lwBucks >= REGULAR_BOX_COST
        : oldState.picoLightcones >= REGULAR_BOX_PICO_COST;

      if (!hasEnoughOfPaymentMethod) {
        throw new Error(`Not enough ${paymentMethod} to spin the treasure chest!`);
      }

      const stateWithUpdatedCurrencyAmounts = getNewCurrencyAmounts(oldState, paymentMethod, boxType, cylinder2SpinOutcome.result);

      const updatedUnlocks = {
        ...oldState.unlocks,
        [updatedVoteStrengthName]: updatedVoteStrength,
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

  // Return rigged results if the user is using their free homepage spin
  if (usedFreeHomepageSpin) {
    return [cylinder0SpinOutcome.index, cylinder1Rewards.findIndex(r => r.name === "ghiblify"), cylinder2Rewards.findIndex(r => r.name === "lwBucksLarge")];
  }

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
    if (!validPaymentMethods.has(paymentMethod)) {
      throw new Error(`Invalid payment method: ${paymentMethod}`);
    }

    return await spinTreasureChestTransaction({ userId, clientId, paymentMethod, boxType: "regular", context });
  },

  async PinRationalityVirtue(root: void, args: { virtueName: string }, context: ResolverContext): Promise<string[]> {
    const userId = context.currentUser?._id;
    const clientId = context.clientId!;

    if (!userId) {
      throw new Error("User must be logged in to pin virtues.");
    }

    const virtueName = args.virtueName;
    const validVirtueNames = new Set(twelveVirtues.map(v => v.name));

    if (!validVirtueNames.has(virtueName)) {
      throw new Error(`Invalid virtue name: ${virtueName}`);
    }

    let updatedPinnedVirtues: string[] = [];

    await modifyUnlocksState({
      userId, clientId, context,
      stateTransform: (oldState) => {
        if (!oldState.unlocks || (oldState.unlocks[virtueName] ?? 0) <= 0) {
          throw new Error(`User has not unlocked the virtue: ${virtueName}`);
        }

        const currentPinned = oldState.pinnedVirtues || [];
        const isAlreadyPinned = currentPinned.includes(virtueName);

        if (isAlreadyPinned) {
          updatedPinnedVirtues = currentPinned.filter(v => v !== virtueName);
        } else {
          if (currentPinned.length >= 3) {
            throw new Error("Cannot pin more than 3 virtues.");
          }
          updatedPinnedVirtues = [...currentPinned, virtueName];
        }

        return {
          ...oldState,
          pinnedVirtues: updatedPinnedVirtues,
        };
      }
    });

    return updatedPinnedVirtues;
  },
};

export const unlockablesGqlTypeDefs = gql`
  extend type Query {
    CurrentUserUnlockableState: JSON!
  }

  extend type Mutation {
    # BuyLootBox(boxType: String!): Boolean!
    SpinTreasureChest(paymentMethod: String!): [Int!]!
    PinRationalityVirtue(virtueName: String!): [String!]!
  }
`;
