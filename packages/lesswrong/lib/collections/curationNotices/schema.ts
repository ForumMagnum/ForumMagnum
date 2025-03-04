import { editableFields } from '@/lib/editor/make_editable';
import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<"CurationNotices"> = {
  ...editableFields("CurationNotices", {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }),
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    nullable: false,
    canRead: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
  commentId: {
    ...foreignKeyField({
        idFieldName: "commentId",
        resolverName: "comment",
        collectionName: "Comments",
        type: "Comment",
        nullable: true,
    }),
    canRead: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    optional: true,
    nullable: true,
    hidden: true,
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: ['sunshineRegiment', 'admins'],
    canCreate: ['sunshineRegiment', 'admins'],
    hidden: true,
  },
  deleted: {
    type: Boolean,
    optional: true,
    nullable: true,
    canRead: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    control: "checkbox",
    ...schemaDefaultValue(false),
  },
}

export default schema;
