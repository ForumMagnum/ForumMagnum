import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { useContinueReading } from './withContinueReading';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
export const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

const styles = (theme: ThemeType): JssStyles => ({
  section: {
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
    boxShadow: theme.boxShadow
  }
});

const getFrontPageOverwrites = (haveCurrentUser: boolean) => {
  if (forumTypeSetting.get() === 'EAForum') {
    return {
      method: haveCurrentUser ? 'sample' : 'top',
      count: haveCurrentUser ? 3 : 5
    }
  }
  return {
    method: 'sample',
    count: haveCurrentUser ? 3 : 2
  }
}

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

  const toggleSettings = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings, setShowSettings]);

  const render = () => {
    const { SequencesGridWrapper, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsButton, ContinueReadingList, RecommendationsList, SectionTitle, SectionSubtitle, BookmarksList, LWTooltip } = Components;

    const settings = getRecommendationSettings({settings: settingsState, currentUser, configName})
    const frontpageRecommendationSettings = {
      ...settings,
      ...getFrontPageOverwrites(!!currentUser)
    }

    const continueReadingTooltip = <div>
      <div>The next posts in sequences you've started reading, but not finished.</div>
    </div>

    const bookmarksTooltip = <div>
      <div>Individual posts that you've bookmarked</div>
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

    const renderBookmarks = ((currentUser?.bookmarkedPostsMetadata?.length || 0) > 0) && !settings.hideBookmarks
    const renderContinueReading = currentUser && (continueReading?.length > 0) && !settings.hideContinueReading

    return <SingleColumnSection className={classes.section}>
      <SectionTitle title={<LWTooltip title={recommendationsTooltip} placement="left">
        <Link to={"/recommendations"}>Recommendations</Link>
      </LWTooltip>}>
        {currentUser &&
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

      {!currentUser && forumTypeSetting.get() !== 'EAForum' && <div>
        <div className={classes.largeScreenLoggedOutSequences}>
          <SequencesGridWrapper
            terms={{'view':'curatedSequences', limit:3}}
            showAuthor={true}
            showLoadMore={false}
          />
        </div>
        <div className={classes.smallScreenLoggedOutSequences}>
          <ContinueReadingList continueReading={continueReading} />
        </div>
      </div>}

      {/* Disabled during 2018 Review [and coronavirus season] */}
      <div className={classes.subsection}>
        <div className={classes.posts}>
          {!settings.hideFrontpage &&
            <AnalyticsContext listContext={"frontpageFromTheArchives"} capturePostItemOnMount>
              <RecommendationsList algorithm={frontpageRecommendationSettings} />
            </AnalyticsContext>
          }
          {/* <AnalyticsContext listContext={"curatedPosts"}>
            <PostsList2
              terms={{view:"curated", limit: currentUser ? 3 : 2}}
              showNoResults={false}
              showLoadMore={false}
              hideLastUnread={true}
              boxShadow={false}
              curatedIconLeft={true}
            />
          </AnalyticsContext> */}
        </div>
      </div>

      {renderContinueReading && <div className={currentUser ? classes.subsection : null}>
          <LWTooltip placement="top-start" title={continueReadingTooltip}>
            <Link to={"/library"}>
              <SectionSubtitle className={classNames(classes.subtitle, classes.continueReading)}>
                 Continue Reading
              </SectionSubtitle>
            </Link>
          </LWTooltip>
          <ContinueReadingList continueReading={continueReading} />
        </div>}

      {renderBookmarks && <div className={classes.subsection}>
        <LWTooltip placement="top-start" title={bookmarksTooltip}>
          <Link to={"/bookmarks"}>
            <SectionSubtitle>
              Bookmarks
            </SectionSubtitle>
          </Link>
        </LWTooltip>
        <AnalyticsContext listContext={"frontpageBookmarksList"} capturePostItemOnMount>
          <BookmarksList limit={3} />
        </AnalyticsContext>
      </div>}

      {/* disabled except during review */}
      {/* <AnalyticsContext pageSectionContext="LessWrong 2018 Review">
        <FrontpageVotingPhase settings={frontpageRecommendationSettings} />
      </AnalyticsContext> */}

      {/* disabled except during coronavirus times */}
      {/* <AnalyticsContext pageSectionContext="coronavirusWidget">
        <div className={classes.subsection}>
          <CoronavirusFrontpageWidget settings={frontpageRecommendationSettings} />
        </div>
      </AnalyticsContext> */}
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
