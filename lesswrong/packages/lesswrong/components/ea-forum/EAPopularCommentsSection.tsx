import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_POPULAR_COMMENTS_SECTION_COOKIE } from "../../lib/cookies/cookies";
import { preferredHeadingCase } from "../../themes/forumTheme";
import ExpandableSection from "@/components/common/ExpandableSection";
import PopularCommentsList from "@/components/comments/PopularCommentsList";

const EAPopularCommentsSection = () => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "popularComments",
    defaultExpanded: "all",
    onExpandEvent: "popularCommentsSectionExpanded",
    onCollapseEvent: "popularCommentsSectionCollapsed",
    cookieName: SHOW_POPULAR_COMMENTS_SECTION_COOKIE,
  });
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

export default EAPopularCommentsSectionComponent;
