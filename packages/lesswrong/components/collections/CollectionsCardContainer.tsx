import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { ReactNode } from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    display:"flex",
    flexWrap: "wrap",
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      alignItems: "center",
      padding: 0,
      marginTop: 0,
      width: "unset"
    }
  }
})

const CollectionsCardContainer = ({ classes, children }: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
}) => {
  return <div className={classes.root}>
      { children }
  </div>
}

export default registerComponent(
  "CollectionsCardContainer", CollectionsCardContainer, { styles });


