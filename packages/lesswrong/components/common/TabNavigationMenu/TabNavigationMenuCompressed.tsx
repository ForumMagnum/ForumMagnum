import React from 'react';

// -- See here for all the tab content --
import getMenuTabs from './menuTabs'
import { forumSelect } from '../../../lib/forumTypeUtils';
import TabNavigationCompressedItem from "./TabNavigationCompressedItem";
import SimpleDivider from "../../widgets/SimpleDivider";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TabNavigationMenuCompressed", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width:55,
    backgroundColor: theme.palette.grey[100],
    borderRight: theme.palette.border.faint,
    height:"100%",
    color: theme.palette.grey[600],
  },
  divider: {
    marginTop:theme.spacing.unit,
    marginBottom:theme.spacing.unit
  }
}))

const TabNavigationMenuCompressed = ({onClickSection}: {
  onClickSection: (e?: React.BaseSyntheticEvent) => void,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      {forumSelect(getMenuTabs()).map(tab => {
        if (!('showOnCompressed' in tab) || !tab.showOnCompressed) {
          return
        }
        if ('divider' in tab) {
          return <SimpleDivider key={tab.id} className={classes.divider} />
        }
        return <TabNavigationCompressedItem key={tab.id} tab={tab} onClick={onClickSection} />
      })}
    </div>
  )
};

export default TabNavigationMenuCompressed;


