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
  // the id for the matching email campaign in Mailchimp, i.e. the "id" value in
  // https://us8.campaign-archive.com/?u=52b028e7f799cca137ef74763&id=8aef8ff044
  mailchimpId: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
};

export default schema;
