import React from "react";
import Checkbox from "@/lib/vendor/@material-ui/core/src/Checkbox";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userCanQuickTake } from "../../lib/vulcan-users/permissions";
import {
  SHOW_QUICK_TAKES_SECTION_COOKIE,
  SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
} from "../../lib/cookies/cookies";
import { isEAForum, quickTakesMaxAgeDaysSetting } from '@/lib/instanceSettings';
import { isFriendlyUI } from "../../themes/forumTheme";
import { Link } from '../../lib/reactRouterWrapper';
import ExpandableSection from "../common/ExpandableSection";
import LWTooltip from "../common/LWTooltip";
import QuickTakesEntry from "./QuickTakesEntry";
import QuickTakesListItem from "./QuickTakesListItem";
import Loading from "../vulcan-core/Loading";
import SectionFooter from "../common/SectionFooter";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { SuspenseWrapper } from "../common/SuspenseWrapper";

const QUICK_TAKES_INITIAL_LIMIT = 7;

const ShortformCommentsMultiQuery = gql(`
  query multiCommentQuickTakesSectionQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...FrontpageShortformComments
      }
      totalCount
    }
  }
`);

const styles = defineStyles("QuickTakesSection", (theme: ThemeType) => ({
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
    display: "flex",
    flexDirection: "column",
    gap: "4px",  
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.16rem',
  },
}));

export function mergeQuickTakesWithFreshSlot<T extends {_id: string}>(
  rankedResults: readonly T[],
  freshResult: T | null | undefined,
  initialLimit = QUICK_TAKES_INITIAL_LIMIT,
): T[] {
  if (!freshResult) {
    return [...rankedResults];
  }

  const initiallyVisibleResults = rankedResults.slice(0, initialLimit);
  if (initiallyVisibleResults.some((result) => result._id === freshResult._id)) {
    return [...rankedResults];
  }

  if (rankedResults.length < initialLimit) {
    return [
      ...rankedResults.filter((result) => result._id !== freshResult._id),
      freshResult,
    ];
  }

  return [
    ...rankedResults.slice(0, initialLimit - 1),
    freshResult,
    ...rankedResults
      .slice(initialLimit - 1)
      .filter((result) => result._id !== freshResult._id),
  ];
}

const QuickTakesSectionLoaded = ({showCommunity}: {
  showCommunity: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const maxAgeDays = quickTakesMaxAgeDaysSetting.get()

  const { data, loading, refetch, loadMoreProps } = useQueryWithLoadMore(ShortformCommentsMultiQuery, {
    variables: {
      selector: { shortformFrontpage: { showCommunity, maxAgeDays } },
      limit: QUICK_TAKES_INITIAL_LIMIT,
      enableTotal: true,
    },
  });

  const { data: freshData } = useQuery(ShortformCommentsMultiQuery, {
    variables: {
      selector: { shortformFrontpage: { showCommunity, maxAgeDays, minimumKarma: 0, sortBy: "new" } },
      limit: 1,
      enableTotal: false,
    },
  });

  const results = mergeQuickTakesWithFreshSlot(
    data?.comments?.results ?? [],
    freshData?.comments?.results?.[0],
    QUICK_TAKES_INITIAL_LIMIT,
  );

  const showLoadMore = !loadMoreProps.hidden;

  return <>
    {(userCanQuickTake(currentUser) || !currentUser) && <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />}
    <div className={classes.list}>
      {results?.map((result: FrontpageShortformComments) => (
        <QuickTakesListItem key={result._id} quickTake={result} />
      ))}
      {loading && <Loading />}
      {showLoadMore && (
        <SectionFooter>
          <LoadMore {...loadMoreProps} sectionFooterStyles />
        </SectionFooter>
      )}
    </div>
  </>
}

const QuickTakesSection = () => {
  const classes = useStyles(styles);

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

  const titleTooltip = (
    <div>
      A feed of quick takes by other users, sorted by recency and karma.
    </div>
  );
  const title = <LWTooltip title={titleTooltip} placement="left">
    <Link to={"/quicktakes"}>Quick Takes</Link>
  </LWTooltip>

  const afterTitleTo = isFriendlyUI() ? "/quicktakes" : undefined;

  const AfterTitleComponent = isEAForum() 
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

  return <ExpandableSection
    pageSectionContext="quickTakesSection"
    expanded={expanded}
    toggleExpanded={toggleExpanded}
    title={title}
    afterTitleTo={afterTitleTo}
    AfterTitleComponent={AfterTitleComponent}
  >
    <SuspenseWrapper name="QuickTakesSection">
      <QuickTakesSectionLoaded showCommunity={showCommunity}/>
    </SuspenseWrapper>
  </ExpandableSection>
}

export default registerComponent("QuickTakesSection", QuickTakesSection, {
  areEqual: "auto"
});


