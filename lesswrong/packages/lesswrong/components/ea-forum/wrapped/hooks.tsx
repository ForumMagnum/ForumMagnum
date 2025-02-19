import React, {
  ComponentType,
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Components } from "@/lib/vulcan-lib";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { gql, useQuery } from "@apollo/client";
import { useRecommendations } from "@/components/recommendations/withRecommendations";
import { getTopAuthor, getTotalReactsReceived } from "./wrappedHelpers";
import { userCanStartConversations } from "@/lib/collections/conversations/collection";
import { LoadMoreProps, useMulti } from "@/lib/crud/withMulti";

// When adding a new year you'll need to run the server command to update the
// analytics views:
//   ./scripts/serverShellCommand.sh "Globals.triggerWrappedRefresh()"
const wrappedYears = new TupleSet([2022, 2023, 2024] as const)

export type WrappedYear = UnionOf<typeof wrappedYears>

export const isWrappedYear = (year: number): year is WrappedYear =>
  wrappedYears.has(year);

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
  personality: string,
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
      personality
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

type WrappedSection = {
  component: ComponentType,
  predicate?: (data: WrappedDataByYear, currentUser: UsersCurrent) => boolean,
};

const allSections: WrappedSection[] = [
  {component: Components.WrappedWelcomeSection},
  {
    component: Components.WrappedTimeSpentSection,
    predicate: (data) => data.totalSeconds > 300,
  },
  {
    component: Components.WrappedDaysVisitedSection,
    predicate: (data) => data.daysVisited.length > 0,
  },
  {
    component: Components.WrappedMostReadTopicsSection,
    predicate: (data) => data.mostReadTopics.length > 0,
  },
  {
    component: Components.WrappedRelativeMostReadTopicsSection,
    predicate: (data) => data.relativeMostReadCoreTopics.length > 0,
  },
  {
    component: Components.WrappedMostReadAuthorSection,
    predicate: (data) => data.postsReadCount > 0 && data.mostReadAuthors.length > 0,
  },
  {
    component: Components.WrappedThankAuthorSection,
    predicate: (data, currentUser) => {
      const {
        topAuthorByEngagementPercentile,
        topAuthorPercentByEngagementPercentile,
      } = getTopAuthor(data);
      return !!topAuthorByEngagementPercentile &&
        topAuthorPercentByEngagementPercentile <= 10 &&
        userCanStartConversations(currentUser);
    },
  },
  {component: Components.WrappedPersonalitySection},
  {
    component: Components.WrappedTopPostSection,
    predicate: (data) =>
      !!data.topPosts &&
      data.topPosts.length > 0 &&
      data.topPosts[0].baseScore >= 10,
  },
  {
    component: Components.WrappedTopCommentSection,
    predicate: (data) =>
      !!data.topComment &&
      data.topComment.baseScore > 0,
  },
  {
    component: Components.WrappedTopQuickTakeSection,
    predicate: (data) =>
      !!data.topShortform &&
      data.topShortform.baseScore > 0,
  },
  {
    component: Components.WrappedKarmaChangeSection,
    predicate: (data) => !!data.karmaChange,
  },
  {
    component: Components.WrappedReceivedReactsSection,
    predicate: (data) => getTotalReactsReceived(data) > 5,
  },
  {component: Components.WrappedSummarySection},
  {component: Components.WrappedRecommendationsSection},
  {component: Components.WrappedMostValuablePostsSection},
  {component: Components.WrappedThankYouSection},
];

type ForumWrappedContext = {
  year: WrappedYear,
  data: WrappedDataByYear,
  currentUser: UsersCurrent,
  totalSections: number,
  currentSection: number,
  goToPreviousSection: () => void,
  goToNextSection: () => void,
  CurrentSection: ComponentType,
  recommendations: PostsListWithVotesAndSequence[],
  mostValuablePosts: PostsListWithVotes[],
  mostValuablePostsLoading: boolean,
  mostValuablePostsLoadMoreProps: LoadMoreProps,
  thinkingVideoRef: RefObject<HTMLVideoElement>,
  personalityVideoRef: RefObject<HTMLVideoElement>,
}

const forumWrappedContext = createContext<ForumWrappedContext | null>(null);

const useVotes = (year: WrappedYear, voteType: string) => {
  const {results} = useMulti({
    terms: {
      view: "userPostVotes",
      collectionName: "Posts",
      voteType,
      after: `${year}-01-01`,
      before: `${year + 1}-01-01`,
    },
    collectionName: "Votes",
    fragmentName: "UserVotes",
    limit: 100,
    ssr: false,
  });
  return (results ?? []).map(({documentId}) => documentId);
}

export const ForumWrappedProvider = ({
  year,
  data,
  currentUser,
  children,
}: {
  year: WrappedYear,
  data: WrappedDataByYear,
  currentUser: UsersCurrent,
  children: ReactNode,
}) => {
  const [currentSection, setCurrentSection] = useState(0);

  const sections = allSections.filter((section) => {
    return section.predicate ? section.predicate(data, currentUser) : true;
  });

  const lastSectionIndex = sections.length - 1;
  const goToPreviousSection = useCallback(() => {
    setCurrentSection((current) => Math.max(current - 1, 0));
  }, []);
  const goToNextSection = useCallback(() => {
    setCurrentSection((current) => Math.min(current + 1, lastSectionIndex));
  }, [lastSectionIndex]);

  const {recommendations} = useRecommendations({
    algorithm: {
      strategy: {name: "wrapped", year, postId: ""},
      count: 5,
    },
    ssr: false,
  });

  const bigUpvotePostIds = useVotes(year, "bigUpvote");
  const smallUpvotePostIds = useVotes(year, "smallUpvote");

  const {
    results: mostValuablePosts = [],
    loading: mostValuablePostsLoading,
    loadMoreProps: mostValuablePostsLoadMoreProps,
  } = useMulti({
    terms: {
      view: "nominatablePostsByVote",
      postIds: [...bigUpvotePostIds, ...smallUpvotePostIds],
    },
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
    limit: 20,
    itemsPerPage: 40,
  });

  const thinkingVideoRef = useRef<HTMLVideoElement>(null);
  const personalityVideoRef = useRef<HTMLVideoElement>(null);

  return (
    <forumWrappedContext.Provider value={{
      year,
      data,
      currentUser,
      totalSections: sections.length,
      currentSection,
      goToPreviousSection,
      goToNextSection,
      CurrentSection: sections[currentSection].component,
      recommendations: recommendations ?? [],
      mostValuablePosts,
      mostValuablePostsLoading,
      mostValuablePostsLoadMoreProps,
      thinkingVideoRef,
      personalityVideoRef,
    }}>
      {children}
    </forumWrappedContext.Provider>
  );
}

export const useForumWrappedContext = () => {
  const context = useContext(forumWrappedContext);
  if (!context) {
    throw new Error("Using forum wrapped context outside of provider");
  }
  return context;
}
