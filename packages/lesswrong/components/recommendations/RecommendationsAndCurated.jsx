import React, { PureComponent } from 'react';
import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { getRecommendationSettings } from '../../lib/collections/users/recommendationSettings.js';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  gearIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
  subtitle: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit,
  }
});

class RecommendationsAndCurated extends PureComponent {
  state = {
    settingsVisible: false,
    settings: null
  }
  
  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
  }
  
  changeSettings = (newSettings) => {
    this.setState({
      settings: newSettings
    });
  }
  
  render() {
    const { currentUser, configName, classes } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList, PostsList2, SubscribeWidget, SectionButton } = Components;
    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})
    
    const curatedTooltip = <div>
      <div>Every few days, LessWrong moderators manually curate posts that are well written and informative.</div>
      <div><em>(Click to see more curated posts)</em></div>
    </div>

    const allTimeTooltip = <div>
      <div>A weighted, randomized sample of the highest karma posts that you haven't read yet.</div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>


    return <SingleColumnSection>
      <SectionTitle title="Recommendations">
        <SettingsIcon className={classes.gearIcon} onClick={this.toggleSettings}/>
      </SectionTitle>

      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          settings={settings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }
      <SectionButton className={classes.subtitle}>
        <Tooltip placement="top-start" title={allTimeTooltip}>
          <Link to={"/recommendations"}>Top Unread Posts</Link>
        </Tooltip>
      </SectionButton>
      <RecommendationsList
        algorithm={settings}
      />
      <SectionButton className={classes.subtitle}>
        <Tooltip placement="top-start" title={curatedTooltip}>
          <Link to={"/allPosts?filter=curated&view=new"}>Recently Curated</Link>
        </Tooltip>
      </SectionButton>
      <PostsList2 terms={{view:"curated", limit:3}} showLoadMore={false}>
        <SubscribeWidget view={"curated"} />
      </PostsList2>
    </SingleColumnSection>
  }
}

registerComponent("RecommendationsAndCurated", RecommendationsAndCurated,
  [withUpdate, {
    collection: Users,
    fragmentName: "UsersCurrent",
  }],
  withUser, withStyles(styles, {name: "RecommendationsAndCurated"}));