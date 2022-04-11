import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import Divider from '@material-ui/core/Divider';

// -- See here for all the tab content --
import menuTabs from './menuTabs'
import { forumSelect } from '../../../lib/forumTypeUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width:55,
    backgroundColor: theme.palette.grey[100],
    borderRight: "solid 1px rgba(0,0,0,.1)",
    height:"100%",
    color: theme.palette.grey[600],
  },
  divider: {
    marginTop:theme.spacing.unit,
    marginBottom:theme.spacing.unit
  }
})

const TabNavigationMenuCompressed = ({onClickSection, classes}) => {
  const { TabNavigationCompressedItem } = Components

  return (
    <div className={classes.root}>
      {forumSelect(menuTabs).map(tab => {
        if (!('showOnCompressed' in tab) || !tab.showOnCompressed) {
          return
        }
        if ('divider' in tab) {
          return <Divider key={tab.id} className={classes.divider} />
        }
        return <TabNavigationCompressedItem key={tab.id} tab={tab} onClick={onClickSection} />
      })}
    </div>
  )
};

const TabNavigationMenuCompressedComponent = registerComponent(
  'TabNavigationMenuCompressed', TabNavigationMenuCompressed, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationMenuCompressed: typeof TabNavigationMenuCompressedComponent
  }
}
