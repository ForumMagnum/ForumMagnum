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
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['guests'],
    onInsert: (document, currentUser) => new Date(),
  },
  timezone: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
  },
  availability: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
  },
  questions: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
  },
  linkedinProfile: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
  },
  previousExperience: {
    optional: true,
    type: String,
    viewableBy: [userOwns, 'admins'],
  },
  selectedAdvisors: {
    optional: true,
    type: Array,
    viewableBy: [userOwns, 'admins'],
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
  },
};

export default schema;
