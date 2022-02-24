import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import classNames from 'classnames'
import Checkbox from '@material-ui/core/Checkbox';
import { QueryLink } from '../../lib/reactRouterWrapper'
import * as _ from 'underscore';
import Tooltip from '@material-ui/core/Tooltip';
import { useCurrentUser } from '../common/withUser';

import { sortings as defaultSortings } from './DraftsList'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: "white",
    padding: "12px 24px 8px 12px"
  },
  hidden: {
    display: "none", // Uses CSS to show/hide
    overflow: "hidden",
  },
  menuItem: {
    '&&': {
      // Increase specifity to remove import-order conflict with MetaInfo
      display: "block",
      cursor: "pointer",
      color: theme.palette.grey[500],
      marginLeft: theme.spacing.unit*1.5,
      whiteSpace: "nowrap",
      '&:hover': {
        color: theme.palette.grey[600],
      },
    },
  },
  selectionList: {
    marginRight: theme.spacing.unit*2,
    [theme.breakpoints.down('xs')]: {
      marginTop: theme.spacing.unit,
      flex: `1 0 calc(50% - ${theme.spacing.unit*4}px)`,
      order: 1
    }
  },
  selectionTitle: {
    '&&': {
      // Increase specifity to remove import-order conflict with MetaInfo
      display: "block",
      fontStyle: "italic",
      marginBottom: theme.spacing.unit/2
    },
  },
  selected: {
    // Increase specifity to remove import-order conflict with MetaInfo
    '&&': {
      color: theme.palette.grey[900],
      '&:hover': {
        color: theme.palette.grey[900],
      },
    }
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

const SettingsColumn = ({type, title, options, currentOption, classes, setSetting}) => {
  const { MetaInfo } = Components
  
  return <div className={classes.selectionList}>
    <MetaInfo className={classes.selectionTitle}>
      {title}
    </MetaInfo>
    {Object.entries(options).map(([name, optionValue]: any) => {
      const label = _.isString(optionValue) ? optionValue : optionValue.label
      return (
        <QueryLink
          key={name}
          onClick={() => setSetting(type, name)}
          // TODO: Can the query have an ordering that matches the column ordering?
          query={{ [type]: name }}
          merge
          rel="nofollow"
        >
          <MetaInfo className={classNames(classes.menuItem, {[classes.selected]: currentOption === name})}>
            {optionValue.tooltip ?
              <Tooltip title={<div>{optionValue.tooltip}</div>} placement="left-start">
                <span>{ label }</span>
              </Tooltip> :
              <span>{ label }</span>
            }
          </MetaInfo>
        </QueryLink>
      )
    })}
  </div>
}

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
  classes: ClassesType,
}) => {
  const { MetaInfo } = Components
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  
  const setSetting = (type, newSetting) => {
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
        classes={classes}
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
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentIncludeArchived}/>
      
            <MetaInfo className={classes.checkboxLabel}>
              Show Archived
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
            <Checkbox classes={{root: classes.checkbox, checked: classes.checkboxChecked}} checked={currentIncludeShared}/>
      
            <MetaInfo className={classes.checkboxLabel}>
              Show Shared with You
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
