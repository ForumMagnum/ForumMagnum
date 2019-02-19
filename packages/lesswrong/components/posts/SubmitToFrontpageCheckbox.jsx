import React, { Component } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  submitToFrontpageWrapper: {
    flexGrow: 3,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      order:1
    }
  },
  submitToFrontpage: {
    display: "flex",
    alignItems: "center",
    maxWidth: 300,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      maxWidth: "none",
      justifyContent: "flex-end",
      paddingRight: theme.spacing.unit*3,
    }
  },
  checkboxLabel: {
    fontWeight:500,
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 16,
    color: "rgba(0,0,0,0.4)",
  },
  tooltip: {
    '& ul': {
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: theme.spacing.unit/2,
      paddingLeft: theme.spacing.unit*3,
    },
    '& p': {
      marginTop: theme.spacing.unit/2,
      marginBottom: theme.spacing.unit/2
    }
  },
  guidelines: {
    fontStyle: "italic"
  },
});

class SubmitToFrontpageCheckbox extends Component {
  state = {
    value: false
  }
  render() {
    const { classes, updateCurrentValues } = this.props
    const { value } = this.state
    return <div className={classes.submitToFrontpageWrapper}>
    <Tooltip title={<div className={classes.tooltip}>
        <p>LW moderators will consider this post for frontpage</p>
        <p className={classes.guidelines}>Things to aim for:</p>
        <ul>
          <li className={classes.guidelines}>
            Usefulness, novelty and fun
          </li>
          <li className={classes.guidelines}>
            Timeless content (minimize reference to current events)
          </li>
          <li className={classes.guidelines}>
            Explain rather than persuade
          </li>
        </ul>
      </div>
      }>
      <div className={classes.submitToFrontpage}>
        <div>
          <Checkbox checked={value} onClick={() => updateCurrentValues({submitToFrontpage: !value})}/>
          <span className={classes.checkboxLabel}>Moderators may promote</span>
        </div>
      </div>
    </Tooltip>
  </div>
  }
} 


registerComponent('SubmitToFrontpageCheckbox', SubmitToFrontpageCheckbox,
  withStyles(styles, { name: "SubmitToFrontpageCheckbox" })
);