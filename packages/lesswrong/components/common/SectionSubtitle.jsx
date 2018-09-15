import React from 'react';
import { Components } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'
import defineComponent from '../../lib/defineComponent';

const styles = (theme) => ({
  root: {
    fontStyle: 'italic',
    cursor: "pointer",
    color: theme.palette.grey[600],
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[500],
    }
  }
})

const SectionSubtitle = ({children, classes, className}) => {
  return <Typography component='span' variant='subheading' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

export default defineComponent({
  name: 'SectionSubtitle',
  component: SectionSubtitle,
  styles: styles,
});
