import moment from "moment";
import { useCurrentTime } from "@/lib/utils/timeUtil";
import { useTimezone } from "../common/withTimezone";

// See https://www.effectivealtruism.org/virtual-programs for more info,
// including the current deadline / start / end dates.

export const useEAVirtualPrograms = () => {
  const { timezone } = useTimezone();
  
  // Find the next deadline for applying to the Intro VP, which is usually the 4th Sunday of every month
  // (though it will sometimes move to the 3rd or 5th Sunday - this is not accounted for in the code).
  // This defaults to the Sunday in the week of the 28th day of this month.
  const now = useCurrentTime()
  let deadline = moment(now).tz(timezone).date(28).day(0).endOf('day')
  // If that Sunday is in the past, use next month's 4th Sunday.
  if (deadline.isBefore(now)) {
    deadline = moment(now).add(1, 'months').date(28).day(0)
  }
  
  // VP starts 22 days after the deadline, on a Monday
  const start = moment(deadline).add(22, 'days')
  // VP ends 8 weeks after the start (subtract a day to end on a Sunday)
  const end = moment(start).add(8, 'weeks').subtract(1, 'day')
  
  return {deadline, start, end}
}
