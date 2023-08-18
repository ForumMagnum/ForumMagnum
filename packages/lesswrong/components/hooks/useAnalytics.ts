import { useQuery, gql, ApolloError } from "@apollo/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import qs from "qs";
import { TupleSet, UnionOf } from "../../lib/utils/typeGuardUtils";
import moment from "moment";
import { generateDateSeries } from "../../lib/helpers";
import stringify from "json-stringify-deterministic";

export const analyticsFieldsList = ['views', 'reads', 'karma', 'comments'] as const
export const analyticsFields = new TupleSet(analyticsFieldsList);
export type AnalyticsField = UnionOf<typeof analyticsFields>;

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
};

type AuthorAnalyticsQueryResult = {
  AuthorAnalytics: AuthorAnalyticsResult;
};

export type AnalyticsSeriesValue = ({[key in AnalyticsField]: number | null} & {date: Date});

type AnalyticsSeriesQueryResult = {
  AnalyticsSeries: AnalyticsSeriesValue[];
};

const AuthorAnalyticsQuery = gql`
  query AuthorAnalyticsQuery($userId: String!, $sortBy: String, $desc: Boolean, $limit: Int, $cachedOnly: Boolean) {
    AuthorAnalytics(userId: $userId, sortBy: $sortBy, desc: $desc, limit: $limit, cachedOnly: $cachedOnly) {
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

const AnalyticsSeriesQuery = gql`
  query AnalyticsSeriesQuery($userId: String, $postIds: [String], $startDate: Date, $endDate: Date, $cachedOnly: Boolean) {
    AnalyticsSeries(userId: $userId, postIds: $postIds, startDate: $startDate, endDate: $endDate, cachedOnly: $cachedOnly) {
      date
      views
      reads
      karma
      comments
    }
  }
`;

/**
 * Fetches analytics for a given user, sorted by a given field. The reason for all the complexity here is that it
 * does one fetch for only materialized data and then a followup fetch for the latest data. This is because fetching the
 * latest data can be slow (usually it isn't, but I'm not 100% sure I've ironed out all the performance bugs) and so we
 * don't want to block the page loading on it
 */
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
  const [staleDataAllowed, setStaleDataAllowed] = useState(!["views", "reads"].includes(sortBy ?? ""));
  const nonStaleFetchCountRef = useRef(0);
  const refetchKeyRef = useRef(stringify({userId, sortBy, desc}))

  const { query: locationQuery } = useLocation();
  const { history } = useNavigation();

  const locationQueryLimit = locationQuery && queryLimitName && !isNaN(parseInt(locationQuery[queryLimitName])) ? parseInt(locationQuery[queryLimitName]) : undefined;
  const defaultLimit = useRef(locationQueryLimit ?? initialLimit);

  const [effectiveLimit, setEffectiveLimit] = useState(defaultLimit.current);
  const [moreLoading, setMoreLoading] = useState(false);

  const variables = { userId, sortBy, desc, limit: defaultLimit.current, cachedOnly: staleDataAllowed };
  const { data, loading, error, fetchMore } = useQuery<AuthorAnalyticsQueryResult>(AuthorAnalyticsQuery, {
    variables,
    skip: !userId,
  });

  useEffect(() => {
    if ((staleDataAllowed && data) || ["views", "reads"].includes(sortBy ?? "")) {
      setStaleDataAllowed(false);
    }
  }, [data, sortBy, staleDataAllowed]);
  
  const dataRef = useRef(data?.AuthorAnalytics);
  if ((data?.AuthorAnalytics && data?.AuthorAnalytics !== dataRef.current) || refetchKeyRef.current !== stringify({userId, sortBy, desc})) {
    if (!staleDataAllowed) {
      nonStaleFetchCountRef.current++;
    }
    dataRef.current = data?.AuthorAnalytics;
    refetchKeyRef.current = stringify({userId, sortBy, desc});
  }

  const currentData = dataRef.current;
  const totalCount = currentData?.totalCount ?? 0
  const count = currentData?.posts?.length ?? 0
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
    loading: moreLoading,
    hidden: !showLoadMore,
  };

  return {
    authorAnalytics: dataRef.current,
    loading: loading && nonStaleFetchCountRef.current > 0,
    maybeStale: nonStaleFetchCountRef.current === 0,
    error,
    loadMoreProps
  };
};

export type UseAnalyticsSeriesProps = {
  userId?: string;
  postIds?: string[];
  startDate: Date | null;
  endDate: Date;
}

/**
 * Get the views, reads, karma, comment numbers by day for a particular user or set of postIds. This hook does the following to manage
 * it's internal state:
 * - Fetches materialized data first before checking for and live data that is more recent (for perfomance reasons)
 * - Doesn't refetch if the bounding dates are changed within the range of data it already has
 * - After fetching the absolutely required data for a given range, overfetches by 180 days on either side to avoid having to refetch
 *   when the user changes the date range slightly
 */
export const useAnalyticsSeries = (props: UseAnalyticsSeriesProps): {
  analyticsSeries: AnalyticsSeriesValue[];
  loading: boolean;
  maybeStale: boolean;
  error?: ApolloError
} => {
  const { userId, postIds, startDate: propsStartDate, endDate: propsEndDate } = props;
  // Convert to UTC to ensure args passed to useQuery are consistent between SSR and client
  const utcPropsStartDate = propsStartDate ? moment(propsStartDate).utc().toDate() : null;
  const utcPropsEndDate = moment(propsEndDate).utc().toDate();

  const fetchDateRef = useRef({ startDate: utcPropsStartDate, endDate: utcPropsEndDate });
  
  if (
    (fetchDateRef.current.startDate ?? 0) > (utcPropsStartDate ?? 0) ||
    // If we are changing from null to non-null or vice versa, we need to refetch
    ([fetchDateRef.current.startDate, utcPropsStartDate].includes(null) &&
      fetchDateRef.current.startDate !== utcPropsStartDate)
  )
    fetchDateRef.current.startDate = utcPropsStartDate;
  if (fetchDateRef.current.endDate < utcPropsEndDate) fetchDateRef.current.endDate = utcPropsEndDate;
  
  const { startDate, endDate } = fetchDateRef.current;

  const [activeVariables, setActiveVariables] = useState({});
  const variablesAreActive = stringify(activeVariables) === stringify({ userId, postIds, startDate, endDate });

  const cachedOnly = !variablesAreActive;
  const variables = { userId, postIds, startDate, endDate, cachedOnly };
  const { data, loading, error } = useQuery<AnalyticsSeriesQueryResult>(AnalyticsSeriesQuery, {
    variables,
    skip: !userId && (!postIds || postIds.length === 0),
  });

  useEffect(() => {
    // Once one fetch has returned, set the active variables to trigger a second fetch with:
    // - the dates padded by 180 days on either side
    // - cachedOnly set to false to include the very latest data (see cachedOnly: !variablesAreActive above)
    if (data && !variablesAreActive) {
      const endOfToday = moment().utc().endOf("day").toDate();
      const paddedStartDate = startDate ? moment(startDate).utc().subtract(180, "days").startOf("day").toDate() : null;
      const maxPaddedEndDate = moment(endDate).utc().add(180, "days").endOf("day").toDate();
      const paddedEndDate = maxPaddedEndDate > endOfToday ? endOfToday : maxPaddedEndDate;
      fetchDateRef.current = { startDate: paddedStartDate, endDate: paddedEndDate };

      setActiveVariables({ userId, postIds, startDate: paddedStartDate, endDate: paddedEndDate });
    }
  }, [data, endDate, postIds, startDate, userId, variablesAreActive]);

  const fullSeriesRef = useRef<AnalyticsSeriesValue[]>([]);
  const truncatedSeriesRef = useRef<AnalyticsSeriesValue[]>([]);

  if (data?.AnalyticsSeries && data.AnalyticsSeries !== fullSeriesRef.current) {
    fullSeriesRef.current = data.AnalyticsSeries;
  }

  const fullSeries = fullSeriesRef.current;
  truncatedSeriesRef.current = useMemo(() => {
    const truncated = fullSeries.filter((value) => {
      const date = new Date(value.date);
      return (!utcPropsStartDate || date >= utcPropsStartDate) && date <= utcPropsEndDate;
    });
    
    // Now pad the series with 0 values for any missing dates
    const truncatedStartDate = new Date(truncated[0]?.date ?? utcPropsStartDate);
    const truncatedEndDate = new Date(truncated[truncated.length - 1]?.date ?? utcPropsEndDate);

    if (truncatedStartDate == utcPropsStartDate && truncatedEndDate == utcPropsEndDate) return truncated;
    
    const startPaddingLength = Math.floor(moment.duration(moment(truncatedStartDate).utc().diff(utcPropsStartDate)).asDays());
    const endPaddingLength = Math.floor(moment.duration(moment(utcPropsEndDate).utc().diff(truncatedEndDate)).asDays());
    
    const dateSeries = generateDateSeries(utcPropsStartDate ?? truncatedStartDate, utcPropsEndDate);
    const startSeries = dateSeries.slice(0, startPaddingLength).map((date) => ({ date: new Date(date), views: 0, reads: 0, karma: 0, comments: 0 }));
    const endSeries = dateSeries.slice(dateSeries.length - endPaddingLength).map((date) => ({ date: new Date(date), views: 0, reads: 0, karma: 0, comments: 0 }));

    return [...startSeries, ...truncated, ...endSeries];
  }, [fullSeries, utcPropsEndDate, utcPropsStartDate]);

  return {
    analyticsSeries: truncatedSeriesRef.current,
    loading,
    maybeStale: variablesAreActive && loading,
    error,
  };
};
