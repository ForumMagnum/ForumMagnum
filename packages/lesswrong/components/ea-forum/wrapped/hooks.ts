import { gql, useQuery } from "@apollo/client";

// TODO Rename to just useForumWrapped
export const useForumWrappedV2 = ({ userId, year }: { userId?: string | null; year: number }) => {

  // type MostReadAuthorV2 {
  //   slug: String,
  //   displayName: String,
  //   count: Int,
  //   engagementPercentile: Float
  // }
  // type MostReceivedReact {
  //   name: String,
  //   count: Int
  // }
  // type IntSeriesValue {
  //   date: String!,
  //   value: Int!
  // }
  // type WrappedDataByYearV2 {
  //   engagementPercentile: Float,
  //   postsReadCount: Int,
  //   totalSeconds: Int,
  //   daysVisited: [String],
  //   mostReadTopics: [MostReadTopic],
  //   relativeMostReadTopics: [JSON]
  //   relativeLeastReadTopics: [JSON]
  //   mostReadAuthors: [MostReadAuthorV2],
  //   topPost: Post,
  //   postCount: Int,
  //   authorPercentile: Float,
  //   topComment: Comment,
  //   commentCount: Int,
  //   commenterPercentile: Float,
  //   topShortform: Comment,
  //   shortformCount: Int,
  //   shortformPercentile: Float,
  //   karmaChange: Int,
  //   postKarmaChanges: [IntSeriesValue],
  //   commentKarmaChanges: [IntSeriesValue],
  //   mostReceivedReacts: [MostReceivedReact],
  //   alignment: String,
  // }
  const { data, loading } = useQuery(
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
          relativeMostReadTopics
          relativeLeastReadTopics
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
