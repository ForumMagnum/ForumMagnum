import React, { useState, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { getRecommendationSettings, RecommendationsAlgorithmPicker } from './RecommendationsAlgorithmPicker'
import { useContinueReading } from './withContinueReading';
import {AnalyticsContext, useTracking} from "../../lib/analyticsEvents";
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { hasCuratedPostsSetting } from '../../lib/instanceSettings';
import { DismissibleSpotlightItem } from "../spotlights/DismissibleSpotlightItem";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SettingsButton } from "../icons/SettingsButton";
import { RecommendationsList } from "./RecommendationsList";
import { SectionTitle } from "../common/SectionTitle";
import { LWTooltip } from "../common/LWTooltip";
import { CuratedPostsList } from "./CuratedPostsList";
import { Book2020FrontpageWidget } from "../books/Book2020FrontpageWidget";
import { SectionSubtitle } from "../common/SectionSubtitle";
import { ContinueReadingList } from "./ContinueReadingList";
import { BookmarksList } from "../bookmarks/BookmarksList";

export const curatedUrl = "/recommendations"

const styles = (theme: ThemeType) => ({
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
    }
  },
});

const getFrontPageOverwrites = (haveCurrentUser: boolean): Partial<RecommendationsAlgorithm> => {
  return {
    lwRationalityOnly: true,
    method: 'sample',
    count: haveCurrentUser ? 3 : 2
  }
}

export const bookDisplaySetting = new DatabasePublicSetting<boolean>('bookDisplaySetting', false)

const LWRecommendationsInner = ({
  configName,
  classes,
}: {
  configName: string,
  classes: ClassesType<typeof styles>,
}) => {

  const currentUser = useCurrentUser();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettings] = useState<any>(null);

  const { captureEvent } = useTracking({eventProps: {pageSectionContext: "recommendations"}});
  const {continueReading} = useContinueReading();

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

    // Disabled during 2018 Review [and coronavirus]
    const recommendationsTooltip = <div>
      <div>
        Recently curated posts, as well as a random sampling of top-rated posts of all time
        {settings.onlyUnread && " that you haven't read yet"}.
      </div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    const renderRecommendations = !settings.hideFrontpage && !bookDisplaySetting.get()

    const titleText = "Recommendations"
    const titleNode = (
      <div>
        <SectionTitle
          title={
            <>
              <LWTooltip title={recommendationsTooltip} placement="left">
                <Link to={"/recommendations"}>{titleText}</Link>
              </LWTooltip>
            </>
          }
        >
          {currentUser && (
            <LWTooltip title="Customize your recommendations">
              <SettingsButton showIcon={false} onClick={toggleSettings} label="Customize" textShadow />
            </LWTooltip>
          )}
        </SectionTitle>
      </div>
    );

    const continueReadingTooltip = <div>
      <div>The next posts in sequences you've started reading, but not finished.</div>
    </div>

    const bookmarksTooltip = <div>
      <div>Individual posts that you've bookmarked</div>
      <div><em>(Click to see all)</em></div>
    </div>


    const bookmarksLimit = (settings.hideFrontpage && settings.hideContinueReading) ? 6 : 3
    const renderBookmarks = ((currentUser?.bookmarkedPostsMetadata?.length || 0) > 0) && !settings.hideBookmarks

    const renderContinueReading = currentUser && (continueReading?.length > 0) && !settings.hideContinueReading

    return <SingleColumnSection className={classes.section}>
      {bookDisplaySetting.get() && <Book2020FrontpageWidget/>}
      <AnalyticsContext pageSectionContext="recommendations">
        {titleNode}
        {showSettings &&
          <RecommendationsAlgorithmPicker
            configName={configName}
            settings={frontpageRecommendationSettings}
            onChange={(newSettings) => setSettings(newSettings)}
          /> }
        {!bookDisplaySetting.get() && <AnalyticsContext pageSubSectionContext="spotlightItem">
          <DismissibleSpotlightItem current />
        </AnalyticsContext>}

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
            {hasCuratedPostsSetting.get() && <div className={classes.curated}>
              <CuratedPostsList />
            </div>}
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
                <Link to="/bookmarks">
                  <SectionSubtitle>Bookmarks</SectionSubtitle>
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
      </AnalyticsContext>
    </SingleColumnSection>
  }

  return render();
}

export const LWRecommendations = registerComponent("LWRecommendations", LWRecommendationsInner, {styles});


