import React, { PureComponent } from 'react';
import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { withContinueReading } from './withContinueReading';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';

const styles = theme => ({
  section: {
    marginTop: -12,
  },
  continueReadingList: {
    marginBottom: theme.spacing.unit*2,
  },
  curated: {
    marginTop: theme.spacing.unit,
    display: "block"
  },
  subtitle: {
    [theme.breakpoints.down('sm')]:{
      marginBottom: 0,
    }
  },
  footerWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  footer: {
    color: theme.palette.lwTertiary.main,
    flexGrow: 1,
    maxWidth: 450,
    
    display: "flex",
    justifyContent: "space-around",
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


class RecommendationsAndCurated extends PureComponent {
  state = { showSettings: false, stateSettings: null }

  toggleSettings = () => {
    this.setState(prevState => ({showSettings: !prevState.showSettings}))
  }

  changeSettings = (newSettings) => {
    this.setState({
      settings: newSettings
    });
  }

  render() {
    const { continueReading, classes, currentUser } = this.props;
    const { showSettings } = this.state
    const { BetaTag, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsIcon, ContinueReadingList, PostsList2, SubscribeWidget, SectionTitle, SectionSubtitle, SubSection, SeparatorBullet, BookmarksList, Recommendations2018Review } = Components;

    const configName = "frontpage"
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

    // Disabled during 2018 Review
    // const allTimeTooltip = <div>
    //   <div>
    //     A weighted, randomized sample of the highest karma posts
    //     {settings.onlyUnread && " that you haven't read yet"}.
    //   </div>
    //   <div><em>(Click to see more recommendations)</em></div>
    // </div>

    // defaultFrontpageSettings does not contain anything that overrides a user
    // editable setting, so the reverse ordering here is fine
    const frontpageRecommendationSettings = {
      ...settings,
      ...defaultFrontpageSettings
    }

    const renderBookmarks = (currentUser?.bookmarkedPostsMetadata?.length > 0) && !settings.hideBookmarks
    const renderContinueReading = (continueReading?.length > 0) && !settings.hideContinueReading
    const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

    return <SingleColumnSection className={classes.section}>
      <SectionTitle title="Recommendations">
        <Tooltip title="Customize your recommendations">
          <SettingsIcon onClick={this.toggleSettings} label="Settings"/> 
        </Tooltip>
      </SectionTitle>
      {showSettings &&
        <RecommendationsAlgorithmPicker
          configName={configName}
          settings={frontpageRecommendationSettings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }

      {renderContinueReading && <React.Fragment>
          <div>
            <Tooltip placement="top-start" title={currentUser ? continueReadingTooltip : coreReadingTooltip}>
              <Link to={"/library"}>
                <SectionSubtitle className={classNames(classes.subtitle, classes.continueReading)}>
                  {currentUser ? "Continue Reading" : "Core Reading" }
                </SectionSubtitle>
              </Link>
            </Tooltip>
            <BetaTag />
          </div>
          <SubSection className={classes.continueReadingList}>
            <ContinueReadingList continueReading={continueReading} />
          </SubSection>
        </React.Fragment>}

      {renderBookmarks && <React.Fragment>
        <div>
            <Tooltip placement="top-start" title={bookmarksTooltip}>
              <Link to={"/bookmarks"}>
                <SectionSubtitle className={classes.subtitle}>
                  Bookmarks
                </SectionSubtitle>
              </Link>
            </Tooltip>
            <BetaTag />
          </div>
          <SubSection className={classes.continueReadingList}>
            <BookmarksList limit={3} />
          </SubSection>
      </React.Fragment>}

      <Recommendations2018Review settings={frontpageRecommendationSettings} />

      {/* Disabled during 2018 Review */}
      {/* {!settings.hideFrontpage && <div>
        <div>
          <Tooltip placement="top-start" title={allTimeTooltip}>
            <Link to={"/recommendations"}>
              <SectionSubtitle className={classNames(classes.subtitle, classes.fromTheArchives)} >
                From the Archives
              </SectionSubtitle>
            </Link>
          </Tooltip>
          <BetaTag />
        </div>
        <SubSection>
          <RecommendationsList algorithm={frontpageRecommendationSettings} />
        </SubSection>
      </div>} */}

      <Tooltip placement="top-start" title={curatedTooltip}>
        <Link to={curatedUrl}>
          <SectionSubtitle className={classNames(classes.subtitle, classes.curated)}>
            Recently Curated
          </SectionSubtitle>
        </Link>
      </Tooltip>
      <SubSection>
        <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false} hideLastUnread={true} listContext={"curatedPosts"}/>
      </SubSection>
      <div className={classes.footerWrapper}>
        <Typography component="div" variant="body2" className={classes.footer}>
          <Link to={curatedUrl}>
            { /* On very small screens, use shorter link text ("More Curated"
                 instead of "View All Curated Posts") to avoid wrapping */ }
            <Hidden smUp implementation="css">More Curated</Hidden>
            <Hidden xsDown implementation="css">View All Curated Posts</Hidden>
          </Link>
          <SeparatorBullet/>
          <SubscribeWidget view={"curated"} />
        </Typography>
      </div>
    </SingleColumnSection>
  }
}

registerComponent("RecommendationsAndCurated", RecommendationsAndCurated,
  [withUpdate, {
    collection: Users,
    fragmentName: "UsersCurrent",
  }],
  withContinueReading,
  withUser, withStyles(styles, {name: "RecommendationsAndCurated"}));
