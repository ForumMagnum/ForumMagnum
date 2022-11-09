import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';
import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbAdvisorRequest> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    hidden: true,
    insertableBy: ['members', 'admins'],
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  timezone: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
    control: "select",
    form: {
      options: () => new Array(24).fill(0).map((n, i) => ({value: i - 11, label: `UTC ${i - 11 >= 0 ? "+" : ""}${i - 11}`})),
    },
  },
  availability: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  questions: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  linkedinProfile: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  previousExperience: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  selectedAdvisors: {
    optional: true,
    type: Array,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
  'selectedAdvisors.$': {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
  },
  referrer: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
    editableBy: [userOwns, 'admins'],
  },
};

export default schema;
