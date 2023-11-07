import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userCanComment } from "../../lib/vulcan-users";
import {
  SHOW_QUICK_TAKES_SECTION_COOKIE,
  SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
} from "../../lib/cookies/cookies";

const styles = (theme: ThemeType) => ({
  communityToggle: {
    userSelect: "none",
    cursor: "pointer",
    "& .MuiIconButton-root": {
      height: 0,
      padding: 0,
      color: theme.palette.grey[600],
      transform: "scale(0.7) translate(-2px, -1px)",
    },
    "& .MuiIconButton-root.MuiCheckbox-checked": {
      color: theme.palette.primary.main,
    },
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
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

  const {
    expanded: showCommunity,
    toggleExpanded: toggleShowCommunity,
  } = useExpandedFrontpageSection({
    section: "quickTakesCommunity",
    defaultExpanded: (currentUser: UsersCurrent | null) =>
      currentUser?.hideCommunitySection
        ? false
        : !!currentUser?.expandedFrontpageSections?.community,
    onExpandEvent: "quickTakesSectionShowCommunity",
    onCollapseEvent: "quickTakesSectionHideCommunity",
    cookieName: SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
    forceSetCookieIfUndefined: true,
  });

  const {
    ExpandableSection, LWTooltip, QuickTakesEntry, QuickTakesList,
  } = Components;
  return (
    <ExpandableSection
      pageSectionContext="quickTakesSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title="Quick takes"
      afterTitleTo="/quicktakes"
      AfterTitleComponent={() => (
        <LWTooltip
          title='Show Quick takes tagged "Community"'
          placement="left"
          hideOnTouchScreens
        >
          <div className={classes.communityToggle}>
            <Checkbox checked={showCommunity} onChange={toggleShowCommunity} />
            <span onClick={toggleShowCommunity}>Show community</span>
          </div>
        </LWTooltip>
      )}
      Content={() => (
        <>
          {userCanComment(currentUser) &&
            <QuickTakesEntry currentUser={currentUser} />
          }
          <QuickTakesList
            showCommunity={showCommunity}
            className={classes.list}
          />
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
