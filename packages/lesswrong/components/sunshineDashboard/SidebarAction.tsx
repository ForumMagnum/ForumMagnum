import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: theme.spacing.unit*2,
    cursor:"pointer",
    opacity:.4,
    "&:hover": {
      opacity:.8,
    },
    "&:hover $warningHighlight": {
      display: "block"
    }
  },
  warningHighlight: {
    display:"none",
    background: theme.palette.panelBackground.sunshineWarningHighlight,
    position:"absolute",
    top:0,
    right:0,
    width:250,
    height:"100%",
    pointerEvents: "none"
  },
  tooltip: {
    fontSize: '.9rem',
  }
})

const SidebarAction = ({children, classes, title, warningHighlight, onClick}: {
  children?: React.ReactNode,
  classes: ClassesType,
  title: string,
  warningHighlight?: boolean,
  onClick: () => void,
}) => {
  const { LWTooltip } = Components
  return <LWTooltip title={title} placement="bottom">
    <div onClick={onClick} className={classes.root}>
      {children}
      {warningHighlight && <div className={classes.warningHighlight}/>}
    </div>
  </LWTooltip>
}

const SidebarActionComponent = registerComponent('SidebarAction', SidebarAction, {styles});

declare global {
  interface ComponentTypes {
    SidebarAction: typeof SidebarActionComponent
  }
}

