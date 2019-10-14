import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withDialog from '../common/withDialog';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
  },
});

const LoginPopupButton = ({classes, currentUser, openDialog, children, title}) => {
  // This component is intended only for buttons whose sole purpose is logging a user in 
  // (not wrapped around other buttons with other functionality. For that, just add
  // openDialog + "LoginPopup" to their functionality

  if (currentUser) return null

  return (
    <Tooltip title={title}>
      <a className={classes.root} onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {}
            });
            ev.preventDefault();
          }
        }}
      >
        { children }
      </a>
    </Tooltip>
  )
}

registerComponent('LoginPopupButton', LoginPopupButton, withDialog,
  withUser, withStyles(styles, {name: "LoginPopupButton"}));
