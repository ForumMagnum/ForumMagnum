import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { useContinueReading } from './withContinueReading';
import {AnalyticsContext, useTracking} from "../../lib/analyticsEvents";
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

export const curatedUrl = "/recommendations"

const styles = (theme: ThemeType): JssStyles => ({
  section: isEAForum ? {} : {
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
  }
});

const getFrontPageOverwrites = (haveCurrentUser: boolean): Partial<RecommendationsAlgorithm> => {
  if (forumTypeSetting.get() === 'EAForum') {
    return {
      method: haveCurrentUser ? 'sample' : 'top',
      count: haveCurrentUser ? 3 : 5
    }
  }
  if (forumTypeSetting.get() === "LessWrong") {
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

const isLW = forumTypeSetting.get() === 'LessWrong'

const RecommendationsAndCurated = ({
  configName,
  classes,
}: {
  configName: string,
  classes: ClassesType,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettings] = useState<any>(null);
  const currentUser = useCurrentUser();
  const {continueReading} = useContinueReading();
  const { captureEvent } = useTracking({eventProps: {pageSectionContext: "recommendations"}});
  const isEAForum = forumTypeSetting.get() === 'EAForum';

  const toggleSettings = useCallback(() => {
    captureEvent("toggleSettings", {action: !showSettings})
    setShowSettings(!showSettings);
  }, [showSettings, captureEvent, setShowSettings]);

  const render = () => {
    const { CurrentSpotlightItem, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsButton, ContinueReadingList,
      RecommendationsList, SectionTitle, SectionSubtitle, BookmarksList, LWTooltip, CuratedPostsList } = Components;

    const settings = getRecommendationSettings({settings: settingsState, currentUser, configName})
    const frontpageRecommendationSettings: RecommendationsAlgorithm = {
      ...settings,
      ...getFrontPageOverwrites(!!currentUser)
    }

    const continueReadingTooltip = <div>
      <div>The next posts in sequences you've started reading, but not finished.</div>
    </div>

    const bookmarksTooltip = <div>
      <div>Individual posts that you've {isEAForum ? 'saved' : 'bookmarked'}</div>
      <div><em>(Click to see all)</em></div>
    </div>

    // Disabled during 2018 Review [and coronavirus]
    const recommendationsTooltip = <div>
      <div>
        {forumTypeSetting.get() === 'EAForum' ?
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

    return <SingleColumnSection className={classes.section}>
      <AnalyticsContext pageSectionContext="recommendations">
        <SectionTitle title={<LWTooltip title={recommendationsTooltip} placement="left">
          <Link to={"/recommendations"}>
            {isEAForum ? 'Classic posts' : 'Recommendations'}
          </Link>
        </LWTooltip>}>
          {!isEAForum && currentUser &&
            <LWTooltip title="Customize your recommendations">
              <SettingsButton showIcon={false} onClick={toggleSettings} label="Customize"/>
            </LWTooltip>
          }
        </SectionTitle>

        {showSettings &&
          <RecommendationsAlgorithmPicker
            configName={configName}
            settings={frontpageRecommendationSettings}
            onChange={(newSettings) => setSettings(newSettings)}
          /> }

        {isLW && <AnalyticsContext pageSubSectionContext="frontpageCuratedCollections">
          <CurrentSpotlightItem />
        </AnalyticsContext>}
  
        {/*Delete after the dust has settled on other Recommendations stuff*/}
        {!currentUser && forumTypeSetting.get() === 'LessWrong' && <div>
        {/* <div className={classes.largeScreenLoggedOutSequences}>
            <AnalyticsContext pageSectionContext="frontpageCuratedSequences">
              <CuratedSequences />
            </AnalyticsContext>
          </div>
          <div className={classes.smallScreenLoggedOutSequences}>
            <ContinueReadingList continueReading={continueReading} />
          </div> */}
        </div>}

        <div className={classes.subsection}>
          <div className={classes.posts}>
            {renderRecommendations && 
              <AnalyticsContext listContext="frontpageFromTheArchives" pageSubSectionContext="frontpageFromTheArchives" capturePostItemOnMount>
                <RecommendationsList algorithm={frontpageRecommendationSettings} />
              </AnalyticsContext>
            }
            {forumTypeSetting.get() !== "EAForum" && <div className={classes.curated}>
              <CuratedPostsList />
            </div>}
          </div>
        </div>

        {renderContinueReading && <div className={currentUser ? classes.subsection : null}>
          <AnalyticsContext pageSubSectionContext="continueReading">
            <LWTooltip placement="top-start" title={continueReadingTooltip}>
              <Link to={"/library"}>
                <SectionSubtitle className={classNames(classes.subtitle, classes.continueReading)}>
                  Continue Reading
                </SectionSubtitle>
              </Link>
            </LWTooltip>
            <ContinueReadingList continueReading={continueReading} />
          </AnalyticsContext>
        </div>}

        {renderBookmarks && <div className={classes.subsection}>
          <AnalyticsContext pageSubSectionContext="frontpageBookmarksList" listContext={"frontpageBookmarksList"} capturePostItemOnMount>
            <LWTooltip placement="top-start" title={bookmarksTooltip}>
              <Link to={"/bookmarks"}>
                <SectionSubtitle>
                  {isEAForum ? "Saved Posts" : "Bookmarks"}
                </SectionSubtitle>
              </Link>
            </LWTooltip>
            <BookmarksList limit={bookmarksLimit} hideLoadMore={true}/>
          </AnalyticsContext>
        </div>}

        {/* disabled except during review */}
        {/* <AnalyticsContext pageSectionContext="LessWrong 2018 Review">
          <FrontpageVotingPhase settings={frontpageRecommendationSettings} />
        </AnalyticsContext> */}
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
