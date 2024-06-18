import { foreignKeyField } from "@/lib/utils/schemaUtils";

const schema: SchemaType<"Digests"> = {
  // the digest number (should correspond with the email digest)
  num: {
    type: Number,
    optional: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'number',
  },
  // the start of the range of eligible posts (just used to filter posts for the Edit Digest page)
  startDate: {
    type: Date,
    optional: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'datetime',
  },
  // the end of the range of eligible posts (just used to filter posts for the Edit Digest page)
  // TODO: this is currently also used to determine when the on-site digest is publicly accessible,
  // though probably we should use the publishedDate instead :shrug:
  endDate: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'datetime',
  },
  // when this digest was published (TODO: currently not used but probably should be)
  publishedDate: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'datetime',
  },
  // Cloudinary image id for the on-site digest background image (high resolution)
  onsiteImageId: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: "ImageUpload",
  },
  // primary color for the on-site digest background
  // - fades onto the image so chosen to match
  onsitePrimaryColor: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: "FormComponentColorPicker",
  },
  // the id for the matching post, in which we've replicated the email version of the digest
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: true,
    nullable: true,
  },
};

export default schema;
