import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";
import { formatPercentile } from "./wrappedHelpers";
import { HumanIcon, PathIcon } from "./wrappedIcons";
import range from "lodash/range";

const styles = (theme: ThemeType) => ({
  chartContainer: {
    marginTop: 40,
    display: "flex",
    justifyContent: "center",
  },
  chart: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  path: {
    color: theme.palette.wrapped.emptyPath,
    position: "absolute",
    top: 18,
    left: -20,
  },
  row: {
    position: "relative",
    display: "flex",
    gap: "12px",
  },
  humanActive: {
    color: theme.palette.text.alwaysWhite,
  },
  humanInactive: {
    color: theme.palette.wrapped.emptyPath,
  },
});

const WrappedTimeSpentSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data} = useForumWrappedContext();
  const formattedPercentile = formatPercentile(data.engagementPercentile);
  const engagementHours = (data.totalSeconds / 3600).toFixed(1);
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="engagementPercentile">
      <WrappedHeading>
        You spent <em>{engagementHours}</em> hours on the EA Forum in {year}
      </WrappedHeading>
      <div>
        That puts you in the top {formattedPercentile}% of Forum users
      </div>
      <div className={classes.chartContainer}>
        <div className={classes.chart}>
          <PathIcon className={classes.path} />
          {range(0, 10).map((i) => (
            <div key={i} className={classes.row}>
              {range(0, 10).map((j) => (
                <HumanIcon key={j} className={
                  (i * 10) + j + 1 === formattedPercentile
                    ? classes.humanActive
                    : classes.humanInactive
                } />
              ))}
            </div>
          ))}
        </div>
      </div>
    </WrappedSection>
  );
}

const WrappedTimeSpentSectionComponent = registerComponent(
  "WrappedTimeSpentSection",
  WrappedTimeSpentSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedTimeSpentSection: typeof WrappedTimeSpentSectionComponent
  }
}
