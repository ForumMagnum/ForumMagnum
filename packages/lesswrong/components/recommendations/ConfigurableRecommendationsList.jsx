import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  gearIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
});

class ConfigurableRecommendationsList extends PureComponent {
  state = {
    settingsVisible: false,
    settings: {
      method: "top",
      count: 10,
      scoreOffset: 0,
      scoreExponent: 3,
      personalBlogpostModifier: 0,
      frontpageModifier: 10,
      curatedModifier: 50,
      onlyUnread: true,
    }
  }
  
  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
  }
  
  render() {
    const { classes } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList } = Components;
    
    return <SingleColumnSection>
      <SectionTitle title="Recommended">
        <SettingsIcon className={classes.gearIcon} onClick={this.toggleSettings}/>
      </SectionTitle>
      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          settings={this.state.settings}
          onChange={(settings) => this.setState({settings: settings})}
        /> }
      <NoSSR>
        <RecommendationsList
          count={this.state.settings.count}
          algorithm={this.state.settings}
        />
      </NoSSR>
    </SingleColumnSection>
  }
}

registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList,
  withStyles(styles, {name: "ConfigurableRecommendationsList"}));