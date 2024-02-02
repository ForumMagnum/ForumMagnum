export const schema: SchemaType<"ReviewWinnerArts"> = {
  postId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  reviewYear: {
    type: Number,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  reviewRanking: {
    type: Number,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  postIsAI: {
    type: Boolean,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  splashArtImagePrompt: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    optional: true,
    nullable: true,
  },
  splashArtImageUrl: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    optional: true,
    nullable: true,
  },
}
