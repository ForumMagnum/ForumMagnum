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
  },
  title: {
    margin:0,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontStyle: "italic"
  },
  noTitle: {
    marginLeft: 0,
  },
  children: {
    ...theme.typography.commentStyle,
    marginLeft: 'auto'
    // Exists for eaTheme override
  },
})
class SectionTitle extends PureComponent {
  render() {
    const {children, classes, className, title, dividers=true} = this.props
    return (
      <div className={classes.root}>
        <Typography variant='display1' className={classNames(classes.title, className)}>
          {title}
        </Typography>
        <div className={classes.children}>{ children }</div>
        { children && dividers && <div className={classes.tailDivider}/>}
      </div>
    )
  }
}
registerComponent( 'SectionTitle', SectionTitle, withStyles(styles, {name: 'SectionTitle'}))
