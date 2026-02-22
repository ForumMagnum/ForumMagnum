import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { quickTakesMaxAgeDaysSetting } from '@/lib/instanceSettings';
import {
    SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE,
    SHOW_QUICK_TAKES_SECTION_COOKIE,
} from "../../lib/cookies/cookies";
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { userCanQuickTake } from "../../lib/vulcan-users/permissions";
import { preferredHeadingCase } from "../../themes/forumTheme";
import ExpandableSection from "../common/ExpandableSection";
import LoadMore from "../common/LoadMore";
import LWTooltip from "../common/LWTooltip";
import SectionFooter from "../common/SectionFooter";
import { SuspenseWrapper } from "../common/SuspenseWrapper";
import { useCurrentUser } from "../common/withUser";
import { useExpandedFrontpageSection } from "../hooks/useExpandedFrontpageSection";
import { defineStyles, useStyles } from "../hooks/useStyles";
import Loading from "../vulcan-core/Loading";
import QuickTakesEntry from "./QuickTakesEntry";
import QuickTakesListItem from "./QuickTakesListItem";

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
    ...({
          display: "flex",
          flexDirection: "column",
          gap: "4px",  
          fontFamily: theme.palette.fonts.sansSerifStack,
          fontSize: '1.16rem',
        })
  },
}));

const QuickTakesSectionLoaded = ({showCommunity}: {
  showCommunity: boolean
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const maxAgeDays = quickTakesMaxAgeDaysSetting.get()

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

  const titleText = preferredHeadingCase("Quick Takes");
  const titleTooltip = (
    <div>
      A feed of quick takes by other users, sorted by recency and karma.
    </div>
  );
  const title = (<>
          <LWTooltip title={titleTooltip} placement="left">
            <Link to={"/quicktakes"}>{titleText}</Link>
          </LWTooltip>
        </>);

  const afterTitleTo = undefined;

  const AfterTitleComponent = undefined;

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


