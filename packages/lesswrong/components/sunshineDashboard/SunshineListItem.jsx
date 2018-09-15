import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    position:"relative",
    borderTop: "solid 1px rgba(0,0,0,.1)",
    paddingTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
  },
  hover: {
    backgroundColor: theme.palette.grey[50]
  }
})

const SunshineListItem = ({children, classes, hover}) => {
  return <div className={classNames(classes.root, {[classes.hover]:hover})}>
        { children }
      </div>
};

SunshineListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
};

SunshineListItem.displayName = "SunshineListItem";

registerComponent('SunshineListItem', SunshineListItem, withStyles(styles, { name: 'SunshineListItem'}));
