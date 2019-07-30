import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Settings from '@material-ui/icons/Settings';

const styles = (theme) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.grey[400],
  }
})

const SettingsIcon = ({classes, className, onClick}) => {
  return <Settings className={classNames(classes.root, className)} onClick={onClick}/>
}

registerComponent( 'SettingsIcon', SettingsIcon, withStyles(styles, {name: 'SettingsIcon'}))
