import { editableFields } from '@/lib/editor/make_editable';
import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils'
import { userOwns } from '@/lib/vulcan-users/permissions';
import { addUniversalFields } from '../../collectionUtils';

const schema: SchemaType<"Messages"> = {
  ...addUniversalFields({ 
    createdAtOptions: {canRead: ['members']}
  }),
  
  ...editableFields("Messages", {
    commentEditor: true,
    commentStyles: true,
    permissions: {
      canRead: ['members'],
      canCreate: ['members'],
      canUpdate: userOwns,
    },
    order: 2,
  }),
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    canRead: ['members'],
    canCreate: ['admins'],
    optional: true,
    nullable: false,
    hidden: true,
  },
  conversationId: {
    ...foreignKeyField({
      idFieldName: "conversationId",
      resolverName: "conversation",
      collectionName: "Conversations",
      type: "Conversation",
      nullable: false,
    }),
    canRead: ['members'],
    canCreate: ['members'],
    nullable: false,
    hidden: true,
  },
  noEmail: {
    optional: true,
    type: Boolean,
    canRead: ['admins'],
    canCreate: ['admins'],
    ...schemaDefaultValue(false)
  },
};

export default schema;
