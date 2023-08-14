import { useQuery, gql } from "@apollo/client";
import { useRef, useState } from "react";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import qs from "qs";

export type PostAnalytics2Result = {
  _id: string;
  title: string;
  slug: string;
  postedAt: Date;
  views: number;
  reads: number;
  karma: number;
  comments: number;
};

export type AuthorAnalyticsResult = {
  posts: PostAnalytics2Result[];
  totalCount: number;
  // TODO overall series for the graph
};

type AuthorAnalyticsQueryResult = {
  AuthorAnalytics: AuthorAnalyticsResult;
};

export const useAuthorAnalytics = ({
  userId,
  sortBy,
  desc,
  initialLimit = 10,
  itemsPerPage = 20,
  queryLimitName = "postsLimit",
}: {
  userId?: string;
  sortBy?: string;
  desc?: boolean;
  initialLimit?: number;
  itemsPerPage?: number;
  queryLimitName?: string;
}) => {
  const AuthorAnalyticsQuery = gql`
    query AuthorAnalyticsQuery($userId: String!, $sortBy: String, $desc: Boolean, $limit: Int) {
      AuthorAnalytics(userId: $userId, sortBy: $sortBy, desc: $desc, limit: $limit) {
        posts {
          _id
          title
          slug
          postedAt
          views
          reads
          karma
          comments
        }
        totalCount
      }
    }
  `;

  const { query: locationQuery } = useLocation();
  const { history } = useNavigation();

  const locationQueryLimit = locationQuery && queryLimitName && !isNaN(parseInt(locationQuery[queryLimitName])) ? parseInt(locationQuery[queryLimitName]) : undefined;
  const defaultLimit = useRef(locationQueryLimit ?? initialLimit);

  const [effectiveLimit, setEffectiveLimit] = useState(defaultLimit.current);
  const [moreLoading, setMoreLoading] = useState(false);

  const variables = { userId, sortBy, desc, limit: defaultLimit.current };
  const { data, loading, error, fetchMore } = useQuery<AuthorAnalyticsQueryResult>(AuthorAnalyticsQuery, {
    variables,
    skip: !userId,
  });

  const totalCount = (data?.AuthorAnalytics?.totalCount ?? 0)
  const count = (data?.AuthorAnalytics?.posts?.length ?? 0)
  const showLoadMore = userId && (count < totalCount);

  const loadMore = async (limitOverride?: number) => {
    const newLimit = limitOverride || effectiveLimit + itemsPerPage;
    const newQuery = {...locationQuery, [queryLimitName]: newLimit}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})

    setMoreLoading(true);
    void fetchMore({
      variables: {
        ...variables,
        limit: newLimit,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        setMoreLoading(false);
        if (!fetchMoreResult) return prev;
        return fetchMoreResult;
      },
    });
    setEffectiveLimit(newLimit);
  };

  const loadMoreProps = {
    loadMore,
    count,
    totalCount,
    loading: loading || moreLoading,
    hidden: !showLoadMore,
  };

  return {
    authorAnalytics: data?.AuthorAnalytics,
    loading,
    error,
    loadMoreProps
  };
};
