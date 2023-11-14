import SimpleSchema from "simpl-schema";
import {schemaDefaultValue} from "../../collectionUtils";
import { accessFilterSingle, foreignKeyField, resolverOnlyField } from "../../utils/schemaUtils";
import DialogueChecks from "../dialogueChecks/collection";

export const SYNC_PREFERENCE_VALUES = ['Yes', 'Meh', 'No'] as const;
export type SyncPreference = typeof SYNC_PREFERENCE_VALUES[number];

const topicPreferenceSchema = new SimpleSchema({
  text: {
    type: String,
  },
  preference: {
    type: String,
    allowedValues: ['Yes', 'No']
  },
  commentSourceId: {
    type: String,
    optional: true,
    nullable: true,
  }
});

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
  topicPreferences: {
    type: Array,
    nullable: false,
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
  },
  'topicPreferences.$': {
    type: topicPreferenceSchema,
    optional: true,
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
  // BP: My guess is we should change this to be called 'optionalNotes' because it should be about anything the user wants to say
  formatNotes: {
    type: String,
    nullable: false,
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
    ...schemaDefaultValue('')
  },
  generatedDialogueId: {
    type: String,
    nullable: true,
    optional: true,
    hidden: true,
    canCreate: ['admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['admins'],
  }
};

export default schema;
