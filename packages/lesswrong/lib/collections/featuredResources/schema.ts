const schema: SchemaType<DbFeaturedResource> = {
  title: {
    type: String,
  },
  body: {
    type: String,
  },
  ctaText: {
    type: String,
  },
  ctaUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
  },
  expiresAt: {
    type: Date,
    optional: true,
  },
}

export default schema;
