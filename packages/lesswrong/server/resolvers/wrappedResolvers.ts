import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../vulcan-lib';
import { isWrappedYear } from '@/components/ea-forum/wrapped/hooks';
import { getWrappedDataByYear } from '../wrapped/wrappedDataByYear';

addGraphQLSchema(`
  type MostReadTopic {
    slug: String,
    name: String,
    shortName: String,
    count: Int
  }
  type TagReadLikelihoodRatio {
    tagId: String,
    tagName: String,
    tagShortName: String,
    userReadCount: Int,
    readLikelihoodRatio: Float
  }
  type MostReadAuthor {
    _id: String,
    slug: String,
    displayName: String,
    profileImageId: String,
    count: Int,
    engagementPercentile: Float
  }
  type TopCommentContents {
    html: String
  }
  type TopComment {
    _id: String,
    postedAt: Date,
    postId: String,
    postTitle: String,
    postSlug: String,
    baseScore: Int,
    extendedScore: JSON,
    contents: TopCommentContents
  }
  type MostReceivedReact {
    name: String,
    count: Int
  }
  type CombinedKarmaVals {
    date: Date!,
    postKarma: Int!,
    commentKarma: Int!
  }
  type WrappedDataByYear {
    engagementPercentile: Float,
    postsReadCount: Int,
    totalSeconds: Int,
    daysVisited: [String],
    mostReadTopics: [MostReadTopic],
    relativeMostReadCoreTopics: [TagReadLikelihoodRatio]
    mostReadAuthors: [MostReadAuthor],
    topPosts: [Post],
    postCount: Int,
    authorPercentile: Float,
    topComment: TopComment,
    commentCount: Int,
    commenterPercentile: Float,
    topShortform: Comment,
    shortformCount: Int,
    shortformPercentile: Float,
    karmaChange: Int,
    combinedKarmaVals: [CombinedKarmaVals],
    mostReceivedReacts: [MostReceivedReact],
    personality: String!,
  }
`);

addGraphQLResolvers({
  Query: {
    async UserWrappedDataByYear(
      _root: void,
      {userId, year}: {userId: string, year: number},
      {currentUser, repos}: ResolverContext,
    ) {
      if (!isWrappedYear(year)) {
        throw new Error(`${year} is not a valid wrapped year`)
      }
      return getWrappedDataByYear(currentUser, userId, year, repos);
    },
  },
})

addGraphQLQuery('UserWrappedDataByYear(userId: String!, year: Int!): WrappedDataByYear')
