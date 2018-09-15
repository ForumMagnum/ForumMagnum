import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  root: {
    borderTop: "solid 1px rgba(0,0,0,.1)",
    paddingTop: theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    '&:hover': {
      background: "rgb(250,250,250)",
    }
  }
})

const SunshineListItem = ({children, classes}) => {
  return <div className={classes.root}>
        { children }
      </div>
};

export default defineComponent({
  name: 'SunshineListItem',
  component: SunshineListItem,
  styles: styles,
});
