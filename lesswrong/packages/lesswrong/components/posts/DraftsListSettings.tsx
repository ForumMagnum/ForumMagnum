import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import classNames from 'classnames'
import { QueryLink } from '../../lib/reactRouterWrapper'
import * as _ from 'underscore';
import { useCurrentUser } from '../common/withUser';

import { sortings as defaultSortings } from './DraftsList'
import { preferredHeadingCase } from '../../themes/forumTheme';
import MetaInfo from "@/components/common/MetaInfo";
import SettingsColumn from "@/components/common/SettingsColumn";
import { Checkbox, Tooltip } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: theme.palette.panelBackground.default,
    padding: "12px 24px 8px 12px"
  },
  hidden: {
    display: "none", // Uses CSS to show/hide
    overflow: "hidden",
  },
  checkbox: {
    padding: "1px 12px 0 0"
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
})

const USER_SETTING_NAMES = {
  sortDraftsBy: 'draftsListSorting',
  showArchived: 'draftsListShowArchived',
  showShared: 'draftsListShowShared'
}

const DraftsListSettings = ({
  persistentSettings, 
  hidden, 
  currentSorting, 
  currentIncludeArchived,
  currentIncludeShared,
  sortings=defaultSortings, 
  classes
}: {
  persistentSettings?: any,
  hidden: boolean,
  currentSorting: any,
  currentIncludeArchived: boolean,
  currentIncludeShared: boolean,
  sortings?: any,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  
  const setSetting = (type: keyof typeof USER_SETTING_NAMES, newSetting: any) => {
    if (currentUser && persistentSettings) {
      void updateCurrentUser({
        [USER_SETTING_NAMES[type]]: newSetting,
      })
    }
  }
  
  return (
    <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
      <SettingsColumn
        type={'sortDraftsBy'}
        title={'Sorted by:'}
        options={sortings}
        currentOption={currentSorting}
        setSetting={setSetting}
        nofollow
      />
      <div>
        
        <Tooltip title={<div><div>By default, archived posts are hidden.</div><div>Toggle to show them.</div></div>} placement="left-start">
          <QueryLink
            className={classes.checkboxGroup}
            onClick={() => setSetting('showArchived', !currentIncludeArchived)}
            query={{includeArchived: !currentIncludeArchived}}
            merge
            rel="nofollow"
          >
            <Checkbox classes={{root: classes.checkbox}} checked={currentIncludeArchived}/>
      
            <MetaInfo>
              {preferredHeadingCase("Show Archived")}
            </MetaInfo>
          </QueryLink>
        </Tooltip>
        <Tooltip title={<div><div>By default, posts shared with you are shown.</div><div>Toggle to hide them.</div></div>} placement="left-start">
          <QueryLink
            className={classes.checkboxGroup}
            onClick={() => setSetting('showShared', !currentIncludeShared)}
            query={{includeShared: !currentIncludeShared}}
            merge
            rel="nofollow"
          >
            <Checkbox classes={{root: classes.checkbox}} checked={currentIncludeShared}/>
      
            <MetaInfo>
              {preferredHeadingCase("Show Shared with You")}
            </MetaInfo>
          </QueryLink>
        </Tooltip>
      </div>
    </div>
  );
};

const DraftsListSettingsComponent = registerComponent(
  'DraftsListSettings', DraftsListSettings, { styles }
);

declare global {
  interface ComponentTypes {
    DraftsListSettings: typeof DraftsListSettingsComponent
  }
}

export default DraftsListSettingsComponent;
