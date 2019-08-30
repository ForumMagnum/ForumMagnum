import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'
import PropTypes from 'prop-types';

const styles = (theme) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: ".85rem",
    lineHeight: "1.5em"
  }
})

const SidebarInfo = ({children, classes, className}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body1'>
      {children}
  </Typography>
}

SidebarInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
};

registerComponent( 'SidebarInfo', SidebarInfo, withStyles(styles, {name: 'SidebarInfo'}))
