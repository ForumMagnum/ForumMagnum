import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import type { TimelineSpec } from "../../../lib/eaGivingSeason";
import moment from "moment";

const formatDate = (date: Date) => moment.utc(date).format("MMM D");

const HEIGHT = 54;
const POINT_OFFSET = 25;
const MARKER_SIZE = 12;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "100%",
    height: HEIGHT,
    borderRadius: theme.borderRadius.default,
    backgroundColor: theme.palette.givingPortal[200],
    borderBottom: `2px solid ${theme.palette.givingPortal[1000]}`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginBottom: 80,
    zIndex: 2,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  date: {
    color: theme.palette.grey[1000],
    fontSize: 16,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.16px",
    textAlign: "center",
    whiteSpace: "nowrap",
    position: "absolute",
    top: HEIGHT + 11,
  },
  dateDescription: {
    color: theme.palette.givingPortal[1000],
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "break-spaces",
    maxWidth: 80,
  },
  dateMarker: {
    backgroundColor: theme.palette.givingPortal[1000],
    borderRadius: "50%",
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    position: "absolute",
    top: -18,
    left: POINT_OFFSET - (MARKER_SIZE / 2),
    zIndex: 6,
  },
  span: {
    backgroundColor: theme.palette.givingPortal[800],
    color: theme.palette.givingPortal[1000],
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    padding: "0 14px",
    position: "absolute",
    top: 0,
    height: "100%",
    zIndex: 4,
  },
  currentMarker: {
    backgroundColor: theme.palette.givingPortal[1000],
    borderTopLeftRadius: theme.borderRadius.default,
    position: "absolute",
    top: 0,
    height: 8,
    zIndex: 8,
  },
});

const Timeline = ({
  start,
  end,
  points,
  spans,
  classes,
}: TimelineSpec & {
  classes: ClassesType,
}) => {
  const currentDate = useCurrentTime();
  const showCurrentDate = currentDate.getTime() > start.getTime() &&
    currentDate.getTime() < end.getTime();

  const startMoment = moment(start);
  const endMoment = moment(end);
  const divisions = endMoment.diff(startMoment, "days");

  const getDatePercent = (date: Date) => {
    const dateMoment = moment(date);
    const division = dateMoment.diff(startMoment, "days");
    const percent = (division / divisions) * 100;
    return percent < 0 ? 0 : percent > 100 ? 100 : percent;
  }

  const positionDate = (date: Date) => ({
    className: classes.date,
    style: {
      left: `calc(${getDatePercent(date)}% - ${POINT_OFFSET}px)`,
    },
  });

  const positionSpan = (start: Date, end: Date) => {
    const startPercent = getDatePercent(start);
    const endPercent = getDatePercent(end);
    const width = Math.max(endPercent - startPercent - 2, 2);
    return {
      className: classes.span,
      style: {
        left: `${startPercent}%`,
        width: `${width}%`,
      },
    };
  }

  return (
    <div className={classes.root}>
      {points.map(({date, description}) => (
        <div {...positionDate(date)} key={description}>
          <div>{formatDate(date)}</div>
          <div className={classes.dateDescription}>{description}</div>
          <div className={classes.dateMarker} />
        </div>
      ))}
      {spans.map(({start, end, description}) => (
        <div {...positionSpan(start, end)} key={description}>
          {description}
        </div>
      ))}
      {showCurrentDate &&
        <div
          className={classes.currentMarker}
          style={{width: `${getDatePercent(currentDate)}%`}}
        />
      }
    </div>
  );
}

const TimelineComponent = registerComponent(
  "Timeline",
  Timeline,
  {styles},
);

declare global {
  interface ComponentTypes {
    Timeline: typeof TimelineComponent;
  }
}
