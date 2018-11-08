import React from 'react';
import { Components, registerComponent, } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Icon from '@material-ui/core/Icon';

const styles = theme => ({
});

const ShowOrHideHighlightButton = ({open, className, classes}) =>
  <span className={className}>
    { open
      ? <Components.MetaInfo>
          Hide Highlight
          <Icon className={classNames("material-icons","hide-highlight-button")}>
            subdirectory_arrow_left
          </Icon>
        </Components.MetaInfo>
      : <Components.MetaInfo>
          Show Highlight
          <Icon className={classNames("material-icons","show-highlight-button")}>
            subdirectory_arrow_left
          </Icon>
        </Components.MetaInfo>
    }
  </span>

registerComponent("ShowOrHideHighlightButton", ShowOrHideHighlightButton,
  withStyles(styles, {name: "ShowOrHideHighlightButton"}));