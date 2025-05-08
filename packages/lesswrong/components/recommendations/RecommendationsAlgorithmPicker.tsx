import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import deepmerge from 'deepmerge';
import { useCurrentUser } from '../common/withUser';
import { defaultAlgorithmSettings, DefaultRecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { isEAForum } from '../../lib/instanceSettings';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';
import { isFriendlyUI } from '../../themes/forumTheme';

export const archiveRecommendationsName = isEAForum ? 'Forum Favorites' : 'Archive Recommendations'

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap"
  },
  settingGroup: {
    border: theme.palette.border.slightlyFaint,
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
] as const;

export function getRecommendationSettings({settings, currentUser, configName}: {
  settings: Partial<DefaultRecommendationsAlgorithm>|null,
  currentUser: UsersCurrent|null,
  configName: string,
}): DefaultRecommendationsAlgorithm {
  if (isEAForum) return defaultAlgorithmSettings

  if (settings) {
    return {
      ...defaultAlgorithmSettings,
      ...settings,
    }
  }

  if (currentUser?.recommendationSettings && configName in currentUser.recommendationSettings) {
    return deepmerge(defaultAlgorithmSettings, currentUser.recommendationSettings[configName as keyof UsersCurrent['recommendationSettings']]||{});
  } else {
    return defaultAlgorithmSettings;
  }
}

// TODO: Probably to be removed when Community becomes a tag
const forumIncludeExtra: ForumOptions<{humanName: string, machineName: 'includePersonal' | 'includeMeta'}> = {
  LessWrong: {humanName: 'Personal Blogposts', machineName: 'includePersonal'},
  AlignmentForum: {humanName: 'Personal Blogposts', machineName: 'includePersonal'},
  EAForum: {humanName: 'Community', machineName: 'includeMeta'},
  default: {humanName: 'Personal Blogposts', machineName: 'includePersonal'},
}
const includeExtra = forumSelect(forumIncludeExtra)

const RecommendationsAlgorithmPickerInner = ({ settings, configName, onChange, showAdvanced=false, classes }: {
  settings: DefaultRecommendationsAlgorithm,
  configName: string,
  onChange: (newSettings: DefaultRecommendationsAlgorithm) => void,
  showAdvanced?: boolean,
  classes: ClassesType<typeof styles>
}) => {
  const { SectionFooterCheckbox } = Components
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  function applyChange(newSettings: DefaultRecommendationsAlgorithm) {
    if (currentUser) {
      const mergedSettings = {
        ...currentUser.recommendationSettings,
        [configName]: newSettings
      };

      void updateCurrentUser({
        recommendationSettings: mergedSettings
      });
    }
    onChange(newSettings);
  }
  return <div className={classes.root}>
    {(configName === "frontpage") && <span className={classes.settingGroup}>
      <span className={classes.setting}>
        <SectionFooterCheckbox
          value={!settings.hideContinueReading}
          onClick={(ev: React.MouseEvent) => applyChange({ ...settings, hideContinueReading: !settings.hideContinueReading })}
          label="Continue Reading"
          tooltip="If you start reading a sequence, the next unread post will appear in Recommendations"
        />
      </span>
      <span className={classes.setting}>
        <SectionFooterCheckbox
          value={!settings.hideBookmarks}
          onClick={(ev: React.MouseEvent) => applyChange({ ...settings, hideBookmarks: !settings.hideBookmarks })}
          label={isFriendlyUI ? "Saved posts" : "Bookmarks"}
          tooltip={`Posts that you have ${isFriendlyUI ? "saved" : "bookmarked"} will appear in Recommendations.`}
        />
      </span>
    </span>}

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
      {configName === "frontpage" &&
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
          value={!!settings.onlyUnread && !!currentUser}
          onClick={(ev: React.MouseEvent) => applyChange({ ...settings, onlyUnread: !settings.onlyUnread })}
          label={`Unread ${!currentUser ? "(Requires login)" : ""}`}
          tooltip={`'${archiveRecommendationsName}' will only show unread posts`}
        />
      </span>

      {/* Include personal blogposts (LW) or meta (EA Forum) */}
      <span className={classes.setting}>
        <SectionFooterCheckbox
          disabled={!currentUser}
          value={settings[includeExtra.machineName] ?? false}
          onClick={(ev: React.MouseEvent) => applyChange({ ...settings, [includeExtra.machineName]: !settings[includeExtra.machineName] })}
          label={includeExtra.humanName}
          tooltip={`'${archiveRecommendationsName}' will include ${includeExtra.humanName}`}
        />
      </span>
    </span>
    {showAdvanced && <div>
      <div>{"Algorithm "}
        <select
          onChange={(ev) => applyChange({ ...settings, method: ev.target.value as DefaultRecommendationsAlgorithm['method'] })}
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
          onChange={(ev) => applyChange({ ...settings, count: ev.target.value as unknown as number })}
        />
      </div>
      <div>
        {"Weight: (score - "}
        <Input type="number"
          value={settings.scoreOffset}
          onChange={(ev) => applyChange({ ...settings, scoreOffset: ev.target.value as unknown as number })}
        />
        {") ^ "}
        <Input type="number"
          value={settings.scoreExponent}
          onChange={(ev) => applyChange({ ...settings, scoreExponent: ev.target.value as unknown as number })}
        />
      </div>
      <div>
        {"Personal blogpost modifier "}
        <Input type="number"
          value={settings.personalBlogpostModifier}
          onChange={(ev) => applyChange({ ...settings, personalBlogpostModifier: ev.target.value as unknown as number })}
        />
      </div>
      <div>
        {"Frontpage modifier "}
        <Input type="number"
          value={settings.frontpageModifier}
          onChange={(ev) => applyChange({ ...settings, frontpageModifier: ev.target.value as unknown as number })}
        />
      </div>
      <div>
        {"Curated modifier "}
        <Input type="number"
          value={settings.curatedModifier}
          onChange={(ev) => applyChange({ ...settings, curatedModifier: ev.target.value as unknown as number })}
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

export const RecommendationsAlgorithmPicker = registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPickerInner, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsAlgorithmPicker: typeof RecommendationsAlgorithmPicker
  }
}
