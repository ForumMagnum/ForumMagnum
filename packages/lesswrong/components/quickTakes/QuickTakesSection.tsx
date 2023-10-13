import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useTracking } from "../../lib/analyticsEvents";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { SHOW_QUICK_TAKES_SECTION_COOKIE } from "../../lib/cookies/cookies";
import { userCanComment } from "../../lib/vulcan-users";
import Checkbox from "@material-ui/core/Checkbox";

const styles = (theme: ThemeType) => ({
  communityToggle: {
    height: 22,
    userSelect: "none",
    cursor: "pointer",
    "& .MuiIconButton-root": {
      padding: 0,
      color: theme.palette.grey[600],
      transform: "scale(0.7) translate(-2px, -1px)",
    },
    "& .MuiIconButton-root.MuiCheckbox-checked": {
      color: theme.palette.primary.main,
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
  const {captureEvent} = useTracking();
  const [showCommunity, setShowCommunity] = useState(false);

  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "quickTakes",
    defaultExpanded: "all",
    onExpandEvent: "quickTakesSectionExpanded",
    onCollapseEvent: "quickTakesSectionCollapsed",
    cookieName: SHOW_QUICK_TAKES_SECTION_COOKIE,
  });

  const onToggleCommunity = useCallback((ev) => {
    const newValue = ev.target.tagName === "INPUT"
      ? !!ev.target.checked
      : !showCommunity;
    setShowCommunity(newValue);
    captureEvent("toggleQuickTakesSectionCommunity", {
      showCommunity: newValue,
    });
  }, [showCommunity, captureEvent]);

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
          title='Quick takes tagged "Community"'
          placement="left"
          hideOnTouchScreens
        >
          <div className={classes.communityToggle}>
            <Checkbox checked={showCommunity} onChange={onToggleCommunity} />
            <span onClick={onToggleCommunity}>Show community</span>
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
