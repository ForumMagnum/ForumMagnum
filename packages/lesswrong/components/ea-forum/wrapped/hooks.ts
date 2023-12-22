import { gql, useQuery } from "@apollo/client";

export type WrappedMostReadAuthor = {
  _id: string;
  displayName: string;
  slug: string;
  profileImageId: string;
  count: number;
  engagementPercentile: number;
}
export type WrappedTopPost = {
  _id: string;
  title: string;
  slug: string;
  baseScore: number;
}
export type WrappedReceivedReact = {
  name: string;
  count: number;
}

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
    tagShortName: string;
    userReadCount: number;
    readLikelihoodRatio: number;
  }[];
  mostReadAuthors: WrappedMostReadAuthor[];
  topPosts: WrappedTopPost[];
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
  combinedKarmaVals: {
    date: Date;
    postKarma: number;
    commentKarma: number;
  }[];
  mostReceivedReacts: WrappedReceivedReact[];
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
            shortName
            slug
            count
          }
          relativeMostReadCoreTopics {
            tagId
            tagName
            tagShortName
            userReadCount
            readLikelihoodRatio
          }
          mostReadAuthors {
            _id
            displayName
            slug
            profileImageId
            count
            engagementPercentile
          }
          topPosts {
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
          combinedKarmaVals {
            date
            postKarma
            commentKarma
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
