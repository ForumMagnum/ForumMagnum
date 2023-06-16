import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_QUICK_TAKES_SECTION_COOKIE } from "../../lib/cookies/cookies";

const styles = (_theme: ThemeType) => ({
  list: {
    marginTop: 4,
  },
});

const QuickTakesSection = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "quickTakes",
    defaultExpanded: "all",
    onExpandEvent: "quickTakesSectionExpanded",
    onCollapseEvent: "quickTakesSectionCollapsed",
    cookieName: SHOW_QUICK_TAKES_SECTION_COOKIE,
  });
  const {ExpandableSection, QuickTakesEntry, QuickTakesList} = Components;
  return (
    <ExpandableSection
      pageSectionContext="quickTakesSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title="Quick takes"
      afterTitleTo="/quicktakes"
      Content={() => (
        <>
          {currentUser && <QuickTakesEntry currentUser={currentUser} />}
          <QuickTakesList className={classes.list} />
        </>
      )}
    />
  );
}

const QuickTakesSectionComponent = registerComponent(
  "QuickTakesSection",
  QuickTakesSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesSection: typeof QuickTakesSectionComponent
  }
}
