import React from 'react';
import { registerComponent, withUpdate } from 'meteor/vulcan:core';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
import deepmerge from 'deepmerge';
import withUser from '../common/withUser';
import { slotSpecificRecommendationSettingDefaults, defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings.js';
import Users from 'meteor/vulcan:users';

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
    return deepmerge(getDefaultSettings(), currentUser.recommendationSettings[configName]||{});
  } else {
    return getDefaultSettings(configName);
  }
}

const RecommendationsAlgorithmPicker = ({ currentUser, settings, configName, updateUser, onChange, showAdvanced }) => {
  function applyChange(newSettings) {
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
    {(configName === "frontpage") && <div> 
      <Checkbox
        checked={settings.hideFrontpage}
        onChange={(ev, checked) => applyChange({ ...settings, hideFrontpage: checked })}
      /> Hide frontpage recommendations
    </div>}
    <div>
      <Checkbox
        checked={settings.onlyUnread}
        onChange={(ev, checked) => applyChange({ ...settings, onlyUnread: checked })}
      /> Only show unread posts
    </div>
    {showAdvanced && <div>
      <div>{"Algorithm "}
        <select
          onChange={(ev) => applyChange({ ...settings, method: ev.target.value })}
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
          onChange={(ev) => applyChange({ ...settings, count: ev.target.value })}
        />
      </div>
      <div>
        {"Weight: (score - "}
        <Input type="number"
          value={settings.scoreOffset}
          onChange={(ev) => applyChange({ ...settings, scoreOffset: ev.target.value })}
        />
        {") ^ "}
        <Input type="number"
          value={settings.scoreExponent}
          onChange={(ev) => applyChange({ ...settings, scoreExponent: ev.target.value })}
        />
      </div>
      <div>
        {"Personal blogpost modifier "}
        <Input type="number"
          value={settings.personalBlogpostModifier}
          onChange={(ev) => applyChange({ ...settings, personalBlogpostModifier: ev.target.value })}
        />
      </div>
      <div>
        {"Frontpage modifier "}
        <Input type="number"
          value={settings.frontpageModifier}
          onChange={(ev) => applyChange({ ...settings, frontpageModifier: ev.target.value })}
        />
      </div>
      <div>
        {"Curated modifier "}
        <Input type="number"
          value={settings.curatedModifier}
          onChange={(ev) => applyChange({ ...settings, curatedModifier: ev.target.value })}
        />
      </div>
      <div>
        <Checkbox
          checked={settings.onlyUnread}
          onChange={(ev, checked) => applyChange({ ...settings, onlyUnread: checked })}
        /> Only unread
      </div>
    </div>}
  </div>;
}

registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPicker,
  withUser,
  [withUpdate, {
    collection: Users,
    fragmentName: "UsersCurrent",
  }]
);
