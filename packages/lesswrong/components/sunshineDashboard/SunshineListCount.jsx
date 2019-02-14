import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  overflow: {
    color: "red"
  }
})

class SunshineListCount extends Component {
  render () {
    const { count, classes } = this.props
    const { MetaInfo } = Components
    if (count > 10) {
      return <MetaInfo className={(count > 20) && classes.overflow}>({count})</MetaInfo>
    } else {
      return null
    }
  }
}

registerComponent(
  'SunshineListCount',
  SunshineListCount,
  withStyles(styles, {name: "SunshineListCount"})
);
