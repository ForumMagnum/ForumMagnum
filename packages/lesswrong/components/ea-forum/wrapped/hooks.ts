import { gql, useQuery } from "@apollo/client";

// addGraphQLSchema(`
//   type MostReadAuthor {
//     slug: String,
//     displayName: String,
//     count: Int
//   }
//   type MostReadTopic {
//     slug: String,
//     name: String,
//     count: Int
//   }
//   type WrappedDataByYear {
//     alignment: String,
//     totalSeconds: Int,
//     engagementPercentile: Float,
//     postsReadCount: Int,
//     mostReadAuthors: [MostReadAuthor],
//     mostReadTopics: [MostReadTopic],
//     postCount: Int,
//     topPost: Post,
//     commentCount: Int,
//     topComment: Comment,
//     shortformCount: Int,
//     topShortform: Comment,
//     karmaChange: Int
//   }
// `)

// // TODO remove all the V2s when done
// addGraphQLSchema(`
//   type TagReadLikelihoodRatio {
//     tagId: String,
//     tagName: String,
//     readLikelihoodRatio: Float
//   }
//   type MostReadAuthorV2 {
//     slug: String,
//     displayName: String,
//     count: Int,
//     engagementPercentile: Float
//   }
//   type MostReceivedReact {
//     name: String,
//     count: Int
//   }
//   type IntSeriesValue {
//     date: String!,
//     value: Int!
//   }
//   type WrappedDataByYearV2 {
//     engagementPercentile: Float,
//     postsReadCount: Int,
//     totalSeconds: Int,
//     daysVisited: [String],
//     mostReadTopics: [MostReadTopic],
//     relativeMostReadCoreTopics: [TagReadLikelihoodRatio]
//     mostReadAuthors: [MostReadAuthorV2],
//     topPost: Post,
//     postCount: Int,
//     authorPercentile: Float,
//     topComment: Comment,
//     commentCount: Int,
//     commenterPercentile: Float,
//     topShortform: Comment,
//     shortformCount: Int,
//     shortformPercentile: Float,
//     karmaChange: Int,
//     postKarmaChanges: [IntSeriesValue],
//     commentKarmaChanges: [IntSeriesValue],
//     mostReceivedReacts: [MostReceivedReact],
//     alignment: String,
//   }
// `);

type WrappedDataByYearV2 = {
  engagementPercentile: number;
  postsReadCount: number;
  totalSeconds: number;
  daysVisited: string[];
  mostReadTopics: {
    name: string;
    slug: string;
    count: number;
  }[];
  relativeMostReadCoreTopics: {
    tagId: string;
    tagName: string;
    readLikelihoodRatio: number;
  }[];
  mostReadAuthors: {
    displayName: string;
    slug: string;
    count: number;
    engagementPercentile: number;
  }[];
  topPost: {
    _id: string;
    title: string;
    slug: string;
    baseScore: number;
  };
  postCount: number;
  authorPercentile: number;
  topComment: {
    _id: string;
    postId: string;
    baseScore: number;
    contents: {
      plaintextMainText: string;
    };
  };
  commentCount: number;
  commenterPercentile: number;
  topShortform: {
    _id: string;
    postId: string;
    baseScore: number;
    contents: {
      plaintextMainText: string;
    };
  };
  shortformCount: number;
  shortformPercentile: number;
  karmaChange: number;
  postKarmaChanges: {
    date: string;
    value: number;
  }[];
  commentKarmaChanges: {
    date: string;
    value: number;
  }[];
  mostReceivedReacts: {
    name: string;
    count: number;
  }[];
  alignment: string;
};

type WrappedDataQueryResult = {
  UserWrappedDataByYearV2: WrappedDataByYearV2;
};

// TODO Rename to just useForumWrapped
export const useForumWrappedV2 = ({ userId, year }: { userId?: string | null; year: number }) => {
  const { data, loading } = useQuery<WrappedDataQueryResult>(
    gql`
      query getWrappedData($userId: String!, $year: Int!) {
        UserWrappedDataByYearV2(userId: $userId, year: $year) {
          engagementPercentile
          postsReadCount
          totalSeconds
          daysVisited
          mostReadTopics {
            name
            slug
            count
          }
          relativeMostReadCoreTopics {
            tagId
            tagName
            readLikelihoodRatio
          }
          mostReadAuthors {
            displayName
            slug
            count
            engagementPercentile
          }
          topPost {
            _id
            title
            slug
            baseScore
          }
          postCount
          authorPercentile
          topComment {
            _id
            postId
            baseScore
            contents {
              plaintextMainText
            }
          }
          commentCount
          commenterPercentile
          topShortform {
            _id
            postId
            baseScore
            contents {
              plaintextMainText
            }
          }
          shortformCount
          shortformPercentile
          karmaChange
          postKarmaChanges {
            date
            value
          }
          commentKarmaChanges {
            date
            value
          }
          mostReceivedReacts {
            name
            count
          }
          alignment
        }
      }
    `,
    {
      variables: {
        userId,
        year,
      },
      ssr: true,
      skip: !userId,
    }
  );

  return { data: data?.UserWrappedDataByYearV2, loading };
};
