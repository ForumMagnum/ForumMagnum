import { universalFields } from "@/lib/collectionUtils";
import { editableFields } from "@/lib/editor/make_editable";
import { slugFields, schemaDefaultValue, foreignKeyField } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users/permissions";
import moment from "moment";

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
];

const schema: SchemaType<"GardenCodes"> = {
  ...universalFields({}),
  ...editableFields("GardenCodes", {
    pingbacks: true,
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }),

  ...slugFields("GardenCodes", {
    getTitle: (gc) => gc.title,
    includesOldSlugs: false,
  }),
  
  code: {
    type: String,
    optional: true,
    canRead: ['guests'],
    nullable: false,
    onCreate: () => {
      return generateCode(4)
    },
  },
  title: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    label: "Event Name",
    ...schemaDefaultValue("Guest Day Pass"),
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
  startTime: {
    type: Date,
    canRead: ['guests'],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members'],
    control: 'datetime',
    label: "Start Time",
    optional: true,
    onCreate: () => new Date(),
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
    onCreate: ({document: gardenCode}) => {
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
      options: () => eventTypes
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

export default schema;
