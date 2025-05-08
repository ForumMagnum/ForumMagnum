import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useForumWrappedContext } from "./hooks";
import { formatPercentile } from "./wrappedHelpers";
import { HumanIcon, PathIcon } from "./wrappedIcons";
import range from "lodash/range";
import { WrappedSection } from "./WrappedSection";
import { WrappedHeading } from "./WrappedHeading";

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

const WrappedTimeSpentSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data} = useForumWrappedContext();
  const formattedPercentile = formatPercentile(data.engagementPercentile);
  const engagementHours = (data.totalSeconds / 3600).toFixed(1);
  return (
    <WrappedSection pageSectionContext="engagementPercentile">
      <WrappedHeading>
        You're a top <em>{formattedPercentile}%</em> reader of the EA Forum
      </WrappedHeading>
      <div>
        You spent {engagementHours} hours on the Forum this year
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

export const WrappedTimeSpentSection = registerComponent(
  "WrappedTimeSpentSection",
  WrappedTimeSpentSectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedTimeSpentSection: typeof WrappedTimeSpentSection
  }
}
