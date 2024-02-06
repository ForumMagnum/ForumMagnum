import { foreignKeyField } from '../../utils/schemaUtils'

export const schema: SchemaType<"SplashArtCoordinates"> = { 
  reviewWinnerArtId: {
    ...foreignKeyField({
      idFieldName: "reviewWinnerArtId",
      resolverName: "reviewWinnerArt",
      collectionName: "ReviewWinnerArts",
      type: "ReviewWinnerArt",
      nullable: false,
    }),
    nullable: false,
    canCreate: ['admins'],
    canRead: ['admins'],
    canUpdate: ['admins'],
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
