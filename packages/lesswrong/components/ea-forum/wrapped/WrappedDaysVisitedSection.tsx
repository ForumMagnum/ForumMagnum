import React, { FC, Fragment } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import range from "lodash/range";
import moment from "moment";
import classNames from "classnames";
import type { WrappedYear } from "./hooks";

const styles = (theme: ThemeType) => ({
  calendar: {
    maxWidth: 600,
    display: "inline-grid",
    gridTemplateColumns: "repeat(31, 6px)",
    gridTemplateRows: "repeat(12, 6px)",
    gap: "4px",
    margin: "40px auto 0",
  },
  calendarDot: {
    height: 6,
    width: 6,
    backgroundColor: theme.palette.wrapped.darkDot,
    borderRadius: "50%",
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
        <Day {...{daysVisited, year, month, day, classes}} />
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
const WrappedDaysVisitedSection = ({daysVisited, year, classes}: {
  daysVisited: string[],
  year: WrappedYear,
  classes: ClassesType<typeof styles>,
}) => {
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="daysVisited">
      <WrappedHeading>
        You visited the EA Forum on <em>{daysVisited.length}</em> days in {year}
      </WrappedHeading>
      <div className={classes.calendar}>
        {range(0, 12).map((month: number) => (
          <Month {...{daysVisited, year, month, classes}} />
        ))}
      </div>
    </WrappedSection>
  );
}

const WrappedDaysVisitedSectionComponent = registerComponent(
  "WrappedDaysVisitedSection",
  WrappedDaysVisitedSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedDaysVisitedSection: typeof WrappedDaysVisitedSectionComponent
  }
}
