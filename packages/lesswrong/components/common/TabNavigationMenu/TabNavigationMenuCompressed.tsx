import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';

// -- See here for all the tab content --
import menuTabs from './menuTabs'
import { forumSelect } from '../../../lib/forumTypeUtils';
import { TabNavigationCompressedItem } from "./TabNavigationCompressedItem";
import { SimpleDivider } from "../../widgets/SimpleDivider";

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

const TabNavigationMenuCompressedInner = ({onClickSection, classes}: {
  onClickSection: (e?: React.BaseSyntheticEvent) => void,
  classes: ClassesType<typeof styles>
}) => {
  return (
    <div className={classes.root}>
      {forumSelect(menuTabs).map(tab => {
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

export const TabNavigationMenuCompressed = registerComponent(
  'TabNavigationMenuCompressed', TabNavigationMenuCompressedInner, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationMenuCompressed: typeof TabNavigationMenuCompressed
  }
}
