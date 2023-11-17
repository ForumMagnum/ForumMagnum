const schema: SchemaType<DbDigest> = {
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
  }
};

export default schema;
