import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { QueryLink } from '../../lib/reactRouterWrapper'
import classNames from 'classnames'
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { isFriendlyUI } from '../../themes/forumTheme';
import { TooltipSpan } from './FMTooltip';
import MetaInfo from "./MetaInfo";

const styles = (theme: ThemeType) => ({
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
      fontStyle: isFriendlyUI ? undefined : "italic",
      fontWeight: isFriendlyUI ? undefined : 600,
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
  options: Partial<Record<string, SettingsOption | string>>;
  currentOption: string;
  classes: ClassesType<typeof styles>;
  setSetting: (type: string, newSetting: any) => void;
  nofollow?: boolean;
}

const SettingsColumn = ({type, title, options, currentOption, classes, setSetting, nofollow}: Props) => {
  return <div className={classes.selectionList}>
    <MetaInfo className={classes.selectionTitle}>
      {title}
    </MetaInfo>
    {Object.entries(options).map(([name, optionValue]) => {
      const label = typeof optionValue === 'string' ? optionValue : optionValue?.label
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
            {typeof optionValue === 'object' && optionValue.tooltip ?
              <TooltipSpan title={<div>{optionValue.tooltip}</div>} placement="left-start">
                {label}
              </TooltipSpan> :
              <span>{ label }</span>
            }
          </MetaInfo>
        </QueryLink>
      )
    })}
  </div>
}

export default registerComponent('SettingsColumn', SettingsColumn, {styles});


