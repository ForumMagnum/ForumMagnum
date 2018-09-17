import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import defineComponent from '../../lib/defineComponent';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    borderTop: "solid 1px rgba(0,0,0,.2)",
    padding: theme.spacing.unit*1.5,
    fontWeight: 600,
  }
})

const SunshineListTitle = ({children, classes}) => {
  return <Typography variant="body2" className={classes.root}>
        { children }
      </Typography>
};

SunshineListTitle.propTypes = {
  classes: PropTypes.object.isRequired
};

export default defineComponent({
  name: 'SunshineListTitle',
  component: SunshineListTitle,
  styles: styles,
});

