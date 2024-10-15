import { getAdminTeamAccount } from '@/server/callbacks/commentCallbacks';
import { schemaDefaultValue } from '../../utils/schemaUtils';
import { Revisions } from '../revisions/collection';

const schema: SchemaType<"JargonTerms"> = {
  postId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    nullable: false,
  },
  term: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    order: 10
  },
  humansAndOrAIEdited: {
    type: String,
    resolveAs: {
      type: 'String',
      resolver: async (post: DbJargonTerm, args: void, context: ResolverContext) => {
        const botAccount = await getAdminTeamAccount()
        const earliestRevision = await Revisions.findOne(
          { documentId: post.postId, documentType: 'jargonTerm' },
          { sort: { createdAt: 1 } }
        );
        const latestRevision = await Revisions.findOne(
          { documentId: post.postId, documentType: 'jargonTerm' },
          { sort: { createdAt: -1 } }
        );
        const madeByAI = earliestRevision?.userId == botAccount?._id
        const editedByHumans = latestRevision?.userId != botAccount?._id
        if (madeByAI && editedByHumans) {
          return 'humansAndAI'
        } else if (!madeByAI && editedByHumans) {
          return 'humans'
        } else {
          return 'AI'
        }
      }
    },
    optional: false,
    nullable: false,
    ...schemaDefaultValue('humans'),
  },
  forLaTeX: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    // This is here while we're developing, but it might want to be something the user can change later
    hidden: true,
    ...schemaDefaultValue(false),
  },
  rejected: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  altTerms: {
    type: Array,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    label: "Alternative Terms",
    order: 30,
    tooltip: "Comma-separated, no spaces",
    ...schemaDefaultValue([]),
  },
  'altTerms.$': {
    type: String,
  },
};

export default schema;
