import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import type { ToCData } from '../../../lib/tableOfContents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Drawer } from '@/components/material-ui/Drawer'
import { TableOfContentsList } from "../../posts/TableOfContents/TableOfContentsList";
import { TabNavigationMenu } from "./TabNavigationMenu";
import { TabNavigationMenuCompressed } from "./TabNavigationMenuCompressed";

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

const NavigationDrawerInner = ({open, handleClose, toc}: {
  open: boolean,
  handleOpen: () => void,
  handleClose: () => void,
  toc: ToCData|null,
}) => {
  const classes = useStyles(styles);
  const showToc = toc && toc.sections

  return <Drawer
    open={open}
    onClose={(event) => handleClose()}
    paperClassName={showToc ? classes.paperWithToC : classes.paperWithoutToC}
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
  </Drawer>
}

export const NavigationDrawer = registerComponent('NavigationDrawer', NavigationDrawerInner);


