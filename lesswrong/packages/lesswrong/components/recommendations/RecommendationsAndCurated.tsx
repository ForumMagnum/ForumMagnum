import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { useContinueReading } from './withContinueReading';
import {AnalyticsContext, useTracking} from "../../lib/analyticsEvents";
import { isLW, isEAForum } from '../../lib/instanceSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { useExpandedFrontpageSection } from '../hooks/useExpandedFrontpageSection';
import { SHOW_RECOMMENDATIONS_SECTION_COOKIE } from '../../lib/cookies/cookies';
import { isFriendlyUI } from '../../themes/forumTheme';
import DismissibleSpotlightItem from "@/components/spotlights/DismissibleSpotlightItem";
import RecommendationsAlgorithmPicker from "@/components/recommendations/RecommendationsAlgorithmPicker";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SettingsButton from "@/components/icons/SettingsButton";
import ContinueReadingList from "@/components/recommendations/ContinueReadingList";
import RecommendationsList from "@/components/recommendations/RecommendationsList";
import { SectionTitle } from "@/components/common/SectionTitle";
import SectionSubtitle from "@/components/common/SectionSubtitle";
import BookmarksList from "@/components/bookmarks/BookmarksList";
import LWTooltip from "@/components/common/LWTooltip";
import CuratedPostsList from "@/components/recommendations/CuratedPostsList";
import ForumIcon from "@/components/common/ForumIcon";

export const curatedUrl = "/recommendations"

const styles = (theme: ThemeType) => ({
  section: isFriendlyUI ? {} : {
    marginTop: -12,
  },
  continueReadingList: {
    marginBottom: theme.spacing.unit*2,
  },
  subsection: {
    marginBottom: theme.spacing.unit,
  },
  footerWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 12,
    [theme.breakpoints.down('sm')]: {
      justifyContent: "center",
    }
  },
  footer: {
    color: theme.palette.grey[600],
    flexGrow: 1,
    flexWrap: "wrap",
    maxWidth: 450,
    display: "flex",
    justifyContent: "space-around",
  },
  loggedOutFooter: {
    maxWidth: 450,
    marginLeft: "auto"
  },
  largeScreenLoggedOutSequences: {
    marginTop: 2,
    marginBottom: 2,
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  smallScreenLoggedOutSequences: {
    [theme.breakpoints.up('md')]: {
      display: "none",
    },
  },
  loggedOutCustomizeLabel: {
    fontSize: "1rem",
    fontStyle: "italic"
  },
  posts: {
    boxShadow: theme.palette.boxShadow.default,
  },
  curated: {
    marginTop: 12
  },
  expandIcon: {
    position: 'relative',
    top: 3,
    left: 10,
    fontSize: 16,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
  readMoreLink: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600,
    '@media (max-width: 350px)': {
      display: 'none'
    },
    ...(isFriendlyUI && {
      "&:hover": {
        color: theme.palette.grey[1000],
        opacity: 1,
      },
    }),
  },
});

const getFrontPageOverwrites = (haveCurrentUser: boolean): Partial<RecommendationsAlgorithm> => {
  if (isFriendlyUI) {
    return {
      method: haveCurrentUser ? 'sample' : 'top',
      count: haveCurrentUser ? 3 : 5
    }
  }
  if (isLW) {
    return {
      lwRationalityOnly: true,
      method: 'sample',
      count: haveCurrentUser ? 3 : 2
    }
  }
  return {
    method: 'sample',
    count: haveCurrentUser ? 3 : 2
  }
}

// NOTE: this component maybe should be deprecated. It first was created for LessWrong, then EA Forum added a bunch of special cases, then LW added
// more special cases. I split it off into a LWRecommendations component, it looks like EA Forum isn't currently using this component. They could either \
// create an EARecommendations component, or we can just delete it.
const RecommendationsAndCurated = ({
  configName,
  classes,
}: {
  configName: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "recommendations",
    onExpandEvent: "recommendationsSectionExpanded",
    onCollapseEvent: "recommendationsSectionCollapsed",
    defaultExpanded: isEAForum ? "loggedOut" : "all",
    cookieName: SHOW_RECOMMENDATIONS_SECTION_COOKIE,
  });

  const currentUser = useCurrentUser();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettings] = useState<any>(null);

  const {continueReading} = useContinueReading();
  const { captureEvent } = useTracking({eventProps: {pageSectionContext: "recommendations"}});

  const toggleSettings = useCallback(() => {
    captureEvent("toggleSettings", {action: !showSettings})
    setShowSettings(!showSettings);
  }, [showSettings, captureEvent, setShowSettings]);

  const render = () => {
    const settings = getRecommendationSettings({settings: settingsState, currentUser, configName})
    const frontpageRecommendationSettings: RecommendationsAlgorithm = {
      ...settings,
      ...getFrontPageOverwrites(!!currentUser)
    }

    const continueReadingTooltip = <div>
      <div>The next posts in sequences you've started reading, but not finished.</div>
    </div>

    const bookmarksTooltip = <div>
      <div>Individual posts that you've {isFriendlyUI ? 'saved' : 'bookmarked'}</div>
      <div><em>(Click to see all)</em></div>
    </div>

    // Disabled during 2018 Review [and coronavirus]
    const recommendationsTooltip = <div>
      <div>
        {isEAForum ?
          'Assorted suggested reading, including some of the ' :
          'Recently curated posts, as well as a random sampling of '}
        top-rated posts of all time
        {settings.onlyUnread && " that you haven't read yet"}.
      </div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    const renderBookmarks = !isEAForum && ((currentUser?.bookmarkedPostsMetadata?.length || 0) > 0) && !settings.hideBookmarks
    const renderContinueReading = !isEAForum && currentUser && (continueReading?.length > 0) && !settings.hideContinueReading
    
    const renderRecommendations = !settings.hideFrontpage

    const bookmarksLimit = (settings.hideFrontpage && settings.hideContinueReading) ? 6 : 3

    const titleText = isEAForum ? "Classic posts" : "Recommendations"
    const titleNode = (
      <div>
        <SectionTitle
          title={
            <>
              {isEAForum ? (
                <>{ titleText }</>
              ) : (
                <LWTooltip title={recommendationsTooltip} placement="left">
                  <Link to={"/recommendations"}>{titleText}</Link>
                </LWTooltip>
              )}
              {isEAForum && (
                <LWTooltip title={expanded ? "Collapse" : "Expand"} hideOnTouchScreens>
                  <ForumIcon
                    icon={expanded ? "ThickChevronDown" : "ThickChevronRight"}
                    onClick={toggleExpanded}
                    className={classes.expandIcon}
                  />
                </LWTooltip>
              )}
            </>
          }
        >
          {!isEAForum && currentUser && (
            <LWTooltip title="Customize your recommendations">
              <SettingsButton showIcon={false} onClick={toggleSettings} label="Customize" textShadow />
            </LWTooltip>
          )}
          {isEAForum && expanded && (
            <Link to="/recommendations" className={classes.readMoreLink}>
              View more
            </Link>
          )}
        </SectionTitle>
      </div>
    );

    const bodyNode = (
      <>
        {isLW && (
          <AnalyticsContext pageSubSectionContext="frontpageCuratedCollections">
            <DismissibleSpotlightItem current />
          </AnalyticsContext>
        )}

        {/*Delete after the dust has settled on other Recommendations stuff*/}
        {!currentUser && isLW && (
          <div>
            {/* <div className={classes.largeScreenLoggedOutSequences}>
            <AnalyticsContext pageSectionContext="frontpageCuratedSequences">
              <CuratedSequences />
            </AnalyticsContext>
          </div>
          <div className={classes.smallScreenLoggedOutSequences}>
            <ContinueReadingList continueReading={continueReading} />
          </div> */}
          </div>
        )}

        <div className={classes.subsection}>
          <div className={classes.posts}>
            {renderRecommendations && (
              <AnalyticsContext
                listContext="frontpageFromTheArchives"
                pageSubSectionContext="frontpageFromTheArchives"
                capturePostItemOnMount
              >
                <RecommendationsList algorithm={frontpageRecommendationSettings} />
              </AnalyticsContext>
            )}
            {!isEAForum && (
              <div className={classes.curated}>
                <CuratedPostsList />
              </div>
            )}
          </div>
        </div>

        {renderContinueReading && (
          <div className={currentUser ? classes.subsection : undefined}>
            <AnalyticsContext pageSubSectionContext="continueReading">
              <LWTooltip placement="top-start" title={continueReadingTooltip}>
                <Link to={"/library"}>
                  <SectionSubtitle>
                    Continue Reading
                  </SectionSubtitle>
                </Link>
              </LWTooltip>
              <ContinueReadingList continueReading={continueReading} />
            </AnalyticsContext>
          </div>
        )}

        {renderBookmarks && (
          <div className={classes.subsection}>
            <AnalyticsContext
              pageSubSectionContext="frontpageBookmarksList"
              listContext={"frontpageBookmarksList"}
              capturePostItemOnMount
            >
              <LWTooltip placement="top-start" title={bookmarksTooltip}>
                <Link to={isFriendlyUI ? "/saved" : "/bookmarks"}>
                  <SectionSubtitle>{isFriendlyUI ? "Saved posts" : "Bookmarks"}</SectionSubtitle>
                </Link>
              </LWTooltip>
              <BookmarksList limit={bookmarksLimit} hideLoadMore={true} />
            </AnalyticsContext>
          </div>
        )}

        {/* disabled except during review */}
        {/* <AnalyticsContext pageSectionContext="LessWrong 2018 Review">
          <FrontpageVotingPhase settings={frontpageRecommendationSettings} />
        </AnalyticsContext> */}
      </>
    );

    return <SingleColumnSection className={classes.section}>
      <AnalyticsContext pageSectionContext="recommendations">
        {titleNode}
        {showSettings &&
          <RecommendationsAlgorithmPicker
            configName={configName}
            settings={frontpageRecommendationSettings}
            onChange={(newSettings) => setSettings(newSettings)}
          /> }
        {(expanded || !isEAForum) && bodyNode}
      </AnalyticsContext>
    </SingleColumnSection>
  }

  return render();
}

const RecommendationsAndCuratedComponent = registerComponent("RecommendationsAndCurated", RecommendationsAndCurated, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsAndCurated: typeof RecommendationsAndCuratedComponent
  }
}

export default RecommendationsAndCuratedComponent;
