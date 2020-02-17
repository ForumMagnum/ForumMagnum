import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const styles = theme => ({
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
})

const CollectionsCardContainer = ({ classes, children }) => {
  return <div className={classes.root}>
      { children }
  </div>
}

const CollectionsCardContainerComponent = registerComponent(
  "CollectionsCardContainer", CollectionsCardContainer, { styles });

declare global {
  interface ComponentTypes {
    CollectionsCardContainer: typeof CollectionsCardContainerComponent
  }
}
