import { useQuery, gql, ApolloError } from "@apollo/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  uniqueViews: number;
  reads: number;
  meanReadingTime: number;
  karma: number;
  comments: number;
};

export type MultiPostAnalyticsResult = {
  posts: PostAnalytics2Result[];
  totalCount: number;
};

type MultiPostAnalyticsQueryResult = {
  MultiPostAnalytics: MultiPostAnalyticsResult;
};

export type AnalyticsSeriesValue = ({[key in AnalyticsField]: number | null} & {date: Date});

type AnalyticsSeriesQueryResult = {
  AnalyticsSeries: AnalyticsSeriesValue[];
};

/**
 * Fetches analytics for a given user, sorted by a given field.
 */
export const useMultiPostAnalytics = ({
  userId,
  postIds,
  sortBy,
  desc,
  initialLimit = 10,
  itemsPerPage = 20,
}: {
  userId?: string;
  postIds?: string[];
  sortBy?: string;
  desc?: boolean;
  initialLimit?: number;
  itemsPerPage?: number;
}) => {
  const [limit, setLimit] = useState(initialLimit);
  const [moreLoading, setMoreLoading] = useState(false);

  const variables = useMemo(() => ({
    userId,
    postIds,
    sortBy,
    desc,
    limit,
  }), [userId, postIds, sortBy, desc, limit]);

  const { data, loading, error, fetchMore } = useQuery<MultiPostAnalyticsQueryResult>(gql`
    query MultiPostAnalyticsQuery($userId: String, $postIds: [String], $sortBy: String, $desc: Boolean, $limit: Int) {
      MultiPostAnalytics(userId: $userId, postIds: $postIds, sortBy: $sortBy, desc: $desc, limit: $limit) {
        posts {
          _id
          title
          slug
          postedAt
          views
          uniqueViews
          reads
          meanReadingTime
          karma
          comments
        }
        totalCount
      }
    }
  `, {
    variables,
    skip: !userId && (!postIds || postIds.length === 0),
  });

  const currentData = data?.MultiPostAnalytics
  const totalCount = currentData?.totalCount ?? 0
  const count = currentData?.posts?.length ?? 0
  const showLoadMore = !!userId && (count < totalCount);

  const loadMore = useCallback(async (limitOverride?: number) => {
    const newLimit = limitOverride ?? (limit + itemsPerPage);

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
    setLimit(newLimit);
  }, [
    limit,
    itemsPerPage,
    fetchMore,
    variables,
  ]);

  const loadMoreProps = useMemo(() => ({
    loadMore,
    count,
    totalCount,
    loading: moreLoading,
    hidden: !showLoadMore,
  }), [loadMore, count, totalCount, moreLoading, showLoadMore]);

  return {
    data: data?.MultiPostAnalytics,
    loading: loading,
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
 * - Doesn't refetch if the bounding dates are changed within the range of data it already has
 * - After fetching the absolutely required data for a given range, overfetches by 180 days on either side to avoid having to refetch
 *   when the user changes the date range slightly
 */
export const useAnalyticsSeries = (props: UseAnalyticsSeriesProps): {
  analyticsSeries: AnalyticsSeriesValue[];
  loading: boolean;
  error?: ApolloError
} => {
  const { userId, postIds, startDate: propsStartDate, endDate: propsEndDate } = props;
  // Convert to UTC to ensure args passed to useQuery are consistent between SSR and client
  const utcPropsStartDate = propsStartDate ? moment(propsStartDate).utc().toDate() : null;
  const utcPropsEndDate = moment(propsEndDate).utc().toDate();

  const fetchDateRef = useRef({ startDate: utcPropsStartDate, endDate: utcPropsEndDate });

  // Update fetchDateRef based on whether the current values from the props are within the existing bounds
  if (
    (fetchDateRef.current.startDate ?? 0) > (utcPropsStartDate ?? 0) ||
    // If we are changing from null to non-null or vice versa, we need to refetch
    ([fetchDateRef.current.startDate, utcPropsStartDate].includes(null) &&
      fetchDateRef.current.startDate !== utcPropsStartDate)
  ) {
    fetchDateRef.current.startDate = utcPropsStartDate;
  }

  if (fetchDateRef.current.endDate < utcPropsEndDate) {
    fetchDateRef.current.endDate = utcPropsEndDate;
  }

  const { startDate, endDate } = fetchDateRef.current;

  const [activeVariables, setActiveVariables] = useState({});
  const variablesAreActive = stringify(activeVariables) === stringify({ userId, postIds, startDate, endDate });

  const variables = { userId, postIds, startDate, endDate };
  const { data, loading, error } = useQuery<AnalyticsSeriesQueryResult>(gql`
    query AnalyticsSeriesQuery($userId: String, $postIds: [String], $startDate: Date, $endDate: Date) {
      AnalyticsSeries(userId: $userId, postIds: $postIds, startDate: $startDate, endDate: $endDate) {
        date
        views
        reads
        karma
        comments
      }
    }
  `, {
    variables,
    skip: !userId && (!postIds || postIds.length === 0),
  });

  useEffect(() => {
    // Once one fetch has returned, set the active variables to trigger a second fetch with the dates padded by 180 days on either side
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

    if (truncatedStartDate === utcPropsStartDate && truncatedEndDate === utcPropsEndDate) return truncated;

    const startPaddingLength = Math.floor(moment.duration(moment(truncatedStartDate).utc().diff(utcPropsStartDate ?? undefined)).asDays());
    const endPaddingLength = Math.floor(moment.duration(moment(utcPropsEndDate).utc().diff(truncatedEndDate)).asDays());

    const dateSeries = generateDateSeries(utcPropsStartDate ?? truncatedStartDate, utcPropsEndDate);
    const startSeries = dateSeries.slice(0, startPaddingLength).map((date) => ({ date: new Date(date), views: 0, reads: 0, karma: 0, comments: 0 }));
    const endSeries = dateSeries.slice(dateSeries.length - endPaddingLength).map((date) => ({ date: new Date(date), views: 0, reads: 0, karma: 0, comments: 0 }));

    return [...startSeries, ...truncated, ...endSeries];
  }, [fullSeries, utcPropsEndDate, utcPropsStartDate]);

  return {
    analyticsSeries: truncatedSeriesRef.current,
    loading,
    error,
  };
};
