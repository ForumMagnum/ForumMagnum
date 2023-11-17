import React, { createContext, useContext } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { sideCommentFilterMinKarma } from '../../../lib/collections/posts/constants';
import Paper from '@material-ui/core/Paper';
import ChatBubbleOutline from '@material-ui/icons/ChatBubbleOutline';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Check from '@material-ui/icons/Check';
import classNames from 'classnames';
import { hasSideComments } from '../../../lib/betas';
import { useCurrentUser } from '../../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  check: {
    width: 20,
    marginRight: 8,
  },
  notChecked: {
    width: 20,
    marginRight: 8,
  },
  currentSelectionPreview: {
    position: "absolute",
    right: 12,
    top: 12,
    color: theme.palette.text.dim40,
    
    [theme.breakpoints.down('xs')]: {
      display: "none",
    }
  },
  showOnlyIfMobile: {
    display: "none",
    [theme.breakpoints.down('xs')]: {
      display: "block",
    },
  },
  largerScreenNeededNotice: {
    padding: 8,
    ...theme.typography.commentStyle,
  },
});

export type SideCommentMode = "hidden"|"highKarma"|"all";
const sideCommentModes: {name: SideCommentMode, label: string, detailedLabel?: string}[] = [
  {name: "hidden", label: "Hide All"},
  {name: "highKarma", label: "Show Upvoted", detailedLabel: `Show Upvoted (${sideCommentFilterMinKarma}+ karma)`},
  {name: "all", label: "Show All"},
];
export type SideCommentVisibilityContextType = {
  sideCommentMode: SideCommentMode,
  setSideCommentMode: (mode: SideCommentMode)=>void,
}

export const SideCommentVisibilityContext = createContext<SideCommentVisibilityContextType|null>(null);

const SetSideCommentVisibility = ({classes}: {
  classes: ClassesType
}) => {
  const sideCommentVisibility = useContext(SideCommentVisibilityContext);
  const { LWTooltip, MenuItem } = Components;
  
  // If in a context that isn't a post page (eg, the triple-dot menu on posts in
  // a post list), this context won't be there and this option doesn't apply, so
  // hide it.
  if (!sideCommentVisibility || !hasSideComments)
    return null;
  
  const {sideCommentMode, setSideCommentMode} = sideCommentVisibility;
  const submenu = <Paper>
    <span className={classNames(classes.showOnlyIfMobile, classes.largerScreenNeededNotice)}>
      Side-comments require a larger screen
    </span>
    {sideCommentModes.map(mode =>
      <MenuItem
        key={mode.name}
        onClick={() => {
          setSideCommentMode(mode.name)
        }}
      >
        {sideCommentMode === mode.name
          ? <Check className={classes.check}/>
          : <div className={classes.notChecked}/>
        }
        {mode.detailedLabel || mode.label}
      </MenuItem>
    )}
  </Paper>
  
  return <LWTooltip
    title={submenu}
    tooltip={false} clickable={true}
    inlineBlock={false}
    placement="left-start"
  >
    <MenuItem>
      <ListItemIcon>
        <ChatBubbleOutline/>
      </ListItemIcon>
      <span className={classes.sideCommentsLabel}>
        Side-comments
      </span>
      <span className={classNames(classes.showOnlyIfMobile, classes.currentSelectionPreview)}>
        Hidden
      </span>
      <span className={classes.currentSelectionPreview}>
        {sideCommentModes.find(mode=>mode.name===sideCommentMode)?.label}
      </span>
    </MenuItem>
  </LWTooltip>
}

const SetSideCommentVisibilityComponent = registerComponent('SetSideCommentVisibility', SetSideCommentVisibility, {styles});

declare global {
  interface ComponentTypes {
    SetSideCommentVisibility: typeof SetSideCommentVisibilityComponent
  }
}
