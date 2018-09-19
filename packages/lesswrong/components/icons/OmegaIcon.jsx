import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = (theme) => ({
  root: {
    fontSize: 24,
    fontWeight: 600,
    fontFamily: ['Palatino',
      '"Palatino Linotype"',
      '"Palatino LT STD"',
      '"Book Antiqua"',
      'Georgia',
      'serif'].join(','),
    position:"relative",
    top:2
  }
})

const OmegaIcon = ({classes, className}) => {
  return <span className={classNames(classes.root, className)}>Ω</span>

}

registerComponent( 'OmegaIcon', OmegaIcon, withStyles(styles, {name: 'OmegaIcon'}))
