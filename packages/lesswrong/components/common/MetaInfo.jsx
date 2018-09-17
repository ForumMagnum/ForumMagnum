import React from 'react';
import { Components } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'
import defineComponent from '../../lib/defineComponent';

const styles = (theme) => ({
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
})

const MetaInfo = ({children, classes, button, className}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, {[classes.button]: button}, className)}
    variant='body2'>
      {children}
  </Typography>
}

export default defineComponent({
  name: 'MetaInfo',
  component: MetaInfo,
  styles: styles,
})
