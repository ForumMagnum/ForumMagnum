import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    '& svg': {
      marginRight: theme.spacing.unit
    },
  }
})

const SectionButton = ({children, classes, className}) => {
  return <Typography component='span' variant='body1' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

registerComponent( 'SectionButton', SectionButton, withStyles(styles, {name: 'SectionButton'}))
