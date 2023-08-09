import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { useContinueReading } from './withContinueReading';
import {AnalyticsContext, useTracking} from "../../lib/analyticsEvents";
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

export const curatedUrl = "/recommendations"

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

const RecommendationsAndCurated = ({
  configName,
  classes,
}: {
  configName: string,
  classes: ClassesType,
}) => {

  const currentUser = useCurrentUser();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettings] = useState<any>(null);

  const { captureEvent } = useTracking({eventProps: {pageSectionContext: "recommendations"}});

  const toggleSettings = useCallback(() => {
    captureEvent("toggleSettings", {action: !showSettings})
    setShowSettings(!showSettings);
  }, [showSettings, captureEvent, setShowSettings]);

  const render = () => {
    const { CurrentSpotlightItem, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsButton,
      RecommendationsList, SectionTitle, LWTooltip, CuratedPostsList } = Components;

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
    
    const renderRecommendations = !settings.hideFrontpage

    const titleText = "Recommendations"
    const titleNode = (
      <div className={classes.title}>
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
              <SettingsButton showIcon={false} onClick={toggleSettings} label="Customize" />
            </LWTooltip>
          )}
        </SectionTitle>
      </div>
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
        <AnalyticsContext pageSubSectionContext="frontpageCuratedCollections">
          <CurrentSpotlightItem />
        </AnalyticsContext>

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
            <div className={classes.curated}>
              <CuratedPostsList />
            </div>
          </div>
        </div>

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
