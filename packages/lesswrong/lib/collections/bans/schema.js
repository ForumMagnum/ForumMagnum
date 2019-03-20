import SimpleSchema from 'simpl-schema';
import { foreignKeyField } from '../../modules/utils/schemaUtils'

const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (document, currentUser) => new Date(),
    searchable: true,
  },
  expirationDate: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    control: 'datetime',
    searchable: true,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    optional: true,
    hidden: true,
  },
  ip: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    regEx: SimpleSchema.RegEx.IP,
    searchable: true,
  },
  reason: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    label: 'Reason (shown to the user)',
    searchable: true,
  },
  comment: {
    type: String,
    optional:true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    label: 'Comment (shown to other mods)',
    searchable: true,
  },
  properties: {
    type: Object,
    optional: true,
    blackbox: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
};

export default schema;
