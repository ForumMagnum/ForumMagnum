import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import moment from "moment";
import { forumSelect } from "../../lib/forumTypeUtils";
import { isFriendlyUI } from "@/themes/forumTheme";
import { GRAPH_LEFT_MARGIN } from "./AnalyticsGraph";
import { Typography } from "../common/Typography";

const missingClientRangeText = forumSelect({
  EAForum: "Jan 11th - Jun 14th of 2021",
  LWAF: "late 2020 - early 2021",
  default: null,
});
const missingClientLastDay = forumSelect({
  EAForum: "2021-06-14",
  LWAF: "2021-05-01",
  default: null,
});
const dataCollectionFirstDay = forumSelect({
  EAForum: "on Feb 19th, 2020",
  LWAF: "around the start of 2020",
  default: null,
});

const styles = (theme: ThemeType) => ({
  root: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      margin: `0 ${GRAPH_LEFT_MARGIN}px`,
    }
    : {},
});

const AnalyticsDisclaimersInner = ({earliestDate, classes}: {
  earliestDate: Date,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <>
      {missingClientLastDay && moment(earliestDate) < moment(missingClientLastDay) && (
        <Typography variant="body1" gutterBottom className={classes.root}>
          <em>
            Note: For figures that rely on detecting unique devices, we were mistakenly not collecting that data from{" "}
            {missingClientRangeText}.
          </em>
        </Typography>
      )}
      {dataCollectionFirstDay && moment(earliestDate) < moment("2020-02-19") && (
        <Typography variant="body1" gutterBottom className={classes.root}>
          <em>Note 2: Data collection began {dataCollectionFirstDay}.</em>
        </Typography>
      )}
    </>
  );
};

export const AnalyticsDisclaimers = registerComponent(
  "AnalyticsDisclaimers",
  AnalyticsDisclaimersInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    AnalyticsDisclaimers: typeof AnalyticsDisclaimers;
  }
}
