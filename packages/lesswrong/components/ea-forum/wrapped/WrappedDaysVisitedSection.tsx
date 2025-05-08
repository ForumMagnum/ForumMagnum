import React, { FC, Fragment } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components";
import { WrappedYear, useForumWrappedContext } from "./hooks";
import range from "lodash/range";
import moment from "moment";
import classNames from "classnames";

const MOBILE_SIZE = 6;
const DESKTOP_SIZE = 8;

const styles = (theme: ThemeType) => ({
  calendar: {
    maxWidth: 600,
    display: "inline-grid",
    gridTemplateColumns: `repeat(31, ${MOBILE_SIZE}px)`,
    gridTemplateRows: `repeat(12, ${MOBILE_SIZE}px)`,
    gap: "4px",
    margin: "60px auto 0",
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: `repeat(31, ${DESKTOP_SIZE}px)`,
      gridTemplateRows: `repeat(12, ${DESKTOP_SIZE}px)`,
    },
  },
  calendarDot: {
    height: MOBILE_SIZE,
    width: MOBILE_SIZE,
    backgroundColor: theme.palette.wrapped.darkDot,
    borderRadius: "50%",
    [theme.breakpoints.up("md")]: {
      height: DESKTOP_SIZE,
      width: DESKTOP_SIZE,
    },
  },
  calendarDotActive: {
    backgroundColor: theme.palette.text.alwaysWhite,
  },
});

const Day: FC<{
  daysVisited: string[],
  year: WrappedYear,
  month: number,
  day: number,
  classes: ClassesType<typeof styles>,
}> = ({daysVisited, year, month, day, classes}) => {
  const date = moment(`${year}-${month + 1}-${day + 1}`, "YYYY-M-D");
  const active = daysVisited.some((d) => moment(d).isSame(date));
  return (
    <div
      key={`${month}-${day}`}
      title={date.format("D MMM")}
      className={classNames(classes.calendarDot, active && classes.calendarDotActive)}
    />
  );
}

const Month: FC<{
  daysVisited: string[],
  year: WrappedYear,
  month: number,
  classes: ClassesType<typeof styles>,
}> = ({daysVisited, year, month, classes}) => {
  const daysInMonth = moment(`${year}-${month + 1}`, "YYYY-M").daysInMonth();
  return (
    <Fragment key={month}>
      {range(0, daysInMonth).map((day) => (
        <Day {...{daysVisited, year, month, day, classes}} key={day} />
      ))}
      {range(daysInMonth, 31).map((day) => (
        <div key={`${month}-${day}`} />
      ))}
    </Fragment>
  );
}

/**
 * Section that displays the calendar of days that the user visited the forum,
 * visualized as 12 rows of dots, with the visited days' dots being white
 */
const WrappedDaysVisitedSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data: {daysVisited}} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="daysVisited">
      <WrappedHeading>
        You visited the EA Forum on <em>{daysVisited.length}</em>{' '}
        day{daysVisited.length === 1 ? '' : 's'} in {year}
      </WrappedHeading>
      <div className={classes.calendar}>
        {range(0, 12).map((month: number) => (
          <Month {...{daysVisited, year, month, classes}} key={month} />
        ))}
      </div>
    </WrappedSection>
  );
}

export const WrappedDaysVisitedSection = registerComponent(
  "WrappedDaysVisitedSection",
  WrappedDaysVisitedSectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedDaysVisitedSection: typeof WrappedDaysVisitedSection
  }
}
