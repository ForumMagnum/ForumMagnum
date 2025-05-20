import React from 'react';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import moment from '../../../lib/moment-timezone';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import TimeTag from "../../common/TimeTag";


/**
 * Returns the event datetimes in a user-friendly format,
 * ex: Mon, Jan 3 at 4:30 - 5:30 PM
 * 
 * @param post - The event to be checked.
 * @param timezone - (Optional) Convert datetimes to this timezone.
 * @param dense - (Optional) Exclude the day of the week.
 * @returns The formatted event datetimes.
 */
export const PrettyEventDateTime = ({
  post,
  timezone,
  dense = false,
}: {
  post: Pick<DbPost | PostsBase, 'startTime' | 'endTime' | 'localStartTime' | 'localEndTime'>,
  timezone?: string;
  dense?: boolean;
}) => {
  const now = moment(useCurrentTime())
  if (!post.startTime) return <>TBD</>;
  let start = moment(post.startTime);
  let end = post.endTime && moment(post.endTime);
  // if we have event times in the local timezone, use those instead
  const useLocalTimes = post.localStartTime && (!post.endTime || post.localEndTime);

  // prefer to use the provided timezone
  let tz = ` ${start.format("[UTC]ZZ")}`;
  if (timezone) {
    start = start.tz(timezone);
    end = end && end.tz(timezone);
    tz = ` ${start.format("z")}`;
  } else if (useLocalTimes) {
    // see postResolvers.ts for more on how local times work
    start = moment(post.localStartTime).utc();
    end = post.localEndTime && moment(post.localEndTime).utc();
    tz = "";
  }

  // hide the year if it's reasonable to assume it
  const sixMonthsFromNow = moment(now).add(6, "months");
  const startYear = now.isSame(start, "year") || start.isBefore(sixMonthsFromNow) ? "" : `, ${start.format("YYYY")}`;

  const startDate = dense ? start.format("MMM D") : start.format("ddd, MMM D");
  const startTime = start.format("h:mm").replace(":00", "");
  let startAmPm = ` ${start.format("A")}`;

  if (!end) {
    // just a start time
    // ex: Starts on Mon, Jan 3 at 4:30 PM
    // ex: Starts on Mon, Jan 3, 2023 at 4:30 PM EST
    return (
      <TimeTag dateTime={post.startTime}>{`${
        dense ? "" : "Starts on "
      }${startDate}${startYear} at ${startTime}${startAmPm}${tz}`}</TimeTag>
    );
  }

  const endTime = end.format("h:mm A").replace(":00", "");
  // start and end time on the same day
  // ex: Mon, Jan 3 at 4:30 - 5:30 PM
  // ex: Mon, Jan 3, 2023 at 4:30 - 5:30 PM EST
  if (start.isSame(end, "day")) {
    // hide the start time am/pm if it's the same as the end time's
    startAmPm = start.format("A") === end.format("A") ? "" : startAmPm;
    return (
      <TimeTag dateTime={post.startTime}>
        {`${startDate}${startYear} at ${startTime}${startAmPm} – ${endTime}${tz}`}
      </TimeTag>
    );
  }

  // start and end time on different days
  // ex: Mon, Jan 3 at 4:30 PM - Tues, Jan 4 at 5:30 PM
  // ex: Mon, Jan 3, 2023 at 4:30 PM - Tues, Jan 4, 2023 at 5:30 PM EST
  const endDate = dense ? end.format("MMM D") : end.format("ddd, MMM D");
  const endYear = now.isSame(end, "year") || end.isBefore(sixMonthsFromNow) ? "" : `, ${end.format("YYYY")}`;
  return (
    <>
      <TimeTag dateTime={post.startTime}>{`${startDate}${startYear} at ${startTime}${startAmPm}`}</TimeTag>
      {" – "}
      <TimeTag dateTime={post.endTime ?? end.toISOString()}>{`${endDate}${endYear} at ${endTime}${tz}`}</TimeTag>
    </>
  );
};

export default registerComponent("PrettyEventDateTime", PrettyEventDateTime);


