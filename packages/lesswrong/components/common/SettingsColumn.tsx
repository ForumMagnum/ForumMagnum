import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { QueryLink } from '../../lib/reactRouterWrapper'
import classNames from 'classnames'
import * as _ from 'underscore';
import Tooltip from '@material-ui/core/Tooltip';
import { SettingsOption } from '../../lib/collections/posts/sortOrderOptions';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
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
      fontStyle: isEAForum ? undefined : "italic",
      fontWeight: isEAForum ? undefined : 600,
      marginBottom: theme.spacing.unit/2
    },
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
  selected: {
    // Increase specifity to remove import-order conflict with MetaInfo
    '&&': {
      color: theme.palette.grey[900],
      '&:hover': {
        color: theme.palette.grey[900],
      },
    }
  },
});

interface Props {
  type: string;
  title: string;
  options: Partial<Record<string, SettingsOption>>;
  currentOption: string;
  classes: ClassesType;
  setSetting: (type: string, newSetting: any) => void;
  nofollow?: boolean;
}

const SettingsColumn = ({type, title, options, currentOption, classes, setSetting, nofollow}: Props) => {
  const { MetaInfo } = Components

  return <div className={classes.selectionList}>
    <MetaInfo className={classes.selectionTitle}>
      {title}
    </MetaInfo>
    {Object.entries(options).map(([name, optionValue]: any) => {
      const label = _.isString(optionValue) ? optionValue : optionValue.label
      const nofollowTag = nofollow ? { rel: 'nofollow' } : {};
      return (
        <QueryLink
          key={name}
          onClick={() => setSetting(type, name)}
          // TODO: Can the query have an ordering that matches the column ordering?
          query={{ [type]: name }}
          merge
          {...nofollowTag}
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

const SettingsColumnComponent = registerComponent('SettingsColumn', SettingsColumn, {styles});

declare global {
  interface ComponentTypes {
    SettingsColumn: typeof SettingsColumnComponent
  }
}
