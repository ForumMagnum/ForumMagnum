import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { useKeywordFromUrl } from "@/lib/keywordAlertHelpers";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import { Link } from "@/lib/reactRouterWrapper";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PermanentRedirect from "../common/PermanentRedirect";
import KeywordResults from "./KeywordResults";
import HeadTags from "../common/HeadTags";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  backContainer: {
    marginTop: 16,
  },
  back: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    color: theme.palette.primary.dark,
    fontSize: 14,
    "& svg": {
      "--icon-size": "14px",
      transform: "translateY(3px)",
    },
  },
});

const KeywordResultsPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { keyword, startDate, endDate } = useKeywordFromUrl();

  if (!keyword) {
    return (
      <PermanentRedirect url="/keywords" />
    );
  }

  const title = `Alerts for "${keyword}" from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`;

  // Not technically correct - this page is marked as noindex
  const canonicalUrl = combineUrls(getSiteUrl(), "/keywords");

  return (
    <AnalyticsContext pageContext="keywordResultsPage">
      <SingleColumnSection>
        <HeadTags
          title={title}
          canonicalUrl={canonicalUrl}
          noIndex
        />
        <div className={classes.backContainer}>
          <Link to="/keywords" className={classes.back}>
            <ForumIcon icon="ArrowLeft" /> Your keyword alerts
          </Link>
        </div>
        <SectionTitle title={title} />
        <KeywordResults keyword={keyword} startDate={startDate} endDate={endDate} />
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "KeywordResultsPage",
  KeywordResultsPage,
  {styles},
);
