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
import Hidden from '@material-ui/core/Hidden';
export const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

const styles = theme => ({
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
  sequenceGrid: {
    marginTop: 2,
    marginBottom: 2,
  },
  loggedOutCustomizeLabel: {
    fontSize: "1rem",
    fontStyle: "italic"
  },
  posts: {
    boxShadow: theme.boxShadow
  }
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
    const { SequencesGridWrapper, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsButton, ContinueReadingList, PostsList2, RecommendationsList, SectionTitle, SectionSubtitle, BookmarksList, LWTooltip } = Components;

    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})

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
        {/* TODO; Text change */}
        Recently curated posts, as well as a random sampling of top-rated posts of all time
        {settings.onlyUnread && " that you haven't read yet"}.
      </div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    // defaultFrontpageSettings does not contain anything that overrides a user
    // editable setting, so the reverse ordering here is fine
    const frontpageRecommendationSettings = {
      ...settings,
      ...defaultFrontpageSettings,
      count: currentUser ? 3 : 2,
    }

    const renderBookmarks = ((currentUser?.bookmarkedPostsMetadata?.length || 0) > 0) && !settings.hideBookmarks
    const renderContinueReading = currentUser && (continueReading?.length > 0) && !settings.hideContinueReading

    return <SingleColumnSection className={classes.section}>
      <SectionTitle title={<LWTooltip title={recommendationsTooltip} placement="left">
        <Link to={"/recommendations"}>Recommendations</Link>
      </LWTooltip>}>
        {currentUser &&
          <LWTooltip title="Customize your recommendations">
            <SettingsButton showIcon={false} onClick={this.toggleSettings} label="Customize"/>
          </LWTooltip>
        }
      </SectionTitle>

      {showSettings &&
        <RecommendationsAlgorithmPicker
          configName={configName}
          settings={frontpageRecommendationSettings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }

      {!currentUser && <div>
          <Hidden smDown implementation="css">
            <div className={classes.sequenceGrid}>
              <SequencesGridWrapper
                terms={{'view':'curatedSequences', limit:3}}
                showAuthor={true}
                showLoadMore={false}
              />
            </div>
          </Hidden>
          <Hidden mdUp implementation="css">
            <ContinueReadingList continueReading={continueReading} />
          </Hidden>
        </div>}

      {/* Disabled during 2018 Review [and coronavirus season] */}
      <div className={currentUser ? classes.subsection : null}>
        <div className={classes.posts}>
          {!settings.hideFrontpage &&
            <AnalyticsContext listContext={"frontpageFromTheArchives"} capturePostItemOnMount>
              <RecommendationsList algorithm={frontpageRecommendationSettings} />
            </AnalyticsContext>
          }
          <AnalyticsContext listContext={"curatedPosts"}>
            <PostsList2 terms={{view:"curated", limit: currentUser ? 3 : 2}} showNoResults={false} showLoadMore={false} hideLastUnread={true} />
          </AnalyticsContext>
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
