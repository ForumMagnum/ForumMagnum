import { registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
  root: {
    display:"flex",
    flexWrap: "wrap",
    marginTop: -5,
    marginRight: "auto",
    marginLeft: "auto",
    width: 695,
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      alignItems: "center",
      padding: 0,
      marginTop: 0,
      width: "unset"
    }
  }
}))

const CollectionsCardContainer = ({ classes, children }) => {
  return <div className={classes.root}>
      { children }
  </div>
}

const CollectionsCardContainerComponent = registerComponent(
  "CollectionsCardContainer", CollectionsCardContainer, withStyles(styles, { name: "CollectionsCardContainer" }));

declare global {
  interface ComponentTypes {
    CollectionsCardContainer: typeof CollectionsCardContainer
  }
}
