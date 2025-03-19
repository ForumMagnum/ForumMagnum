import { userOwns } from "@/lib/vulcan-users/permissions";
import { ALLOWABLE_COLLECTIONS } from "../moderationTemplates/schema";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { universalFields } from '../../collectionUtils';

const ACTION_TYPES = [
  'optIn',
  'hasRole',
  'hasSide',
  'nukeTheWest',
  'nukeTheEast',
  'eastPetrovAllClear',
  'eastPetrovNukesIncoming',
  'westPetrovAllClear',
  'westPetrovNukesIncoming'
] as const

const ACTION_TYPES_SET = new TupleSet(ACTION_TYPES)
export type PetrovDayActionType = UnionOf<typeof ACTION_TYPES_SET>


const schema: SchemaType<"PetrovDayActions"> = {
  ...universalFields({}),
  // NOTE: this whole schema is bad, sorry Robert
  actionType: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
    allowedValues: [...ACTION_TYPES],
    form: {
      options: () => [...ACTION_TYPES].map(key => ({ label: key, value: key }))
    },
  },
  data: {
    type: Object,
    nullable: true,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members']
  },
  userId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members']
  }
}

export default schema;
