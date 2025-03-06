import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userCanQuickTake } from "../../lib/vulcan-users/permissions";
import {
  SHOW_QUICK_TAKES_SECTION_COOKIE,
  SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
} from "../../lib/cookies/cookies";
import { isEAForum } from "../../lib/instanceSettings";
import { isFriendlyUI, preferredHeadingCase } from "../../themes/forumTheme";
import { Link } from '../../lib/reactRouterWrapper';
import {quickTakesMaxAgeDaysSetting} from '../../lib/publicSettings'
import { useMulti } from "@/lib/crud/withMulti";
import ExpandableSection from "@/components/common/ExpandableSection";
import LWTooltip from "@/components/common/LWTooltip";
import QuickTakesEntry from "@/components/quickTakes/QuickTakesEntry";
import QuickTakesListItem from "@/components/quickTakes/QuickTakesListItem";
import { Loading } from "@/components/vulcan-core/Loading";
import SectionFooter from "@/components/common/SectionFooter";
import LoadMore from "@/components/common/LoadMore";
import { Checkbox } from "@/components/mui-replacement";

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
  classes: ClassesType<typeof styles>,
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

  const maxAgeDays = quickTakesMaxAgeDaysSetting.get()

  const {
    results,
    loading,
    showLoadMore,
    loadMoreProps,
    refetch
  } = useMulti({
    terms: {
      view: "shortformFrontpage",
      showCommunity,
      maxAgeDays,
    },
    limit: 5,
    collectionName: "Comments",
    fragmentName: "ShortformComments",
    enableTotal: true,
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

  return (
    <ExpandableSection
      pageSectionContext="quickTakesSection"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title={title}
      afterTitleTo={afterTitleTo}
      AfterTitleComponent={AfterTitleComponent}
    >
      {(userCanQuickTake(currentUser) || !currentUser) && <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />}
      <div className={classes.list}>
        {results?.map((result) => (
          <QuickTakesListItem key={result._id} quickTake={result} />
        ))}
        {loading && <Loading />}
        {showLoadMore && (
          <SectionFooter>
            <LoadMore {...loadMoreProps} sectionFooterStyles />
          </SectionFooter>
        )}
      </div>
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

export default QuickTakesSectionComponent;
