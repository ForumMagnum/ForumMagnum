import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_POPULAR_COMMENTS_SECTION_COOKIE } from "../../lib/cookies/cookies";
import { preferredHeadingCase } from "../../themes/forumTheme";
import { ExpandableSection } from "../common/ExpandableSection";
import { PopularCommentsList } from "../comments/PopularCommentsList";

const EAPopularCommentsSectionInner = () => {
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

export const EAPopularCommentsSection = registerComponent(
  "EAPopularCommentsSection",
  EAPopularCommentsSectionInner,
);


