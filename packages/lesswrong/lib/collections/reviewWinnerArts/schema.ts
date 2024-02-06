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
    optional: false,
    nullable: false,
  },
  splashArtImageUrl: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    optional: false,
    nullable: false,
  },
}
