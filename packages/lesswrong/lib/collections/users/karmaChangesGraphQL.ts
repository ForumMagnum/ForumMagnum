import Users from "../users/collection";
import { userOwns } from '../../vulcan-users/permissions';
import { addFieldsDict } from '../../utils/schemaUtils';
import { addGraphQLSchema, addGraphQLResolvers } from '../../vulcan-lib';

addGraphQLSchema(`
  type PostKarmaChange {
    _id: String
    scoreChange: Int
    title: String
    slug: String
  }
  type CommentKarmaChange {
    _id: String
    scoreChange: Int
    description: String
    postId: String
    tagSlug: String
    tagCommentType: String
  }
  type RevisionsKarmaChange {
    _id: String
    scoreChange: Int
    tagId: String
    tagSlug: String
    tagName: String
  }
  type KarmaChanges {
    totalChange: Int
    startDate: Date
    endDate: Date
    nextBatchDate: Date
    updateFrequency: String
    posts: [PostKarmaChange]
    comments: [CommentKarmaChange]
    tagRevisions: [RevisionsKarmaChange]
  }
`);

addGraphQLResolvers({
  KarmaChanges: {
    updateFrequency: async (karmaChangesJSON: any, args: void, context: ResolverContext) => {
      const { currentUser } = context;
      if (!currentUser) return null;
      const settings = currentUser.karmaChangeNotifierSettings
      return settings.updateFrequency;
    },
  }
})

addFieldsDict(Users, {
  "karmaChanges": {
    canRead: userOwns,
    type: "KarmaChanges",
    optional: true,
  }
});
