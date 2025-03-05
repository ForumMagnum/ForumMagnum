import SimpleSchema from "simpl-schema";
import { foreignKeyField, schemaDefaultValue } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";
import { addUniversalFields } from "@/lib/collectionUtils";

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

const schema: SchemaType<"DialogueMatchPreferences"> = {
  ...addUniversalFields({}),

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
    ...schemaDefaultValue([])
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
  calendlyLink: {
    type: String,
    nullable: true,
    optional: true,
    canCreate: ['members', 'admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['members', 'admins'],
  },
  generatedDialogueId: {
    type: String,
    nullable: true,
    optional: true,
    hidden: true,
    canCreate: ['admins'],
    canRead: ['members', 'admins'],
    canUpdate: ['admins'],
  },
  // deleted: Indicates whether a form has been soft deleted, after a dialogue was published and the form was reset
  deleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },
};

export default schema;
