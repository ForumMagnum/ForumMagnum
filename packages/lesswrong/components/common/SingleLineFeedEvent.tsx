import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { singleLineStyles } from '../comments/SingleLineComment';

const styles = defineStyles("SingleLineFeedEvent", (theme: ThemeType) => ({
  root: {
    display: "flex",
    ...theme.typography.body2,
    margin: 8,
    width: "100%",
  },
  frame: {
    borderRadius: 3,
    marginTop: 0,
    marginBottom: 0,
    padding: 12,
    paddingTop: 0,
    color: theme.palette.text.dim60,
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.faint,
  },
  itemDot: {
    display: "inline-block",
    marginRight: 8,
    width: 20,
    textAlign: "center",
    color: theme.palette.grey[680],
  },
  icon: {
    flexShrink: 0,
    flexGrow: 0,
    marginTop: 4,
    marginRight: 12,
  },
  iconNextToFrame: {
    marginTop: 12,
  },
  contents: {
    display: "inline-block",
    position: "relative",
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
  },
}));


const SingleLineFeedEvent = ({expands=false, setExpanded, frame, icon, children}: {
  expands?: boolean,
  setExpanded?: (expanded: boolean) => void,
  frame?: boolean,
  icon: React.ReactNode,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  
  function handleClick() {
    if (expands) {
      setExpanded?.(true);
    }
  }

  return <div className={classes.root} onClick={handleClick}>
    <div className={classNames(classes.icon, frame && classes.iconNextToFrame)}>{icon}</div>
    <div className={classNames(classes.contents, frame && classes.frame)}>
      {children}
    </div>
  </div>
}

const SingleLineFeedEventComponent = registerComponent("SingleLineFeedEvent", SingleLineFeedEvent);

declare global {
  interface ComponentTypes {
    SingleLineFeedEvent: typeof SingleLineFeedEventComponent
  }
}
