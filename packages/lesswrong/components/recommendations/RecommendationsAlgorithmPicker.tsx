import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
import deepmerge from 'deepmerge';
import { useCurrentUser } from '../common/withUser';
import { slotSpecificRecommendationSettingDefaults, defaultAlgorithmSettings } from '../../lib/collections/users/recommendationSettings';
import Users from '../../lib/collections/users/collection';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap"
  },
  settingGroup: {
    border:"solid 1px rgba(0,0,0,.15)",
    borderRadius: 3,
    padding: 8,
    marginBottom: 10
  },
  setting: {
    marginLeft: 20,
    marginRight: 20
  }
})

// Elements here should match switch cases in recommendations.ts
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

function getDefaultSettings(configName: string) {
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

  if (currentUser?.recommendationSettings && configName in currentUser.recommendationSettings) {
    return deepmerge(getDefaultSettings(configName), currentUser.recommendationSettings[configName]||{});
  } else {
    return getDefaultSettings(configName);
  }
}

const forumIncludeExtra = {
  LessWrong: {humanName: 'Personal Blogposts', machineName: 'includePersonal'},
  AlignmentForum: {humanName: 'Personal Blogposts', machineName: 'includePersonal'},
  EAForum: {humanName: 'Community', machineName: 'includeMeta'},
}

const includeExtra = forumIncludeExtra[forumTypeSetting.get()]

const RecommendationsAlgorithmPicker = ({ settings, configName, onChange, showAdvanced=false, classes }: {
  settings: any,
  configName: string,
  onChange: any,
  showAdvanced?: boolean,
  classes: ClassesType
}) => {
  const { SectionFooterCheckbox } = Components
  const currentUser = useCurrentUser();
  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: "UsersCurrent",
  });
  function applyChange(newSettings) {
    if (currentUser) {
      const mergedSettings = {
        ...currentUser.recommendationSettings,
        [configName]: newSettings
      };
    
      void updateUser({
        selector: { _id: currentUser._id },
        data: {
          recommendationSettings: mergedSettings
        },
      });
    }
    onChange(newSettings);
  }
  return <div className={classes.root}>
    <span className={classes.settingGroup}>
      <span className={classes.setting}>
        {(configName === "frontpage") &&
          <SectionFooterCheckbox
            value={!settings.hideContinueReading}
            onClick={(ev: React.MouseEvent) => applyChange({ ...settings, hideContinueReading: !settings.hideContinueReading })}
            label="Continue Reading"
            tooltip="If you start reading a sequence, the next unread post will appear in Recommendations"
          />
        }
      </span>
      <span className={classes.setting}>
        {(configName === "frontpage") && 
          <SectionFooterCheckbox
            value={!settings.hideBookmarks}
            onClick={(ev: React.MouseEvent) => applyChange({ ...settings, hideBookmarks: !settings.hideBookmarks })}
            label="Bookmarks"
            tooltip="Posts that you have bookmarked will appear in Recommendations."
          />
        }
      </span>
    </span>

    {/* disabled except during review */}
    {/* {(configName === "frontpage") && <div> 
      <Checkbox
        checked={!settings.hideReview}
        onChange={(ev, checked) => applyChange({ ...settings, hideReview: !checked })}
      /> Show 'The LessWrong 2018 Review'
    </div>} */}

    {/* <div> 
      <Checkbox
        checked={!settings.hideCoronavirus}
        onChange={(ev, checked) => applyChange({ ...settings, hideCoronavirus: !checked })}
      /> Show 'Coronavirus' recommendations
    </div> */}

    {/* disabled during 2018 Review [and coronavirus]*/}
    <span className={classes.settingGroup}>
      {(configName === "frontpage") && 
        <span className={classes.setting}>
          <SectionFooterCheckbox
            value={!settings.hideFrontpage}
            onClick={(ev: React.MouseEvent) => applyChange({ ...settings, hideFrontpage: !settings.hideFrontpage })}
            label="Archives"
            tooltip="Show randomized posts from the archives"
          />
        </span>
      }
    
      <span className={classes.setting}>
        <SectionFooterCheckbox
          disabled={!currentUser}
          value={settings.onlyUnread && !!currentUser}
          onClick={(ev: React.MouseEvent) => applyChange({ ...settings, onlyUnread: !settings.onlyUnread })}
          label={`Unread ${!currentUser ? "(Requires login)" : ""}`}
          tooltip="'Archive Recommendations' will only show unread posts"
        />
      </span>

      {/* Include personal blogposts (LW) or meta (EA Forum) */}
      <span className={classes.setting}>
        <SectionFooterCheckbox
          disabled={!currentUser}
          value={settings[includeExtra.machineName]}
          onClick={(ev: React.MouseEvent) => applyChange({ ...settings, [includeExtra.machineName]: !settings[includeExtra.machineName] })}
          label={includeExtra.humanName}
          tooltip={`'Archive Recommendations' will include ${includeExtra.humanName}`}
        />
      </span>
    </span>
    {/* ea-forum look here */}
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

const RecommendationsAlgorithmPickerComponent = registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPicker, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsAlgorithmPicker: typeof RecommendationsAlgorithmPickerComponent
  }
}

