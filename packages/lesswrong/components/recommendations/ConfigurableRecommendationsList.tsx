import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper'
import { getRecommendationSettings, archiveRecommendationsName } from './RecommendationsAlgorithmPicker'
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

interface ExternalProps {
  configName: string,
}
interface ConfigurableRecommendationsListProps extends ExternalProps, WithUserProps {
}
interface ConfigurableRecommendationsListState {
  settingsVisible: boolean,
  settings: Partial<RecommendationsAlgorithm>|null,
}

class ConfigurableRecommendationsList extends PureComponent<ConfigurableRecommendationsListProps,ConfigurableRecommendationsListState> {
  state = {
    settingsVisible: false,
    settings: null
  }

  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
  }

  changeSettings = (newSettings: Partial<RecommendationsAlgorithm>) => {
    this.setState({
      settings: newSettings
    });
  }

  render() {
    const { currentUser, configName } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList, SettingsButton, LWTooltip } = Components;
    const settings = getRecommendationSettings({settings: this.state.settings, currentUser, configName})

    return <SingleColumnSection>
      <SectionTitle
        title={<LWTooltip
          title={`A weighted, randomized sample of the highest karma posts${settings.onlyUnread ? " that you haven't read yet" : ""}.`}
        >
          <Link to={'/recommendations'}>
            {archiveRecommendationsName}
          </Link>
        </LWTooltip>}
      >
        <SettingsButton onClick={this.toggleSettings}/>
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

const ConfigurableRecommendationsListComponent = registerComponent<ExternalProps>(
  "ConfigurableRecommendationsList", ConfigurableRecommendationsList, {
    hocs: [withUser]
  }
);

declare global {
  interface ComponentTypes {
    ConfigurableRecommendationsList: typeof ConfigurableRecommendationsListComponent
  }
}
