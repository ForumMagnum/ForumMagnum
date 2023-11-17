import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import moment from "moment";
import { forumSelect } from "../../lib/forumTypeUtils";

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
  EAForum: "Feb 19th, 2020",
  LWAF: "around the start of 2020",
  default: null,
});

const styles = (theme: ThemeType): JssStyles => ({
  root: {}
});

const AnalyticsDisclaimers = ({ earliestDate }: { earliestDate: Date }) => {
  const { Typography } = Components;

  return (
    <>
      {missingClientLastDay && moment(earliestDate) < moment(missingClientLastDay) && (
        <Typography variant="body1" gutterBottom>
          <em>
            Note: For figures that rely on detecting unique devices, we were mistakenly not collecting that data from{" "}
            {missingClientRangeText}.
          </em>
        </Typography>
      )}
      {dataCollectionFirstDay && moment(earliestDate) < moment("2020-02-19") && (
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
