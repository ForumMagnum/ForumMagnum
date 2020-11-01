import { createCollection, Utils } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, schemaDefaultValue } from '../../collectionUtils'
import {foreignKeyField, SchemaType} from '../../utils/schemaUtils'
import './fragments';
import './permissions';
import { userOwns } from '../../vulcan-users/permissions';
import moment from 'moment'

function generateCode(length) {
  let result = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const schema: SchemaType<DbGardenCode> = {
  createdAt: {
    optional: true,
    type: Date,
    canRead: ['guests'],
    onInsert: () => new Date(),
  },
  code: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (gardenCode) => {
      return generateCode(4)
    },
  },
  title: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
    label: "Event Name",
    defaultValue: "Guest Day Pass"
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    onCreate: ({currentUser}) => currentUser._id,
    viewableBy: ['guests'],
    optional: true
  },
  // gatherTownUsername: {
  //   optional: true,
  //   type: String,
  //   canRead: ['guests'],
  //   // canUpdate: ['members', 'admins', 'sunshineRegiment'],
  //   canCreate: ['members', 'admins', 'sunshineRegiment'],
  //   label: "Your Walled Garden Username"
  // },
  deleted: {
    type: Boolean,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    ...schemaDefaultValue(false),
  },
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (gardenCode) => {
      return Utils.getUnusedSlugByCollectionName("GardenCodes", Utils.slugify(gardenCode.title))
    },
  },
  startTime: {
    type: Date,
    viewableBy: ['guests'],
    editableBy: [userOwns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members'],
    control: 'datetime',
    label: "Start Time",
    optional: true,
    defaultValue: new Date,
  },
  endTime: {
    type: Date,
    viewableBy: ['guests'],
    // editableBy: ['members'],
    // insertableBy: ['members'],
    control: 'datetime',
    label: "End Time",
    optional: true,
    onInsert: (gardenCode) => {
      return moment(gardenCode.startTime).add(4, 'hours').toDate()
    }
  },
  // validOnlyWithHost: {
  //   type: Boolean,
  //   viewableBy: ['guests'],
  //   insertableBy: ['members'],
  //   optional: true,
  //   label: 'Only valid while host (you) is present',
  //   ...schemaDefaultValue(false),
  // },
};


//
// const options = {
//   newCheck: (user: DbUser|null, document: DbGardenCode|null) => {
//     if (!user || !document) return false;
//     return userCanDo(user, `gardenCodes.new`)
//   },
//
//   editCheck: (user: DbUser|null, document: DbGardenCode|null) => {
//     if (!user || !document) return false;
//     return userCanDo(user, `gardenCode.edit.all`)
//   },
//
//   removeCheck: (user: DbUser|null, document: DbGardenCode|null) => {
//     // Nobody should be allowed to remove documents completely from the DB.
//     // Deletion is handled via the `deleted` flag.
//     return false
//   },
// }
//
export const GardenCodes = createCollection({
  collectionName: 'GardenCodes',
  typeName: 'GardenCode',
  schema,
  resolvers: getDefaultResolvers('GardenCodes'),
  mutations: getDefaultMutations('GardenCodes') //, options),
});

addUniversalFields({collection: GardenCodes})

export default GardenCodes;

