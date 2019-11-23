import React from 'react';
import { registerComponent, withUpdate, getSetting } from 'meteor/vulcan:core';
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
  }
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

const forumIncludeExtra = {
  LessWrong: {humanName: 'Include Personal Blogposts', machineName: 'includePersonal'},
  AlignmentForum: {humanName: 'Include Personal Blogposts', machineName: 'includePersonal'},
  EAForum: {humanName: 'Include Community', machineName: 'includeMeta'},
}

const includeExtra = forumIncludeExtra[getSetting('forumType', 'LessWrong')]

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
        checked={!settings.hideContinueReading}
        onChange={(ev, checked) => applyChange({ ...settings, hideContinueReading: !checked })}
      /> Show 'Continue Reading' (when you have partially finished sequences)
    </div>}
    {(configName === "frontpage") && <div> 
      <Checkbox
        checked={!settings.hideBookmarks}
        onChange={(ev, checked) => applyChange({ ...settings, hideBookmarks: !checked })}
      /> Show Bookmarks on home page
    </div>}
    
    {(configName === "frontpage") && <div> 
      <Checkbox
        checked={!settings.hideReview}
        onChange={(ev, checked) => applyChange({ ...settings, hideReview: !checked })}
      /> Show 'The LessWrong 2018 Review'
    </div>}

    {/* disabled during 2018 Review */}
    {/* {(configName === "frontpage") && <div> 
      <Checkbox
        checked={!settings.hideFrontpage}
        onChange={(ev, checked) => applyChange({ ...settings, hideFrontpage: !checked })}
      /> Show 'From the Archives' recommendations
    </div>} */}

    {/* <div>
      <Checkbox
        disabled={!currentUser}
        checked={settings.onlyUnread && currentUser}
        onChange={(ev, checked) => applyChange({ ...settings, onlyUnread: checked })}
      /> Only show unread posts {!currentUser && "(Requires login)"}
    </div> */}

    {/* Include personal blogposts (LW) or meta (EA Forum) */}
    <div>
      <Checkbox
        disabled={!currentUser}
        checked={settings[includeExtra.machineName]}
        onChange={(ev, checked) => applyChange({ ...settings, [includeExtra.machineName]: checked })}
      /> {includeExtra.humanName}
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
