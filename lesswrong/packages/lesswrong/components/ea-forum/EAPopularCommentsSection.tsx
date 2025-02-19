import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_POPULAR_COMMENTS_SECTION_COOKIE } from "../../lib/cookies/cookies";
import { preferredHeadingCase } from "../../themes/forumTheme";

const EAPopularCommentsSection = () => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "popularComments",
    defaultExpanded: "all",
    onExpandEvent: "popularCommentsSectionExpanded",
    onCollapseEvent: "popularCommentsSectionCollapsed",
    cookieName: SHOW_POPULAR_COMMENTS_SECTION_COOKIE,
  });
  const {ExpandableSection, PopularCommentsList} = Components;
  return (
    <ExpandableSection
      pageSectionContext="popularCommentsSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title={preferredHeadingCase("Popular Comments")}
    >
      <PopularCommentsList/>
    </ExpandableSection>
  );
}

const EAPopularCommentsSectionComponent = registerComponent(
  "EAPopularCommentsSection",
  EAPopularCommentsSection,
);

declare global {
  interface ComponentTypes {
    EAPopularCommentsSection: typeof EAPopularCommentsSectionComponent
  }
}
