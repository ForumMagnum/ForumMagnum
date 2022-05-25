import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    ...theme.typography.body2,
    margin: 8,
  },
  itemDot: {
    display: "inline-block",
    marginRight: 8,
    width: 20,
    textAlign: "center",
    color: theme.palette.grey[680],
  },
  expandButton: {
    display: "inline-block",
    marginRight: 8,
    fontWeight: "bold",
    cursor: "pointer",
    background: theme.palette.buttons.feedExpandButton.background,
    borderRadius: 10,
    width: 20,
    textAlign: "center",
    border: theme.palette.buttons.feedExpandButton.border,
    color: theme.palette.buttons.feedExpandButton.plusSign,
  },
  contents: {
    display: "inline-block",
  },
});


const SingleLineFeedEvent = ({expands=false, setExpanded, children, classes}: {
  expands?: boolean,
  setExpanded?: (expanded: boolean)=>void,
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  return <div className={classes.root}>
    {expands && <span className={classes.expandButton} onClick={ev => (setExpanded && setExpanded(true))} >{"+"}</span>}
    {!expands && <span className={classes.itemDot}>{"\u2022"}</span>}
    <div className={classes.contents}>
      {children}
    </div>
  </div>
}

const SingleLineFeedEventComponent = registerComponent("SingleLineFeedEvent", SingleLineFeedEvent, {styles});

declare global {
  interface ComponentTypes {
    SingleLineFeedEvent: typeof SingleLineFeedEventComponent
  }
}

