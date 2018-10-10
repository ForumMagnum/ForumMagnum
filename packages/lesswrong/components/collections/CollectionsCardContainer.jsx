import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginTop: -20,
    display:"flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      alignItems: "center",
      padding: 0,
    }
  }
})

class CollectionsCardContainer extends PureComponent {

  render() {
    const { classes, children } = this.props
    return <div className={classes.root}>
        { children }
    </div>
  }
}

registerComponent("CollectionsCardContainer", CollectionsCardContainer, withStyles(styles, { name: "CollectionsCardContainer" }));
