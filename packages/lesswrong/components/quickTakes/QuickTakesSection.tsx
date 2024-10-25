import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userIsAdminOrMod } from "../../lib/vulcan-users";
import {
  SHOW_QUICK_TAKES_SECTION_COOKIE,
  SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
} from "../../lib/cookies/cookies";
import { isEAForum } from "../../lib/instanceSettings";
import { isFriendlyUI, preferredHeadingCase } from "../../themes/forumTheme";
import { Link } from '../../lib/reactRouterWrapper';

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
    ...(isFriendlyUI ? {} : {
      display: "flex",
      flexDirection: "column",
      gap: "4px",  
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: '1.16rem',
    })
  },
});

const QuickTakesSection = ({classes}: {
  classes: ClassesType,
}) => {
  const {
    ExpandableSection, LWTooltip, QuickTakesEntry, QuickTakesList,
  } = Components;

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

  const titleText = preferredHeadingCase("Quick Takes");
  const titleTooltip = (
    <div>
      A feed of quick takes by other users, sorted by recency and karma.
    </div>
  );
  const title = isFriendlyUI
    ? titleText
    : (<>
        <LWTooltip title={titleTooltip} placement="left">
          <Link to={"/quicktakes"}>{titleText}</Link>
        </LWTooltip>
      </>);

  const afterTitleTo = isFriendlyUI ? "/quicktakes" : undefined;

  const AfterTitleComponent = isEAForum 
    ? () => (
      <LWTooltip
        title='Show quick takes tagged "Community"'
        placement="left"
        hideOnTouchScreens
      >
        <div className={classes.communityToggle} onClick={toggleShowCommunity}>
          <Checkbox checked={showCommunity} />
          <span>Show community</span>
        </div>
      </LWTooltip>
    )
  : undefined;


  // this is approximately the same as userCanComment, but we don't exclude a user who is unreviewed
  const userCanWriteQuickTakes = (currentUser: UsersCurrent | null) => {
    if (!currentUser) {
     return false;
    }

    if (userIsAdminOrMod(currentUser)) {
      return true;
    }

    if (currentUser.allCommentingDisabled) {
      return false;
    }

    return true;
  }


  return (
    <ExpandableSection
      pageSectionContext="quickTakesSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title={title}
      afterTitleTo={afterTitleTo}
      AfterTitleComponent={AfterTitleComponent}
    >
      {/* TODO: Maybe better visible to logged out users with modal upon clicking, like vote buttons */}
      {userCanWriteQuickTakes(currentUser) &&
        <QuickTakesEntry currentUser={currentUser} />
      }
      
      <QuickTakesList
        showCommunity={showCommunity}
        className={classes.list}
      />
    </ExpandableSection>
  );
}

const QuickTakesSectionComponent = registerComponent("QuickTakesSection", QuickTakesSection, {
  styles,
  areEqual: "auto"
});

declare global {
  interface ComponentTypes {
    QuickTakesSection: typeof QuickTakesSectionComponent
  }
}
