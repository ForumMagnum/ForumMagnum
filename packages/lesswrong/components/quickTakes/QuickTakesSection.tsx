import { useForumType } from '@/components/hooks/useForumType';
import React, { useLayoutEffect, useRef, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { userCanQuickTake } from "../../lib/vulcan-users/permissions";
import { SHOW_QUICK_TAKES_SECTION_COOKIE } from "../../lib/cookies/cookies";
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
import { useFilterSettings } from "../hooks/useFilterSettings";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import AnimatedCollapse from "../common/AnimatedCollapse";
import SettingsButton from "../icons/SettingsButton";
import TagFilterSettings from "../tagging/TagFilterSettings";

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
  loading: {
    // Include the dots' overflow and preserve the space normally occupied by the footer.
    padding: '16px 0 24px',
  },
  filterSettings: {
    backgroundColor: theme.palette.background.paper,
    border: theme.palette.border.grey300,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  filterSettingsDescription: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.dim,
    fontSize: '1.1rem',
    marginTop: 0,
    marginBottom: 12,
  },
}));

const QuickTakesFilterSettings = () => {
  const classes = useStyles(styles);
  const { filterSettings, suggestedTagsQueryRef, setTagFilter, removeTagFilter } = useFilterSettings();
  return <AnalyticsContext pageSectionContext="tagFilterSettings">
    <div className={classes.filterSettings}>
      <p className={classes.filterSettingsDescription}>
        Shared with Latest Posts and the feed. Quick takes are tagged automatically; Hidden and Required filter them, and Reduced ranks them lower. Karma adjustments only affect posts.
      </p>
      <TagFilterSettings
        filterSettings={filterSettings}
        suggestedTagsQueryRef={suggestedTagsQueryRef}
        setTagFilter={setTagFilter}
        removeTagFilter={removeTagFilter}
        flexWrapEndGrow={false}
      />
    </div>
  </AnalyticsContext>
}

const QuickTakesSectionLoaded = () => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { filterSettings } = useFilterSettings();
  const maxAgeDays = quickTakesMaxAgeDaysSetting.get(forumType)

  const { data, loading, refetch, loadMoreProps } = useQueryWithLoadMore(ShortformCommentsMultiQuery, {
    variables: {
      selector: { shortformFrontpage: { maxAgeDays, filterSettings } },
      limit: 7,
      enableTotal: true,
    },
  });

  const results = data?.comments?.results;
  const listRef = useRef<HTMLDivElement>(null);
  const heightBeforeLoadMoreRef = useRef<number|null>(null);

  useLayoutEffect(() => {
    const element = listRef.current;
    const previousHeight = heightBeforeLoadMoreRef.current;
    if (!element || previousHeight === null) return;

    if (loading) {
      // Measure with the centered spinner in place while waiting for the new items.
      heightBeforeLoadMoreRef.current = element.getBoundingClientRect().height;
      return;
    }

    heightBeforeLoadMoreRef.current = null;
    const expandedHeight = element.getBoundingClientRect().height;
    if (expandedHeight <= previousHeight || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animation = element.animate([
      { height: `${previousHeight}px`, overflow: 'clip' },
      { height: `${expandedHeight}px`, overflow: 'clip' },
    ], { duration: 200, easing: 'ease-out' });

    return () => animation.cancel();
  }, [loading, results]);

  const handleLoadMore = () => {
    heightBeforeLoadMoreRef.current = listRef.current?.getBoundingClientRect().height ?? null;
    return loadMoreProps.loadMore();
  };

  const showLoadMore = !loadMoreProps.hidden;

  return <>
    {(userCanQuickTake(currentUser) || !currentUser) && <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />}
    <div ref={listRef} className={classes.list}>
      {results?.map((result: FrontpageShortformComments) => (
        <QuickTakesListItem key={result._id} quickTake={result} />
      ))}
      {loading && <div className={classes.loading}><Loading /></div>}
      {showLoadMore && !loading && (
        <SectionFooter>
          <LoadMore {...loadMoreProps} loadMore={handleLoadMore} sectionFooterStyles />
        </SectionFooter>
      )}
    </div>
  </>
}

const QuickTakesSection = () => {
  const { captureEvent } = useTracking();
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);

  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "quickTakes",
    defaultExpanded: "all",
    onExpandEvent: "quickTakesSectionExpanded",
    onCollapseEvent: "quickTakesSectionCollapsed",
    cookieName: SHOW_QUICK_TAKES_SECTION_COOKIE,
  });

  const toggleFilterSettings = () => {
    setFilterSettingsVisible(!filterSettingsVisible);
    captureEvent("filterSettingsClicked", {
      settingsVisible: !filterSettingsVisible,
      pageSectionContext: "quickTakesSection",
    });
  };

  const titleTooltip = (
    <div>
      A feed of quick takes by other users, sorted by recency and karma.
    </div>
  );
  const title = <LWTooltip title={titleTooltip} placement="left">
    <Link to={"/quicktakes"}>Quick Takes</Link>
  </LWTooltip>

  const afterTitleTo = isFriendlyUI() ? "/quicktakes" : undefined;
  const filterSettingsButton = <LWTooltip title="Tag filters" hideOnTouchScreens>
    <SettingsButton onClick={toggleFilterSettings} />
  </LWTooltip>

  return <ExpandableSection
    pageSectionContext="quickTakesSection"
    expanded={expanded}
    toggleExpanded={toggleExpanded}
    title={title}
    afterTitleTo={afterTitleTo}
    afterTitle={filterSettingsButton}
  >
    <AnimatedCollapse expanded={filterSettingsVisible}>
      <QuickTakesFilterSettings />
    </AnimatedCollapse>
    <SuspenseWrapper name="QuickTakesSection">
      <QuickTakesSectionLoaded />
    </SuspenseWrapper>
  </ExpandableSection>
}

export default registerComponent("QuickTakesSection", QuickTakesSection, {
  areEqual: "auto"
});
