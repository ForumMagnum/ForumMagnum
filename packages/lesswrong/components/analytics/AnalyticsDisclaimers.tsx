import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import moment from "moment";
import { forumSelect } from "../../lib/forumTypeUtils";
import { GRAPH_LEFT_MARGIN } from "./AnalyticsGraph";
import { Typography } from "../common/Typography";

const getMissingClientRangeText = () => forumSelect({
  EAForum: "Jan 11th - Jun 14th of 2021",
  LWAF: "late 2020 - early 2021",
  default: null,
});
const getMissingClientLastDay = () => forumSelect({
  EAForum: "2021-06-14",
  LWAF: "2021-05-01",
  default: null,
});
const getDataCollectionFirstDay = () => forumSelect({
  EAForum: "on Feb 19th, 2020",
  LWAF: "around the start of 2020",
  default: null,
});

const styles = (theme: ThemeType) => ({
  root: theme.isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      margin: `0 ${GRAPH_LEFT_MARGIN}px`,
    }
    : {},
});

const AnalyticsDisclaimers = ({earliestDate, classes}: {
  earliestDate: Date,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <>
      {getMissingClientLastDay() && moment(earliestDate) < moment(getMissingClientLastDay()) && (
        <Typography variant="body1" gutterBottom className={classes.root}>
          <em>
            Note: For figures that rely on detecting unique devices, we were mistakenly not collecting that data from{" "}
            {getMissingClientRangeText()}.
          </em>
        </Typography>
      )}
      {getDataCollectionFirstDay() && moment(earliestDate) < moment("2020-02-19") && (
        <Typography variant="body1" gutterBottom className={classes.root}>
          <em>Note 2: Data collection began {getDataCollectionFirstDay()}.</em>
        </Typography>
      )}
    </>
  );
};

export default registerComponent(
  "AnalyticsDisclaimers",
  AnalyticsDisclaimers,
  {styles},
);


