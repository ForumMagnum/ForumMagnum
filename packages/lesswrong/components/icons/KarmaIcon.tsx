import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { withStyles, createStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = createStyles(theme => ({
  root: {
    position: "relative",
    width: "1em",
    height: "1em",
    display: "inline-block"
  },
  bigArrow: {
    position: "absolute",
    top: "-.285em",
    left: "-.255em",
    fontSize: "2em",
    color: "inherit"
  },
  smallArrow: {
    position: "absolute",
    top: "-.04em",
    left: "-.186em",
    color: "inherit",
    fontSize: "1.52em"
  }
}))

// this is currently unused, but will hopefully be used someday after we reflect on it a bit more.
const KarmaIcon = ({classes, className}) => {
  return <span className={classNames(classes.root, className)}>
      <KeyboardArrowUpIcon className={classes.bigArrow}/>
      <KeyboardArrowUpIcon className={classes.smallArrow}/>
    </span>
}

const KarmaIconComponent = registerComponent('KarmaIcon', KarmaIcon, withStyles(styles, {name:"KarmaIcon"}))

declare global {
  interface ComponentTypes {
    KarmaIcon: typeof KarmaIconComponent
  }
}