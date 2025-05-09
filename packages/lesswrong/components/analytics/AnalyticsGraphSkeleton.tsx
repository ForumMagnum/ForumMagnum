import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import {
  GRAPH_HEIGHT,
  GRAPH_LEFT_MARGIN,
  styles as analyticsGraphStyles,
} from "./AnalyticsGraph";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  ...analyticsGraphStyles(theme),
  rootSkeleton: {
    overflow: "hidden !important",
  },
  placeholder: {
    height: 10,
    background: theme.palette.panelBackground.placeholderGradient,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1.8s infinite",
    borderRadius: 3,
  },
  dateDropdownWrapper: {
    marginBottom: 6,
  },
  overallStatCount: {
    width: 80,
    marginBottom: 20,
  },
  overallStatDescription: {
    width: 60,
  },
  fieldLabel: {
    width: 68,
    marginLeft: 20,
    marginTop: 8,
  },
  graphContainer: {
    width: `calc(100% - ${GRAPH_LEFT_MARGIN}px)`,
    marginLeft: GRAPH_LEFT_MARGIN,
    height: `${GRAPH_HEIGHT}px !important`,
    marginTop: 20,
    marginBottom: 2,
  },
});

export const AnalyticsGraphSkeletonInner = ({dateOptionDropdown, classes}: {
  dateOptionDropdown?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  const overallStat = (
    <div className={classes.overallStat}>
      <div className={classNames(classes.overallStatCount, classes.placeholder)} />
      <div className={classNames(classes.overallStatDescription, classes.placeholder)} />
    </div>
  );

  const fieldLabel = (
    <div className={classNames(classes.fieldLabel, classes.placeholder)} />
  );

  return (
    <div className={classNames(classes.root, classes.rootSkeleton)}>
      <div className={classes.dateDropdownWrapper}>
        {dateOptionDropdown}
      </div>
      <div className={classes.controls}>
        <div className={classes.overallStatContainer}>
          {overallStat}
          {overallStat}
        </div>
        <div className={classes.controlFields}>
          {fieldLabel}
          {fieldLabel}
          {fieldLabel}
          {fieldLabel}
        </div>
      </div>
      <div className={classNames(classes.graphContainer, classes.placeholder)} />
    </div>
  );
}

export const AnalyticsGraphSkeleton = registerComponent(
  "AnalyticsGraphSkeleton",
  AnalyticsGraphSkeletonInner,
  {styles},
);


