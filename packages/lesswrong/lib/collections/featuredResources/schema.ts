const schema: SchemaType<DbFeaturedResource> = {
  title: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  body: {
    type: String,
    nullable: true, //missing values for EA Forum
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  ctaText: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  ctaUrl: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'EditUrl'
  },
  expiresAt: {
    type: Date,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: true,
    nullable: false,
    control: 'datetime',
  },
}

export default schema;
