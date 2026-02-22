import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import moment from "moment";
import { forumSelect } from "../../lib/forumTypeUtils";
import { Typography } from "../common/Typography";

const getMissingClientRangeText = () => forumSelect({
  LWAF: "late 2020 - early 2021",
  default: null,
});
const getMissingClientLastDay = () => forumSelect({
  LWAF: "2021-05-01",
  default: null,
});
const getDataCollectionFirstDay = () => forumSelect({
  LWAF: "around the start of 2020",
  default: null,
});

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


