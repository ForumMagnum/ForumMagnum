import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { ReactNode } from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("CollectionsCardContainer", (theme: ThemeType) => ({
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
}))

const CollectionsCardContainer = ({children}: {
  children: ReactNode,
}) => {
  const classes = useStyles(styles);

  return <div className={classes.root}>
      { children }
  </div>
}

export default CollectionsCardContainer;


