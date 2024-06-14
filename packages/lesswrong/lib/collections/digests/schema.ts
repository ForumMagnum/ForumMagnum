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
  endDate: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'datetime',
  },
  // when this digest was published
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
};

export default schema;
