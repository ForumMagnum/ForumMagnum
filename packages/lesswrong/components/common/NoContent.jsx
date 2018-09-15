import React from 'react';
import { Components } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import defineComponent from '../../lib/defineComponent';

const styles = (theme) => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
})

const NoContent = ({children, classes}) => {
  return <Typography variant='body2' className={classes.root}>
    {children}
  </Typography>
}

export default defineComponent({
  name: 'NoContent',
  component: NoContent,
  styles: styles,
});
