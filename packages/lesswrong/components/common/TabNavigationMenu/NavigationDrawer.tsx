import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import type { ToCData } from '../../../lib/tableOfContents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Drawer from '@/lib/vendor/@material-ui/core/src/Drawer';

const styles = defineStyles("NavigationDrawer", (theme: ThemeType) => ({
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
}))

const NavigationDrawer = ({open, handleClose, toc}: {
  open: boolean,
  handleOpen: () => void,
  handleClose: () => void,
  toc: ToCData|null,
}) => {
  const classes = useStyles(styles);
  const { TabNavigationMenu, TabNavigationMenuCompressed } = Components
  const showToc = toc && toc.sections

  return <Drawer
    open={open}
    onClose={(event) => handleClose()}
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
        <Components.TableOfContentsList
          tocSections={toc.sections}
          title={null}
          onClickSection={() => handleClose()}
        />
      </div>
    </React.Fragment>}
  </Drawer>
}

const NavigationDrawerComponent = registerComponent('NavigationDrawer', NavigationDrawer);

declare global {
  interface ComponentTypes {
    NavigationDrawer: typeof NavigationDrawerComponent
  }
}
