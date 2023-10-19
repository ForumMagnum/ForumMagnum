import { createCollection } from '../../vulcan-lib';
import { Utils, slugify } from '../../vulcan-lib/utils';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { schemaDefaultValue } from '../../utils/schemaUtils';
import { foreignKeyField } from '../../utils/schemaUtils'
import './fragments';
import './permissions';
import { userOwns } from '../../vulcan-users/permissions';
import moment from 'moment'
import { makeEditable } from '../../editor/make_editable';
import { forumTypeSetting } from '../../instanceSettings';

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
    canRead: ['guests'],
    nullable: false,
    onInsert: (gardenCode) => {
      return generateCode(4)
    },
  },
  title: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    label: "Event Name",
    defaultValue: "Guest Day Pass",
    nullable: false,
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
    canRead: ['guests'],
    optional: true,
    nullable: false,
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
    canRead: ['guests'],
    nullable: false,
    onInsert: async (gardenCode) => {
      return await Utils.getUnusedSlugByCollectionName("GardenCodes", slugify(gardenCode.title))
    },
  },
  startTime: {
    type: Date,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'datetime',
    label: "Start Time",
    optional: true,
    onInsert: () => new Date(),
    order: 20
  },
  endTime: {
    type: Date,
    canRead: ['guests'],
    canUpdate: ['admins'],
    // canCreate: ['members'],
    control: 'datetime',
    label: "End Time",
    optional: true,
    nullable: false,
    order: 25,
    onInsert: (gardenCode) => {
      return moment(gardenCode.startTime).add(12, 'hours').toDate()
    }
  },
  fbLink: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    label: "FB Event Link",
    optional: true,
    order: 25
  },
  type: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
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
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    order: 32,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    ...schemaDefaultValue(false),
    order: 35
  },
  afOnly: {
    type: Boolean,
    label: "Limit attendance to AI Alignment Forum members",
    canRead: ['guests'],
    canCreate: ['alignmentForum'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    optional: true, 
    ...schemaDefaultValue(false),
    order: 36,
    control: 'checkbox'
  }

  // validOnlyWithHost: {
  //   type: Boolean,
  //   canRead: ['guests'],
  //   canCreate: ['members'],
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
  collectionType: 'pg',
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
