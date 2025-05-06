import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

export const ACTION_TYPES = [
  "optIn",
  "hasRole",
  "hasSide",
  "nukeTheWest",
  "nukeTheEast",
  "eastPetrovAllClear",
  "eastPetrovNukesIncoming",
  "westPetrovAllClear",
  "westPetrovNukesIncoming",
] as const;

const ACTION_TYPES_SET = new TupleSet(ACTION_TYPES);

export type PetrovDayActionType = UnionOf<typeof ACTION_TYPES_SET>;
