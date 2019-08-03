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
    [theme.breakpoints.down('sm')]:{
      marginBottom: theme.spacing.unit*1.5,
    },
    marginBottom: theme.spacing.unit,
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
    const { BetaTag, RecommendationsAlgorithmPicker, SingleColumnSection, SettingsIcon, ContinueReadingList, RecommendationsList, PostsList2, SubscribeWidget, SectionTitle, SectionSubtitle, SubSection } = Components;
    
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
    const curatedUrl = "/allPosts?filter=curated&sortedBy=new&timeframe=allTime"

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

      {!settings.hideFrontpage && <div>
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
      </div>}
      
      <Tooltip placement="top-start" title={curatedTooltip}>
        <Link to={curatedUrl}>
          <SectionSubtitle className={classNames(classes.subtitle, classes.curated)}>
            Recently Curated
          </SectionSubtitle>
        </Link>
      </Tooltip>
      <SubSection>
        <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false}>
          <Link to={curatedUrl}>View All Curated Posts</Link>
          <SubscribeWidget view={"curated"} />
        </PostsList2>
      </SubSection>
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
