import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = createStyles((theme) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    '& svg': {
      marginRight: theme.spacing.unit
    },
  }
}))

const SectionButton = ({children, classes, className}: {
  children?: any,
  classes: any,
  className?: string,
}) => {
  return <Typography component='span' variant='body2' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

const SectionButtonComponent = registerComponent('SectionButton', SectionButton, withStyles(styles, {name: 'SectionButton'}))

declare global {
  interface ComponentTypes {
    SectionButton: typeof SectionButtonComponent
  }
}
