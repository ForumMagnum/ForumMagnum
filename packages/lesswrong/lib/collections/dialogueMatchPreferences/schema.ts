import {schemaDefaultValue} from "../../collectionUtils";
import { foreignKeyField } from "../../utils/schemaUtils";

const SYNC_PREFERENCE_VALUES = ['Yes', 'Meh', 'No'] as const;

const schema: SchemaType<DbDialogueMatchPreference> = {
  dialogueCheckId: {
    ...foreignKeyField({
      collectionName: 'DialogueChecks',
      type: 'DialogueCheck',
      idFieldName: 'dialogueCheckId',
      resolverName: 'dialogueCheck',
      nullable: true
    }),
    nullable: false,
    hidden: true,
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
  },
  topicNotes: {
    type: String,
    nullable: false,
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
    ...schemaDefaultValue('')
  },
  syncPreference: {
    type: String,
    nullable: false,
    allowedValues: [...SYNC_PREFERENCE_VALUES],
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
  },
  asyncPreference: {
    type: String,
    nullable: false,
    allowedValues: [...SYNC_PREFERENCE_VALUES],
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
  },
  formatNotes: {
    type: String,
    nullable: false,
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
    ...schemaDefaultValue('')
  }
};

export default schema;
