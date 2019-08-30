import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    ...theme.typography.body1,
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
  checkbox: {
    color: theme.palette.lwTertiary.main,
    padding: "2px 8px 0 0",
    '& svg': {
      height: "1.3rem",
      width: "1.3rem",
      position: "relative",
      top: -2
    }
  },
  checked: {
    '&&': {
      color: theme.palette.lwTertiary.main,
    }
  },
  label: {
    color: theme.palette.lwTertiary.main
  },
  disabled: {
    cursor: "default",
    opacity: .5
  }
})

const SectionFooterCheckbox = ({ classes, label, onClick, value, disabled }) => {
  return <span className={classNames(classes.root, {[classes.disabled]: disabled })} onClick={!disabled && onClick}>
    <Checkbox disableRipple classes={{root: classes.checkbox, checked: classes.checked}} checked={value} />
    <span className={classes.label}>{ label }</span>
  </span>
}

registerComponent("SectionFooterCheckbox", SectionFooterCheckbox, withStyles(styles, { name: "SectionFooterCheckbox" }));
