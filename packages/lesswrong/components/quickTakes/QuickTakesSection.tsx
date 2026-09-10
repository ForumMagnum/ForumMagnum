import { useForumType } from '@/components/hooks/useForumType';
import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userCanQuickTake } from "../../lib/vulcan-users/permissions";
import {
  SHOW_QUICK_TAKES_SECTION_COOKIE,
  SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
} from "../../lib/cookies/cookies";
import { quickTakesMaxAgeDaysSetting } from '@/lib/instanceSettings';
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
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { SuspenseWrapper } from "../common/SuspenseWrapper";

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
  list: {
    marginTop: 4,
    display: "flex",
    flexDirection: "column",
    gap: "4px",  
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.16rem',
  },
}));

const QuickTakesSectionLoaded = ({showCommunity}: {
  showCommunity: boolean
}) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const maxAgeDays = quickTakesMaxAgeDaysSetting.get(forumType)

  const { data, loading, refetch, loadMoreProps } = useQueryWithLoadMore(ShortformCommentsMultiQuery, {
    variables: {
      selector: { shortformFrontpage: { showCommunity, maxAgeDays } },
      limit: 7,
      enableTotal: true,
    },
  });

  const results = data?.comments?.results;

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

  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "quickTakes",
    defaultExpanded: "all",
    onExpandEvent: "quickTakesSectionExpanded",
    onCollapseEvent: "quickTakesSectionCollapsed",
    cookieName: SHOW_QUICK_TAKES_SECTION_COOKIE,
  });

  const {
    expanded: showCommunity,
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

  return <ExpandableSection
    pageSectionContext="quickTakesSection"
    expanded={expanded}
    toggleExpanded={toggleExpanded}
    title={title}
    afterTitleTo={afterTitleTo}
  >
    <SuspenseWrapper name="QuickTakesSection">
      <QuickTakesSectionLoaded showCommunity={showCommunity}/>
    </SuspenseWrapper>
  </ExpandableSection>
}

export default registerComponent("QuickTakesSection", QuickTakesSection, {
  areEqual: "auto"
});


