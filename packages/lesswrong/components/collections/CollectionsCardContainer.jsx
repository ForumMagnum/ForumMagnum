import { registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginTop: -30,
    display:"flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: '10px 3px',
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      alignItems: "center",
      padding: 0,
      marginTop: 0,
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
