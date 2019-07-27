import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';

const styles = theme => ({
  paperWithoutToC: {
    width: 225
  },
  paperWithToC: {
    width: 300,
    overflow:"hidden",
  },
  drawerNavigationMenu: {
    paddingTop: '10px',
    left:0,
    width:260,
    paddingBottom: 20,
    // flexDirection: "column",
  },
  navButtons: {
    width:55,
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    borderRight: "solid 1px rgba(0,0,0,.1)",
    height:"100%",
    color: theme.palette.grey[600],
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  },
  tableOfContents: {
    padding: "16px 0 16px 16px",
    position:"absolute",
    overflowY:"scroll",
    left:55,
    maxWidth: 247,
    height:"100%",
    display:"none",
    [theme.breakpoints.down('sm')]: {
      display:"block"
    }
  },
})

const NavigationDrawer = ({open, handleOpen, handleClose, toc, classes}) => {
  const { TabNavigationMenu } = Components
  const showToc = toc && toc.sections

  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{paper: classes.paper}}
  >
    <div className={classes.drawerNavigationMenu}>
      <TabNavigationMenu />
    </div>
    {showToc && <React.Fragment>
      <div className={classes.tableOfContents}>
        <Components.TableOfContentsList
          sectionData={toc}
          onClickSection={() => handleClose()}
          drawerStyle={true}
        />
      </div>
    </React.Fragment>}
  </SwipeableDrawer>
}

registerComponent(
  'NavigationDrawer', NavigationDrawer,
  withStyles(styles, { name: 'NavigationDrawer'})
);
