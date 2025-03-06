import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import classNames from 'classnames';
import type { ToCData } from '../../../lib/tableOfContents';
import TabNavigationMenu from "@/components/common/TabNavigationMenu/TabNavigationMenu";
import TabNavigationMenuCompressed from "@/components/common/TabNavigationMenu/TabNavigationMenuCompressed";
import TableOfContentsList from "@/components/posts/TableOfContents/TableOfContentsList";

const styles = (theme: ThemeType) => ({
  paperWithoutToC: {
    width: 280,
    overflowY: "auto"
  },
  paperWithToC: {
    width: 280,
    [theme.breakpoints.down('sm')]: {
      width: 300
    },
    overflow:"hidden",
  },
  drawerNavigationMenuUncompressed: {
    left:0,
    width:260,
    paddingBottom: 20,
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display:"none"
    }
  },
  drawerNavigationMenuCompressed: {
    width:55,
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    borderRight: theme.palette.border.faint,
    height:"100%",
    color: theme.palette.grey[600],
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  },
  tableOfContents: {
    padding: "16px 0 16px 16px",
    position:"absolute",
    overflowY:"auto",
    left:55,
    maxWidth: 247,
    height:"100%",
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
})

const NavigationDrawer = ({open, handleOpen, handleClose, toc, classes}: {
  open: boolean,
  handleOpen: () => void,
  handleClose: () => void,
  toc: ToCData|null,
  classes: ClassesType<typeof styles>,
}) => {
  const showToc = toc && toc.sections

  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{paper: showToc ? classes.paperWithToC : classes.paperWithoutToC}}
  >
    <div className={classNames(
      classes.drawerNavigationMenuUncompressed,
      {[classes.hideOnMobile]: showToc}
    )}>
      <TabNavigationMenu onClickSection={handleClose}/>
    </div>
    {showToc && <React.Fragment>
      <div className={classes.drawerNavigationMenuCompressed}>
        <TabNavigationMenuCompressed onClickSection={handleClose}/>
      </div>
      <div className={classes.tableOfContents}>
        <TableOfContentsList
          tocSections={toc.sections}
          title={null}
          onClickSection={() => handleClose()}
        />
      </div>
    </React.Fragment>}
  </SwipeableDrawer>
}

const NavigationDrawerComponent = registerComponent(
  'NavigationDrawer', NavigationDrawer, {styles}
);

declare global {
  interface ComponentTypes {
    NavigationDrawer: typeof NavigationDrawerComponent
  }
}

export default NavigationDrawerComponent;
