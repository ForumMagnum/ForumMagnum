import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
import deepmerge from 'deepmerge';
import { slotSpecificRecommendationSettingDefaults, defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings.js';

// Elements here should match switch cases in recommendations.js
const recommendationAlgorithms = [
  {
    name: "top",
    description: "Top scored"
  },
  {
    name: "sample",
    description: "Weighted sample"
  },
];

function getDefaultSettings(configName) {
  if (configName in slotSpecificRecommendationSettingDefaults) {
    return deepmerge(defaultAlgorithmSettings, slotSpecificRecommendationSettingDefaults[configName]);
  } else {
    return defaultAlgorithmSettings;
  }
}

export function getRecommendationSettings({settings, currentUser, configName})
{
  if (settings)
   return settings;

  if (currentUser && currentUser.recommendationSettings && configName in currentUser.recommendationSettings) {
    return deepmerge(this.getDefaultSettings(), currentUser.recommendationSettings[configName]||{});
  } else {
    return getDefaultSettings(configName);
  }
}

const RecommendationsAlgorithmPicker = ({ currentUser, settings, onChange }) => {
  function applyChange(newSetings) {
    if (currentUser) {
      const mergedSettings = {
        ...currentUser.recommendationSettings,
        [configName]: newSettings
      };
    
      updateUser({
        selector: { _id: currentUser._id },
        data: {
          recommendationSettings: mergedSettings
        },
      });
    }
    onChange(newSettings);
  }
  return <div>
    <div>{"Algorithm "}
      <select
        onChange={(ev) => onChange({ ...settings, method: ev.target.value })}
        value={settings.method}
      >
        {recommendationAlgorithms.map(method =>
          <option value={method.name} key={method.name}>
            {method.description}
          </option>
        )}
      </select>
    </div>
    <div>{"Count "}
      <Input type="number"
        value={settings.count}
        onChange={(ev) => onChange({ ...settings, count: ev.target.value })}
      />
    </div>
    <div>
      {"Weight: (score - "}
      <Input type="number"
        value={settings.scoreOffset}
        onChange={(ev) => onChange({ ...settings, scoreOffset: ev.target.value })}
      />
      {") ^ "}
      <Input type="number"
        value={settings.scoreExponent}
        onChange={(ev) => onChange({ ...settings, scoreExponent: ev.target.value })}
      />
    </div>
    <div>
      {"Personal blogpost modifier "}
      <Input type="number"
        value={settings.personalBlogpostModifier}
        onChange={(ev) => onChange({ ...settings, personalBlogpostModifier: ev.target.value })}
      />
    </div>
    <div>
      {"Frontpage modifier "}
      <Input type="number"
        value={settings.frontpageModifier}
        onChange={(ev) => onChange({ ...settings, frontpageModifier: ev.target.value })}
      />
    </div>
    <div>
      {"Curated modifier "}
      <Input type="number"
        value={settings.curatedModifier}
        onChange={(ev) => onChange({ ...settings, curatedModifier: ev.target.value })}
      />
    </div>
    <div>
      <Checkbox
        checked={settings.onlyUnread}
        onChange={(ev, checked) => onChange({ ...settings, onlyUnread: checked })}
      /> Only unread
    </div>
  </div>;
}

registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPicker);