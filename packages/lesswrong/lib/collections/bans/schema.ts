import SimpleSchema from 'simpl-schema';
import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils'
import { universalFields } from "../../collectionUtils";
import { editableFields } from '@/lib/editor/make_editable';

const schema: SchemaType<"Bans"> = {
  ...universalFields({}),
  expirationDate: {
    type: Date,
    optional: false,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    control: 'datetime',
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
    nullable: false,
    hidden: true,
  },
  ip: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    regEx: SimpleSchema.RegEx.IP,
  },
  reason: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    label: 'Reason (shown to the user)',
  },
  comment: {
    type: String,
    optional:true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    label: 'Comment (shown to other mods)',
    ...schemaDefaultValue(""),
  },
  properties: {
    type: Object,
    optional: true,
    blackbox: true,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
  ...editableFields("Bans", {
    fieldName: "moderationGuidelines",
    commentEditor: true,
    commentStyles: true,
    formGroup: () => formGroups.moderationGroup,
    hidden: !hasAuthorModeration,
    order: 50,
    permissions: {
      canRead: ['guests'],
      canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
      canCreate: ['sunshineRegiment', 'admins']
    }
  }),
};

export default schema;
