import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.unit*3,
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  title: {
    cursor: "pointer",
    margin:0,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontStyle: "italic",
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
  },
  leftDivider: {
    borderTop: "solid 2px rgba(0,0,0,.5)",
    width: theme.spacing.unit*4
  },
  rightDivider: {
    flexGrow:1,
    borderTop: "solid 2px rgba(0,0,0,.5)"
  },
  tailDivider: {
    borderTop: "solid 2px rgba(0,0,0,.5)",
    width: theme.spacing.unit*4
  }
})
class SectionTitle extends PureComponent {
  render() {
    const {children, classes, className, title} = this.props 
    return (
      <div className={classes.root}>
        <div className={classes.leftDivider}/>
        <Typography variant='display1' className={classNames(classes.title, className)}>
          {title}
        </Typography>
        <div className={classes.rightDivider}/>
        { children }
        { children && <div className={classes.tailDivider}/>}
      </div>
    )
  }
}
registerComponent( 'SectionTitle', SectionTitle, withStyles(styles, {name: 'SectionTitle'}))
