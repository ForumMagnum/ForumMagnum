export const schema: SchemaType<"ReviewWinnerArts"> = {
  postId: {
    type: String,
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
