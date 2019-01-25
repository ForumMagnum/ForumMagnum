import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit/2,
    paddingRight: theme.spacing.unit*2,
    marginTop: theme.spacing.unit*3,
    borderTop: "solid 2px rgba(0,0,0,.5)",
    marginBottom: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  title: {
    cursor: "pointer",
    margin:0,
    fontFamily: theme.typography.postStyle.fontFamily,
    flexGrow: 1,
  }
})

const SectionTitle = ({children, classes, className, title}) => {
  return <div className={classes.root}>
    <Typography variant='display1' className={classNames(classes.title, className)}>
      {title}
    </Typography>
    { children }
  </div>
}

registerComponent( 'SectionTitle', SectionTitle, withStyles(styles, {name: 'SectionTitle'}))
