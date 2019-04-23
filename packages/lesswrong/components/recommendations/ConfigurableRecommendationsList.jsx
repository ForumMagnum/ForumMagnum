import React, { PureComponent } from 'react';
import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import deepmerge from 'deepmerge';
import Users from 'meteor/vulcan:users';

const styles = theme => ({
  gearIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
});

const defaultAlgorithmSettings = {
  method: "top",
  count: 10,
  scoreOffset: 0,
  scoreExponent: 3,
  personalBlogpostModifier: 0,
  frontpageModifier: 10,
  curatedModifier: 50,
  onlyUnread: true,
};

const slotSpecificSettingDefaults = {
  frontpage: {
    count: 4
  }
};

class ConfigurableRecommendationsList extends PureComponent {
  state = {
    settingsVisible: false,
    settings: null
  }
  
  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
  }
  
  getDefaultSettings = () => {
    const { configName } = this.props;
    if (configName in slotSpecificSettingDefaults) {
      return deepmerge(defaultAlgorithmSettings, slotSpecificSettingDefaults[configName]);
    } else {
      return defaultAlgorithmSettings;
    }
  }
  
  getCurrentSettings = () => {
    if (this.state.settings)
      return this.state.settings;
    
    const { currentUser, configName } = this.props;
    if (currentUser && currentUser.recommendationSettings && configName in currentUser.recommendationSettings) {
      return deepmerge(this.getDefaultSettings(), currentUser.recommendationSettings[configName]||{});
    } else {
      return this.getDefaultSettings();
    }
  }
  
  changeSettings = (newSettings) => {
    const { updateUser, currentUser, configName } = this.props;
    
    this.setState({
      settings: newSettings
    });
    
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id },
        data: {
          [`recommendationSettings.${configName}`]: newSettings
        },
      });
    }
  }
  
  render() {
    const { classes } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList } = Components;
    const settings = this.getCurrentSettings();
    
    return <SingleColumnSection>
      <SectionTitle title="Recommended">
        <SettingsIcon className={classes.gearIcon} onClick={this.toggleSettings}/>
      </SectionTitle>
      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          settings={settings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }
      <NoSSR>
        <RecommendationsList
          algorithm={settings}
        />
      </NoSSR>
    </SingleColumnSection>
  }
}

registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList,
  [withUpdate, {
    collection: Users,
    fragmentName: "UsersCurrent",
  }],
  withUser, withStyles(styles, {name: "ConfigurableRecommendationsList"}));