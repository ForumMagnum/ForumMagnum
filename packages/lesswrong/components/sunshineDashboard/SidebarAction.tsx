import React from 'react';
import LWTooltip from "../common/LWTooltip";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("SidebarAction", (theme: ThemeType) => ({
  root: {
    marginRight: 16,
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
}))

const SidebarAction = ({children, title, warningHighlight, onClick}: {
  children?: React.ReactNode,
  title: string,
  warningHighlight?: boolean,
  onClick: () => void,
}) => {
  const classes = useStyles(styles);
  return <LWTooltip title={title} placement="bottom">
    <div onClick={onClick} className={classes.root}>
      {children}
      {warningHighlight && <div className={classes.warningHighlight}/>}
    </div>
  </LWTooltip>
}

export default SidebarAction;



