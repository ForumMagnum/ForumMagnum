import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = createStyles((theme) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: ".9rem",
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4
  }
}))

const SectionSubtitle = ({children, classes, className}: {
  children?: any,
  classes: any,
  className?: string,
}) => {
  return <Typography component='span' variant='subheading' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

const SectionSubtitleComponent = registerComponent('SectionSubtitle', SectionSubtitle, withStyles(styles, {name: 'SectionSubtitle'}))

declare global {
  interface ComponentTypes {
    SectionSubtitle: typeof SectionSubtitleComponent
  }
}
