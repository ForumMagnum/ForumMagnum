import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_POPULAR_COMMENTS_SECTION_COOKIE } from "../../lib/cookies/cookies";

const styles = (_theme: ThemeType) => ({
});

const EAPopularCommentsSection = ({}: {
  classes: ClassesType,
}) => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "popularComments",
    defaultExpanded: "all",
    onExpandEvent: "popularCommentsSectionExpanded",
    onCollapseEvent: "popularCommentsSectionCollapsed",
    cookieName: SHOW_POPULAR_COMMENTS_SECTION_COOKIE,
  });
  const {ExpandableSection} = Components;
  return (
    <ExpandableSection
      pageSectionContext="popularCommentsSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title="Popular comments"
      Content={() => (
        <>
          Popular comments
        </>
      )}
    />
  );
}

const EAPopularCommentsSectionComponent = registerComponent(
  "EAPopularCommentsSection",
  EAPopularCommentsSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAPopularCommentsSection: typeof EAPopularCommentsSectionComponent
  }
}
