const schema: SchemaType<DbFeaturedResource> = {
  title: {
    type: String,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  body: {
    type: String,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  ctaText: {
    type: String,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  ctaUrl: {
    type: String,
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
    control: 'datetime',
  },
}

export default schema;
