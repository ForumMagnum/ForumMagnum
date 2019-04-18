import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    color: theme.palette.lwTertiary.main,
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
  checkbox: {
    color: theme.palette.lwTertiary.main,
    padding: "1px 8px 0 0",
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
})

class SectionFooterCheckbox extends Component {
  constructor(props, context) {
    super(props,context);
  }

  render() {
    const { classes, label, disabled=false, onClick, value } = this.props
    return <span className={classes.root} onClick={onClick}>
      <Checkbox disabled={disabled} disableRipple classes={{root: classes.checkbox, checked: classes.checked}} checked={value} />
      { label }
    </span>
  }
}

SectionFooterCheckbox.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentCheckbox from vulcan-ui-bootstrap
registerComponent("SectionFooterCheckbox", SectionFooterCheckbox, withStyles(styles, { name: "SectionFooterCheckbox" }));
