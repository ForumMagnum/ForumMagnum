import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import withUser from '../common/withUser';
import Users from '../../lib/collections/users/collection';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { withContinueReading } from './withContinueReading';
import {AnalyticsContext} from "../../lib/analyticsEvents";

export const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

const styles = theme => ({
  section: {
    marginTop: -12,
  },
  continueReadingList: {
    marginBottom: theme.spacing.unit*2,
  },
  subsection: {
    marginBottom: theme.spacing.unit*2,
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
    color: theme.palette.lwTertiary.main,
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
});

const defaultFrontpageSettings = {
  method: "sample",
  count: 3,
  scoreOffset: 0,
  scoreExponent: 3,
  personalBlogpostModifier: 0,
  frontpageModifier: 10,
  curatedModifier: 50,
}


interface ExternalProps {
  configName: string
}
interface RecommendationsAndCuratedProps extends ExternalProps, WithUserProps, WithStylesProps {
  continueReading: any,
}
interface RecommendationsAndCuratedState {
  showSettings: boolean,
  settings: any,
}

class RecommendationsAndCurated extends PureComponent<RecommendationsAndCuratedProps,RecommendationsAndCuratedState> {
  state: RecommendationsAndCuratedState = {
    showSettings: false,
    settings: null,
  }

  toggleSettings = () => {
    this.setState(prevState => ({showSettings: !prevState.showSettings}))
  }

  changeSettings = (newSettings) => {
    this.setState({
      settings: newSettings
    });
  }

  render() {
    const { continueReading, classes, currentUser, configName } = this.props;
    const { showSettings } = this.state
    const { RecommendationsAlgorithmPicker, SingleColumnSection, SettingsIcon, ContinueReadingList, PostsList2, RecommendationsList, SectionTitle, SectionSubtitle, BookmarksList, LWTooltip } = Components;

    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})

    const curatedTooltip = <div>
      <div>Every few days, LessWrong moderators manually curate posts that are well written and informative.</div>
      <div><em>(Click to see more curated posts)</em></div>
    </div>

    const coreReadingTooltip = <div>
      <div>Collections of posts that form the core background knowledge of the LessWrong community</div>
    </div>

    const continueReadingTooltip = <div>
      <div>The next posts in sequences you've started reading, but not finished.</div>
    </div>

    const bookmarksTooltip = <div>
      <div>Individual posts that you've bookmarked</div>
      <div><em>(Click to see all)</em></div>
    </div>

    // Disabled during 2018 Review [and coronavirus]
    const allTimeTooltip = <div>
      <div>
        A weighted, randomized sample of the highest karma posts
        {settings.onlyUnread && " that you haven't read yet"}.
      </div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    // defaultFrontpageSettings does not contain anything that overrides a user
    // editable setting, so the reverse ordering here is fine
    const frontpageRecommendationSettings = {
      ...settings,
      ...defaultFrontpageSettings
    }

    const renderBookmarks = ((currentUser?.bookmarkedPostsMetadata?.length || 0) > 0) && !settings.hideBookmarks
    const renderContinueReading = (continueReading?.length > 0) && !settings.hideContinueReading

    return <SingleColumnSection className={classes.section}>
      <SectionTitle title="Recommendations">
        {currentUser && <LWTooltip title="Customize your recommendations">
          <SettingsIcon onClick={this.toggleSettings} label="Settings"/>
        </LWTooltip>}
      </SectionTitle>
      {showSettings &&
        <RecommendationsAlgorithmPicker
          configName={configName}
          settings={frontpageRecommendationSettings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }

      {renderContinueReading && <div className={currentUser ? classes.subsection : null}>
          {currentUser && <LWTooltip placement="top-start" title={currentUser ? continueReadingTooltip : coreReadingTooltip}>
            <Link to={"/library"}>
              <SectionSubtitle className={classNames(classes.subtitle, classes.continueReading)}>
                 Continue Reading
              </SectionSubtitle>
            </Link>
          </LWTooltip>}
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

      {/* Disabled during 2018 Review [and coronavirus season] */}
      <div className={currentUser ? classes.subsection : null}>
        {currentUser && (renderBookmarks || renderContinueReading) && <LWTooltip placement="top-start" title={allTimeTooltip}>
          <Link to={"/recommendations"}>
            <SectionSubtitle className={classNames(classes.subtitle, classes.fromTheArchives)} >
              Curated and Archives
            </SectionSubtitle>
          </Link>
        </LWTooltip>}
        {currentUser && !settings.hideFrontpage &&
          <AnalyticsContext listContext={"frontpageFromTheArchives"} capturePostItemOnMount>
            <RecommendationsList algorithm={frontpageRecommendationSettings} />
          </AnalyticsContext>
        }
        <AnalyticsContext listContext={"curatedPosts"}>
          <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false} hideLastUnread={true}/>
        </AnalyticsContext>
      </div>
    </SingleColumnSection>
  }
}

const RecommendationsAndCuratedComponent = registerComponent<ExternalProps>("RecommendationsAndCurated", RecommendationsAndCurated, {
  styles,
  hocs: [
    withUpdate({
      collection: Users,
      fragmentName: "UsersCurrent",
    }),
    withContinueReading, withUser,
  ]
});

declare global {
  interface ComponentTypes {
    RecommendationsAndCurated: typeof RecommendationsAndCuratedComponent
  }
}

