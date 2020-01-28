import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = createStyles((theme) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: "1rem"
  },
  button: {
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  }
}))

const MetaInfo = ({children, classes, button, className}: {
  children?: any,
  classes: any,
  button?: boolean,
  className?: string
  title?: string,
}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, {[classes.button]: button}, className)}
    variant='body2'>
      {children}
  </Typography>
}

const MetaInfoComponent = registerComponent('MetaInfo', MetaInfo, {styles});

declare global {
  interface ComponentTypes {
    MetaInfo: typeof MetaInfoComponent
  }
}
