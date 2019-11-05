import React, { PureComponent } from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import Tooltip from '@material-ui/core/Tooltip';
import withUser from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper'
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'
import { captureEvent } from '../../lib/analyticsEvents';

const recommendedName = getSetting('forumType') === 'EAForum' ? 'Community Favorites' : 'Recommended'

class ConfigurableRecommendationsList extends PureComponent {
  state = {
    settingsVisible: false,
    settings: null
  }

  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
    if (this.state.settingsVisible) {
      captureEvent("recommendationSettingsOpened");
    }
  }

  changeSettings = (newSettings) => {
    this.setState({
      settings: newSettings
    });
    captureEvent("recommendationSettingsChanged");
  }

  render() {
    const { currentUser, configName } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList, SettingsIcon } = Components;
    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})

    return <SingleColumnSection>
      <SectionTitle
        title={<Tooltip
          title={`A weighted, randomized sample of the highest karma posts${settings.onlyUnread ? " that you haven't read yet" : ""}.`}
        >
          <Link to={'/recommendations'}>
            {recommendedName}
          </Link>
        </Tooltip>}
      >
        <SettingsIcon onClick={this.toggleSettings}/>
      </SectionTitle>
      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          configName={configName}
          settings={settings}
          onChange={(newSettings) => this.changeSettings(newSettings)}
        /> }
      <RecommendationsList
        algorithm={settings}
      />
    </SingleColumnSection>
  }
}

registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList, withUser);
