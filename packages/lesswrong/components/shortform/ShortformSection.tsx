import React, { useCallback, useRef, useState } from "react";
import Checkbox from "@material-ui/core/Checkbox";
import AddBoxIcon from '@material-ui/icons/AddBox'
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userCanComment } from "../../lib/vulcan-users";
import {
  SHOW_SHORTFORM_SECTION_COOKIE,
  SHOW_SHORTFORM_SECTION_COMMUNITY_COOKIE,
} from "../../lib/cookies/cookies";
import { isLWorAF } from "../../lib/instanceSettings";

// TODO RICKI:
// Make the date a link (in unexpanded version)
// Add the shortform icon (to unexpanded version)
// Clear up all the code we're not using

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

const ShortformSection = ({classes}: {
  classes: ClassesType,
}) => {

  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const refetchRef = useRef<null|(() => void)>(null);


  const toggleShortformFeed = useCallback(
    () => {
      setShowShortformFeed(!showShortformFeed);
    },
    [setShowShortformFeed, showShortformFeed]
  );
  
  const currentUser = useCurrentUser();

  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "quickTakes",
    defaultExpanded: "all",
    onExpandEvent: "quickTakesSectionExpanded",
    onCollapseEvent: "quickTakesSectionCollapsed",
    cookieName: SHOW_SHORTFORM_SECTION_COOKIE,
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
    cookieName: SHOW_SHORTFORM_SECTION_COMMUNITY_COOKIE,
    forceSetCookieIfUndefined: true,
  });

  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const title = "Shortform"

  const {
    ShortformList, ExpandableSection, LWTooltip, QuickTakesEntry, QuickTakesList, SectionTitle, SectionButton, ShortformSubmitForm, ShortformThreadListHomepage,
  } = Components;

  const shortformButton = true
  const showShortformButton = isLWorAF && currentUser?.isReviewed && shortformButton && !currentUser.allCommentingDisabled
  
  return (<>
    <SectionTitle title={title} >
      {showShortformButton && <div onClick={toggleShortformFeed}>
        <SectionButton>
          <AddBoxIcon />
          New Shortform Post
        </SectionButton>
      </div>}
    </SectionTitle>
    {showShortformFeed && <ShortformSubmitForm successCallback={refetch}/>}
    <ExpandableSection
      pageSectionContext="quickTakesSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title="Shortform"
      afterTitleTo="/shortform"
      // AfterTitleComponent={() => (
      //   <LWTooltip
      //     title='Show shortforms tagged "Community"'
      //     placement="left"
      //     hideOnTouchScreens
      //   >
      //     <div className={classes.communityToggle} onClick={toggleShowCommunity}>
      //       <Checkbox checked={showCommunity} />
      //       <span>Show community</span>
      //     </div>
      //   </LWTooltip>
      // )}
      Content={() => (
        <>
          {userCanComment(currentUser) &&
            <QuickTakesEntry currentUser={currentUser} />
          }
          {userCanComment(currentUser) &&
            <ShortformSubmitForm successCallback={refetch}/>
          }
          {/* <QuickTakesList
            showCommunity={showCommunity}
            className={classes.list}
          /> */}
          <ShortformThreadListHomepage className={classes.list}/>
          <ShortformList />
        </>
      )}
    />
  </>
  );
}

const ShortformSectionComponent = registerComponent(
  "ShortformSection",
  ShortformSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    ShortformSection: typeof ShortformSectionComponent
  }
}
function setShowShortformFeed(arg0: boolean) {
  throw new Error("Function not implemented.");
}

