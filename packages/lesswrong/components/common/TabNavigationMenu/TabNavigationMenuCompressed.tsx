import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import Divider from '@material-ui/core/Divider';

// -- See here for all the tab content --
import { getMenuTabs } from './menuTabs'

const styles = (theme: ThemeType) => ({
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
})

const TabNavigationMenuCompressed = ({onClickSection, classes}: {
  onClickSection: (e?: React.BaseSyntheticEvent) => void,
  classes: ClassesType<typeof styles>
}) => {
  const { TabNavigationCompressedItem } = Components

  return (
    <div className={classes.root}>
      {getMenuTabs().map(tab => {
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
