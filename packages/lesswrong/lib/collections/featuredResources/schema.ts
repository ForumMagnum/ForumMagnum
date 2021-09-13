const schema: SchemaType<DbFeaturedResource> = {
  title: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  body: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  ctaText: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  ctaUrl: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  isActive: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  expiresAt: {
    type: Date,
    canRead: ['guests'],
    canUpdate: ['sunshineRegiment', 'admins'],
    optional: true,
  },
}

export default schema;
