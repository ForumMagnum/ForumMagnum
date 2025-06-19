import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useKeywordFromUrl } from "@/lib/keywordAlertHelpers";
import { combineUrls, getSiteUrl } from "@/lib/vulcan-lib/utils";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PermanentRedirect from "../common/PermanentRedirect";
import KeywordResults from "./KeywordResults";
import HeadTags from "../common/HeadTags";

const KeywordResultsPage = () => {
  const { keyword, startDate } = useKeywordFromUrl();

  if (!keyword) {
    return (
      <PermanentRedirect url="/keywords" />
    );
  }

  const title = `Alerts for "${keyword}" from ${startDate.toLocaleString()}`;
  const canonicalUrl = combineUrls(
    getSiteUrl(),
    `/keywords/${keyword}?start=${startDate.toISOString()}`,
  );

  return (
    <SingleColumnSection>
      <HeadTags
        title={title}
        canonicalUrl={canonicalUrl}
        noIndex
      />
      <SectionTitle title={title} />
      <KeywordResults keyword={keyword} startDate={startDate} />
    </SingleColumnSection>
  );
}

export default registerComponent(
  "KeywordResultsPage",
  KeywordResultsPage,
);
