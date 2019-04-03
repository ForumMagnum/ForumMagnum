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
    margin:0,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontStyle: "italic"
  },
  leftDivider: {
    borderTop: "solid 2px rgba(0,0,0,.5)",
    width: theme.spacing.unit*4,
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing.unit*2,
    },
  },
  rightDivider: {
    flexGrow:1,
    marginLeft: theme.spacing.unit*1.5,
    marginRight: theme.spacing.unit*1.5,
    borderTop: "solid 2px rgba(0,0,0,.5)"
  },
  tailDivider: {
    marginLeft: theme.spacing.unit*1.5,
    marginRight: theme.spacing.unit*1.5,
    borderTop: "solid 2px rgba(0,0,0,.5)",
    width: theme.spacing.unit*4,
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing.unit*2,
      marginRight: 0
    },
  },
})
class SectionTitle extends PureComponent {
  render() {
    const {children, classes, className, title, dividers=true} = this.props 
    return (
      <div className={classes.root}>
        { dividers && <div className={classes.leftDivider}/>}
        <Typography variant='display1' className={classNames(classes.title, className)}>
          {title}
        </Typography>
        { dividers && <div className={classes.rightDivider}/>}
        { children }
        { children && dividers && <div className={classes.tailDivider}/>}
      </div>
    )
  }
}
registerComponent( 'SectionTitle', SectionTitle, withStyles(styles, {name: 'SectionTitle'}))
