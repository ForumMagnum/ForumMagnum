import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_POPULAR_COMMENTS_SECTION_COOKIE } from "../../lib/cookies/cookies";

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
      title="Popular comments"
      Content={PopularCommentsList}
    />
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
