import Users from "../users/collection";
import { addFieldsDict } from '../../utils/schemaUtils';
import { addGraphQLSchema, addGraphQLResolvers } from '../../vulcan-lib';

addGraphQLSchema(`
  type PostKarmaChange {
    _id: String
    scoreChange: Int
    title: String
    slug: String
  }
`);

addGraphQLSchema(`
  type CommentKarmaChange {
    _id: String
    scoreChange: Int
    description: String
    postId: String
    tagSlug: String
  }
`);

addGraphQLSchema(`
  type KarmaChanges {
    totalChange: Int
    startDate: Date
    endDate: Date
    nextBatchDate: Date
    updateFrequency: String
    posts: [PostKarmaChange]
    comments: [CommentKarmaChange]
  }
`);

addGraphQLResolvers({
  KarmaChanges: {
    updateFrequency: async (karmaChangesJSON, args, context: ResolverContext) => {
      const { currentUser } = context;
      if (!currentUser) return null;
      const settings = currentUser.karmaChangeNotifierSettings
      return settings.updateFrequency;
    },
  }
})

addFieldsDict(Users, {
  "karmaChanges": {
    viewableBy: Users.owns,
    type: "KarmaChanges",
    optional: true,
  }
});
