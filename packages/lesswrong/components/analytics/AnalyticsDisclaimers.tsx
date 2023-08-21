import React from "react";
import { isEAForum } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { requireCssVar } from "../../themes/cssVars";
import moment from "moment";

const missingClientRangeText = isEAForum ? "Jan 11th - Jun 14th of 2021" : "late 2020 - early 2021";
const missingClientLastDay = isEAForum ? "2021-06-14" : "2021-05-01";
const dataCollectionFirstDay = isEAForum ? "Feb 19th, 2020" : "around the start of 2020";

const styles = (theme: ThemeType): JssStyles => ({
  root: {}
});

const AnalyticsDisclaimers = ({ earliestDate }: { earliestDate: Date }) => {
  const { Typography } = Components;

  return (
    <>
      {moment(earliestDate) < moment(missingClientLastDay) && (
        <Typography variant="body1" gutterBottom>
          <em>
            Note: For figures that rely on detecting unique devices, we were mistakenly not collecting that data from{" "}
            {missingClientRangeText}.
          </em>
        </Typography>
      )}
      {moment(earliestDate) < moment("2020-02-19") && (
        <Typography variant="body1" gutterBottom>
          <em>Note 2: Data collection began on {dataCollectionFirstDay}.</em>
        </Typography>
      )}
    </>
  );
};

const AnalyticsDisclaimersComponent = registerComponent("AnalyticsDisclaimers", AnalyticsDisclaimers, { styles });

declare global {
  interface ComponentTypes {
    AnalyticsDisclaimers: typeof AnalyticsDisclaimersComponent;
  }
}
