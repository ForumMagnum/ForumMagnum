import { frag } from "./fragments/fragmentWrapper";
import { useCurrentTime } from "./utils/timeUtil";
import { useLocation } from "@/lib/routeUtil";

export const KEYWORD_INTERVAL_HOURS = 24;

const parseKeywordAlertStartDate = (
  queryDateString: string,
): Date => {
  const queryDate = new Date(queryDateString);
  return queryDateString && !isNaN(queryDate.getTime())
    ? queryDate
    : new Date("2010-01-01");
}

const parseKeywordAlertEndDate = (
  queryDateString: string,
  currentTime: Date,
): Date => {
  const queryDate = new Date(queryDateString);
  return queryDateString && !isNaN(queryDate.getTime())
    ? queryDate
    : currentTime;
}

export const useKeywordFromUrl = () => {
  const currentTime = useCurrentTime();
  const { params, query } = useLocation();
  const keyword = params.keyword;
  const startDate = parseKeywordAlertStartDate(query.start);
  const endDate = parseKeywordAlertEndDate(query.end, currentTime);
  return { keyword, startDate, endDate };
}

export const KeywordAlertDisplay = () => frag`
  fragment KeywordAlertDisplay on KeywordAlert {
    _id
    post {
      ...PostsListWithVotes
    }
    comment {
      ...CommentsListWithParentMetadata
    }
  }
`;
