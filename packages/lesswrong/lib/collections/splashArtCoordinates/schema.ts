export const schema = { // : SchemaType<"SplashArtCoordinates"> = { 
  postId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  imageId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  splashArtImageUrl: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    optional: true,
    nullable: true,
  },
  logTime: {
    type: Date,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: false,
    nullable: false,
  },
  xCoordinate: {
    type: Number,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: false,
    nullable: false,
  },
  yCoordinate: {
    type: Number,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: false,
    nullable: false,
  },
  width: {
    type: Number,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: false,
    nullable: false,
  },
  height: {
    type: Number,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: false,
    nullable: false,
  },
}

export default schema;
