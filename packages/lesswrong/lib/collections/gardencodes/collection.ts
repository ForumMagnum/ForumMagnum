import { createCollection } from '../../vulcan-lib';
import { Utils, slugify } from '../../vulcan-lib/utils';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, schemaDefaultValue } from '../../collectionUtils'
import { foreignKeyField } from '../../utils/schemaUtils'
import './fragments';
import './permissions';
import { userOwns } from '../../vulcan-users/permissions';
import moment from 'moment'
import { makeEditable } from '../../editor/make_editable';

function generateCode(length: number) {
  let result = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const eventTypes = [
  {
    value: "public",
    label: "Displayed on the public Garden Calendar",
  },
  {
    value: "private",
    label: "Displayed only to you",
  }
]

const schema: SchemaType<DbGardenCode> = {
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
    editableBy: [userOwns, 'sunshineRegiment', 'admins'],
    label: "Event Name",
    defaultValue: "Guest Day Pass",
    order: 10
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    onCreate: ({currentUser}) => currentUser!._id,
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
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    onInsert: async (gardenCode) => {
      return await Utils.getUnusedSlugByCollectionName("GardenCodes", slugify(gardenCode.title))
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
    onInsert: () => new Date(),
    order: 20
  },
  endTime: {
    type: Date,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    // insertableBy: ['members'],
    control: 'datetime',
    label: "End Time",
    optional: true,
    order: 25,
    onInsert: (gardenCode) => {
      return moment(gardenCode.startTime).add(12, 'hours').toDate()
    }
  },
  fbLink: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [userOwns, 'sunshineRegiment', 'admins'],
    label: "FB Event Link",
    optional: true,
    order: 25
  },
  type: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: [userOwns, 'sunshineRegiment', 'admins'],
    label: "Event Visibility:",
    optional: true,
    control: "radiogroup",
    ...schemaDefaultValue(eventTypes[0].value),
    form: {
      options: eventTypes
    },
    order: 30,
  },
  hidden: {
    type: Boolean,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    order: 32,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  deleted: {
    type: Boolean,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    optional: true,
    ...schemaDefaultValue(false),
    order: 35
  },
  afOnly: {
    type: Boolean,
    label: "Limit attendance to AI Alignment Forum members",
    viewableBy: ['guests'],
    insertableBy: ['alignmentForum'],
    editableBy: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true, 
    ...schemaDefaultValue(false),
    order: 36,
    control: 'checkbox'
  }

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
export const GardenCodes: GardenCodesCollection = createCollection({
  collectionName: 'GardenCodes',
  typeName: 'GardenCode',
  schema,
  resolvers: getDefaultResolvers('GardenCodes'),
  mutations: getDefaultMutations('GardenCodes'), //, options),
  logChanges: true,
});

addUniversalFields({collection: GardenCodes})

makeEditable({
  collection: GardenCodes,
  options: {
    pingbacks: true,
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }
})

export default GardenCodes;
