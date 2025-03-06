import React, {useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper'
import { getRecommendationSettings, archiveRecommendationsName } from './RecommendationsAlgorithmPicker'
import type { DefaultRecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { isLW } from '../../lib/instanceSettings';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import RecommendationsAlgorithmPicker from "@/components/recommendations/RecommendationsAlgorithmPicker";
import RecommendationsList from "@/components/recommendations/RecommendationsList";
import SettingsButton from "@/components/icons/SettingsButton";
import LWTooltip from "@/components/common/LWTooltip";

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

export default ConfigurableRecommendationsListComponent;
