import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const LWPopularCommentsSection = () => {
  const {SingleColumnSection, SectionTitle, PopularCommentsList} = Components;

  return (
    <SingleColumnSection>
      <SectionTitle title='Popular Comments' />
      <PopularCommentsList />
    </SingleColumnSection>
  );
}

const LWPopularCommentsSectionComponent = registerComponent(
  "LWPopularCommentsSection",
  LWPopularCommentsSection,
);

declare global {
  interface ComponentTypes {
    LWPopularCommentsSection: typeof LWPopularCommentsSectionComponent
  }
}
