import React, { PureComponent } from 'react';
import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';

const styles = theme => ({
  gearIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
  topUnread: {
    marginTop: theme.spacing.unit,
  },
  curated: {
    marginTop: theme.spacing.unit*2,
  },
  subtitle: {
    display: "block",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: theme.spacing.unit/2,
  },
  list: {
    marginLeft: theme.spacing.unit*2
  }
});

class RecommendationsAndCurated extends PureComponent {
  // This component will eventually get some settings again, so leaving the infrastructure here
  // state = {
  //   settingsVisible: false,
  //   settings: null
  // }
  
  // toggleSettings = () => {
  //   this.setState({
  //     settingsVisible: !this.state.settingsVisible,
  //   });
  // }
  
  // changeSettings = (newSettings) => {
  //   this.setState({
  //     settings: newSettings
  //   });
  // }
  
  render() {
    const { classes } = this.props;
    const { SingleColumnSection, SectionTitle,
      RecommendationsList, PostsList2, SubscribeWidget } = Components;
    // const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})
    
    const curatedTooltip = <div>
      <div>Every few days, LessWrong moderators manually curate posts that are well written and informative.</div>
      <div><em>(Click to see more curated posts)</em></div>
    </div>

    const allTimeTooltip = <div>
      <div>A weighted, randomized sample of the highest karma posts that you haven't read yet.</div>
      <div><em>(Click to see more recommendations)</em></div>
    </div>

    const frontpageRecommendationSettings = {
      method: "sample",
      count: 3,
      scoreOffset: 0,
      scoreExponent: 3,
      personalBlogpostModifier: 0,
      frontpageModifier: 10,
      curatedModifier: 50,
      onlyUnread: true,
    }
    return <SingleColumnSection>
      <SectionTitle title="Recommendations [Beta]">
        {/* <SettingsIcon className={classes.gearIcon} onClick={this.toggleSettings}/> */}
      </SectionTitle>
      <Tooltip placement="top-start" title={allTimeTooltip}>
        <Link className={classNames(classes.subtitle, classes.topUnread)} to={"/recommendations"}>
          Top Unread Posts
        </Link>
      </Tooltip>
      <div className={classes.list}>
        <RecommendationsList
          algorithm={frontpageRecommendationSettings}
        />
      </div>
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
  withUser, withStyles(styles, {name: "RecommendationsAndCurated"}));