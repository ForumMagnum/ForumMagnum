import { registerComponent } from 'meteor/vulcan:core';
import IconButton from '@material-ui/core/IconButton'
import NavigateBefore from '@material-ui/icons/NavigateBefore'
import NavigateNext from '@material-ui/icons/NavigateNext'
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

import { styles } from './SequencesNavigationLink'

const SequencesNavigationLinkDisabled = ({
  direction,
  classes}
) => {
  return (
    <IconButton
      classes={{
        root: classnames(classes.root, classes.disabled)
      }}
      disabled={true}
    >
      { direction === "left" ? <NavigateBefore/> : <NavigateNext/> }
    </IconButton>
  )
};

registerComponent('SequencesNavigationLinkDisabled', SequencesNavigationLinkDisabled,
  withStyles(styles, {name: "SequencesNavigationLinkDisabled"}));

