import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper'
import { getRecommendationSettings, archiveRecommendationsName } from './RecommendationsAlgorithmPicker'
import type { DefaultRecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { isLW } from '../../lib/instanceSettings';

const ConfigurableRecommendationsList = ({configName}: {
  configName: string
}) => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<Partial<DefaultRecommendationsAlgorithm>|null>(null);
  const currentUser = useCurrentUser();

  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
  }

  const changeSettings = (newSettings: Partial<DefaultRecommendationsAlgorithm>) => {
    setSettings(newSettings);
  }

  const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
    RecommendationsList, SettingsButton, LWTooltip } = Components;
  const settingsOrDefault = getRecommendationSettings({settings, currentUser, configName})

  return <SingleColumnSection>
    <SectionTitle
      title={<LWTooltip
        title={`A weighted, randomized sample of the highest karma posts${settingsOrDefault.onlyUnread ? " that you haven't read yet" : ""}.`}
      >
        <Link to={'/recommendations'}>
          {archiveRecommendationsName}
        </Link>
      </LWTooltip>}
    >
      {isLW && <SettingsButton onClick={toggleSettings}/>}
    </SectionTitle>
    { settingsVisible &&
      <RecommendationsAlgorithmPicker
        configName={configName}
        settings={settingsOrDefault}
        onChange={(newSettings) => changeSettings(newSettings)}
      /> }
    <RecommendationsList
      algorithm={settingsOrDefault}
    />
  </SingleColumnSection>
}

const ConfigurableRecommendationsListComponent = registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList);

declare global {
  interface ComponentTypes {
    ConfigurableRecommendationsList: typeof ConfigurableRecommendationsListComponent
  }
}
