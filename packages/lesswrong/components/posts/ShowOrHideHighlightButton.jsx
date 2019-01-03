import React from 'react';
import { Components, registerComponent, } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';

const styles = theme => ({
  button: {
    color: "rgba(0,0,0,.5) !important",
    fontSize: "12px !important",
    left: 4,
    transition: "all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
  },
  hideButton: {
    position: "relative",
    top: 2,
    transform: "rotate(90deg)",
  },
  showButton: {
    position: "relative",
    top: 4,
    transform: "rotate(-90deg)",
  },
});

const ShowOrHideHighlightButton = ({open, className, classes}) =>
  <span className={className}>
    { open
      ? <Components.MetaInfo>
          Hide Highlight
          <Icon className={classNames(classes.button, classes.hideButton)}>
            subdirectory_arrow_left
          </Icon>
        </Components.MetaInfo>
      : <Components.MetaInfo>
          Show Highlight
          <Icon className={classNames(classes.button, classes.showButton)}>
            subdirectory_arrow_left
          </Icon>
        </Components.MetaInfo>
    }
  </span>

registerComponent("ShowOrHideHighlightButton", ShowOrHideHighlightButton,
  withStyles(styles, {name: "ShowOrHideHighlightButton"}));
