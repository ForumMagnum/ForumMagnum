import React from "react";
import moment from "moment";
import { GRAPH_LEFT_MARGIN } from "./AnalyticsGraph";
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const getMissingClientRangeText = () => "late 2020 - early 2021";
const getMissingClientLastDay = () => "2021-05-01";
const getDataCollectionFirstDay = () => "around the start of 2020";

const styles = defineStyles("AnalyticsDisclaimers", (theme: ThemeType) => ({
  root: {},
}));

const AnalyticsDisclaimers = ({earliestDate}: {
  earliestDate: Date,
}) => {
  const classes = useStyles(styles);
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

export default AnalyticsDisclaimers;


