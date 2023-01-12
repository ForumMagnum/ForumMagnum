import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import SwapVert from '@material-ui/icons/SwapVert';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    width: 20,
    height: 20,
  },
  iconWithLabelGroup: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  iconWithLabel: {
    marginRight: theme.spacing.unit,
  },
  label: {
    ...theme.typography.body2,
    fontSize: 14,
    color: theme.palette.grey[600],
  }
})

const SettingsButton = ({classes, className, onClick, showIcon=true, label=""}: {
  classes: ClassesType,
  className?: string,
  onClick?: any,
  label?: string,
  showIcon?: boolean
}) => {
  if (label) {
    return <span className={classes.iconWithLabelGroup} onClick={onClick}>
      {showIcon && <SwapVert className={classNames(classes.icon, classes.iconWithLabel, className)}/>}
      <span className={classes.label}>{ label }</span>
    </span>
  }
  return <SwapVert className={classNames(classes.icon, className)} onClick={onClick}/>
}

const SettingsButtonComponent = registerComponent('SettingsButton', SettingsButton, {styles});

declare global {
  interface ComponentTypes {
    SettingsButton: typeof SettingsButtonComponent
  }
}
