import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  overflow: {
    color: "red"
  }
})

const SunshineListCount = ({ count, classes }) => {
  const { MetaInfo } = Components
  if (count > 10) {
    return <MetaInfo className={(count > 20) && classes.overflow}>({count})</MetaInfo>
  } else {
    return null
  }
}

const SunshineListCountComponent = registerComponent('SunshineListCount', SunshineListCount, {styles});

declare global {
  interface ComponentTypes {
    SunshineListCount: typeof SunshineListCountComponent
  }
}

