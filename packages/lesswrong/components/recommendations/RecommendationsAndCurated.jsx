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

const styles = theme => ({
  continueReadingList: {
    marginBottom: theme.spacing.unit*2,
  },
  curated: {
    display: "block",
    marginTop: theme.spacing.unit*2,
  },
  subtitle: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    display: "inline-block",
    [theme.breakpoints.down('sm')]:{
      marginBottom: theme.spacing.unit*1.5,
    },
    marginBottom: theme.spacing.unit,
  },
  list: {
    marginLeft: theme.spacing.unit*2
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
    const { BetaTag, RecommendationsAlgorithmPicker, SingleColumnSection, SectionTitle, SettingsIcon, ContinueReadingList, RecommendationsList, PostsList2, SubscribeWidget } = Components;
    
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
    
    const allTimeTooltip = <div>
      <div>A weighted, randomized sample of the highest karma posts that you haven't read yet.</div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    const frontpageRecommendationSettings = {
      ...settings,
      ...defaultFrontpageSettings
    } 

    const renderContinueReading = continueReading && continueReading.length>0 && !settings.hideContinueReading 

    return <SingleColumnSection>
      <SectionTitle title="Recommendations">
        <SettingsIcon onClick={this.toggleSettings}/>
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
              <Link className={classNames(classes.subtitle, classes.continueReading)} to={"/library"}>
                {currentUser ? "Continue Reading" : "Core Reading" }
              </Link>
            </Tooltip>
            <BetaTag />
          </div>
          <div className={classNames(classes.continueReadingList, classes.list)}>
            <ContinueReadingList continueReading={continueReading} />
          </div>
        </React.Fragment>}

      {!settings.hideFrontpage && <div>
        <div>
          <Tooltip placement="top-start" title={allTimeTooltip}>
            <Link className={classNames(classes.subtitle, classes.fromTheArchives)} to={"/recommendations"}>
              From the Archives
            </Link>
          </Tooltip>
          <BetaTag />
        </div>
        <div className={classes.list}>
          <RecommendationsList algorithm={frontpageRecommendationSettings} />
        </div>
      </div>}
      
      <Tooltip placement="top-start" title={curatedTooltip}>
        <Link className={classNames(classes.subtitle, classes.curated)} to={"/allPosts?filter=curated&view=new"}>
          Recently Curated
        </Link>
      </Tooltip>
      <div className={classes.list}>
        <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false}>
          <Link to={"/allPosts?filter=curated&view=new"}>View All Curated Posts</Link>
          <SubscribeWidget view={"curated"} />
        </PostsList2>
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
