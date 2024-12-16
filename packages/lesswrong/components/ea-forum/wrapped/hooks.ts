import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { gql, useQuery } from "@apollo/client";

export type WrappedMostReadTopic = {
  name: string;
  shortName: string;
  slug: string;
  count: number;
}
export type WrappedRelativeMostReadCoreTopic = {
  tagId: string;
  tagName: string;
  tagShortName: string;
  userReadCount: number;
  readLikelihoodRatio: number;
}
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
export type WrappedTopComment = {
  _id: string;
  postedAt: Date;
  postId: string;
  postTitle: string;
  postSlug: string;
  baseScore: number;
  extendedScore: JSON;
  contents: {
    html: string;
  };
}
export type WrappedTopShortform = {
  _id: string;
  postedAt: Date;
  postId: string;
  baseScore: number;
  extendedScore: JSON;
  contents: {
    html: string;
  };
}
export type WrappedReceivedReact = {
  name: string;
  count: number;
}

export type WrappedDataByYear = {
  engagementPercentile: number;
  postsReadCount: number;
  totalSeconds: number;
  daysVisited: string[];
  mostReadTopics: WrappedMostReadTopic[];
  relativeMostReadCoreTopics: WrappedRelativeMostReadCoreTopic[];
  mostReadAuthors: WrappedMostReadAuthor[];
  topPosts: WrappedTopPost[];
  postCount: number;
  authorPercentile: number;
  topComment: WrappedTopComment;
  commentCount: number;
  commenterPercentile: number;
  topShortform: WrappedTopShortform;
  shortformCount: number;
  shortformPercentile: number;
  karmaChange: number;
  combinedKarmaVals: {
    date: Date;
    postKarma: number;
    commentKarma: number;
  }[];
  mostReceivedReacts: WrappedReceivedReact[];
};

type WrappedDataQueryResult = {
  UserWrappedDataByYear: WrappedDataByYear;
};

const query = gql`
  query getWrappedData($userId: String!, $year: Int!) {
    UserWrappedDataByYear(userId: $userId, year: $year) {
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
        postedAt
        postId
        postTitle
        postSlug
        baseScore
        extendedScore
        contents {
          html
        }
      }
      commentCount
      commenterPercentile
      topShortform {
        _id
        postedAt
        postId
        baseScore
        extendedScore
        contents {
          html
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
    }
  }
`;

export const useForumWrapped = ({ userId, year }: { userId?: string | null; year: number }) => {
  const { data, loading } = useQuery<WrappedDataQueryResult>(
    query,
    {
      variables: {
        userId,
        year,
      },
      ssr: true,
      skip: !userId,
    }
  );

  return { data: data?.UserWrappedDataByYear, loading };
};

const wrappedYears = new TupleSet([2022, 2023, 2024] as const)

export type WrappedYear = UnionOf<typeof wrappedYears>

export const isWrappedYear = (year: number): year is WrappedYear =>
  wrappedYears.has(year);
