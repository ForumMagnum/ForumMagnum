import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  sectionTitleLink: {
    '& a': {
      fontStyle: 'italic',
      fontSize: 16,
      color: theme.palette.grey[500],
      '&:hover, &:active, &:focus': {
        color: theme.palette.grey[400],
      }
    }
  }
})

const SectionTitleLink = (props) => {
  const {children, classes} = props
  const newProps = _.omit(props, ['classes', 'children'])
  return <Typography component='span' variant='body1' className={classes.sectionTitleLink}>
    <Link {...newProps}>
      {children}
    </Link>
  </Typography>
}

registerComponent( 'SectionTitleLink', SectionTitleLink, withStyles(styles, {name: 'SectionTitleLink'}))
