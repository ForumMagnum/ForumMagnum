import { useCurrentTime } from "./utils/timeUtil";
import { useLocation } from "@/lib/routeUtil";

export const KEYWORD_INTERVAL_HOURS = 24;

export const getDefaultKeywordStartDate = (currentTime = new Date()) =>
  new Date(currentTime.getTime() - (KEYWORD_INTERVAL_HOURS * 60 * 60 * 1000));

export const getKeywordEndDate = (startDate: Date) =>
  new Date(startDate.getTime() + (KEYWORD_INTERVAL_HOURS * 60 * 60 * 1000));

const parseKeywordAlertStartDate = (
  queryDateString: string,
  currentTime: Date,
): Date => {
  const queryDate = new Date(queryDateString);
  return queryDateString && !isNaN(queryDate.getTime())
    ? queryDate
    : getDefaultKeywordStartDate(currentTime);
}

export const useKeywordFromUrl = () => {
  const currentTime = useCurrentTime();
  const { params, query } = useLocation();
  const keyword = params.keyword;
  const startDate = parseKeywordAlertStartDate(query.start, currentTime);
  return { keyword, startDate };
}
