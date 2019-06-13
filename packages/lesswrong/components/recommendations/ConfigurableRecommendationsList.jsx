import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import withUser from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper'
import { getRecommendationSettings } from './RecommendationsAlgorithmPicker'

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
  
  changeSettings = (newSettings) => {
    this.setState({
      settings: newSettings
    });
  }
  
  render() {
    const { currentUser, configName } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList, SettingsIcon } = Components;
    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})
    
    return <SingleColumnSection>
      <SectionTitle
        title={<Link to={'/recommendations'}>
          Recommended
        </Link>}
      >
        <SettingsIcon onClick={this.toggleSettings}/>
      </SectionTitle>
      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          configName={configName}
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

registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList, withUser);
