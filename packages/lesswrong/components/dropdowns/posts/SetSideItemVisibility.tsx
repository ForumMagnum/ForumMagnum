import React, { createContext, useContext, useState, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { sideCommentFilterMinKarma } from '../../../lib/collections/posts/constants';
import Paper from '@material-ui/core/Paper';
import ChatBubbleOutline from '@material-ui/icons/ChatBubbleOutline';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Check from '@material-ui/icons/Check';
import classNames from 'classnames';
import { hasSideComments } from '../../../lib/betas';

const styles = (theme: ThemeType) => ({
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

export type InlineReactsMode = "hidden"|"netPositive"|"all";
const inlineReactModes: {name: InlineReactsMode, label: string, detailedLabel?: string}[] = [
  {name: "hidden", label: "Hide All"},
  {name: "netPositive", label: "Hide Downvoted"},
  {name: "all", label: "Show All"},
];
export const defaultInlineReactsMode: InlineReactsMode = "netPositive";

export type SideItemVisibilityContextType = {
  sideCommentMode: SideCommentMode,
  setSideCommentMode: (mode: SideCommentMode) => void,
  inlineReactsMode: InlineReactsMode,
  setInlineReactsMode: (mode: InlineReactsMode) => void,
}

export const SideItemVisibilityContext = createContext<SideItemVisibilityContextType|null>(null);

const SetSideItemVisibility = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const sideItemVisibility = useContext(SideItemVisibilityContext);
  const { LWTooltip, MenuItem } = Components;
  
  // If in a context that isn't a post page (eg, the triple-dot menu on posts in
  // a post list), this context won't be there and this option doesn't apply, so
  // hide it.
  if (!sideItemVisibility || !hasSideComments)
    return null;
  
  const {sideCommentMode, setSideCommentMode, inlineReactsMode, setInlineReactsMode} = sideItemVisibility;
  const sideCommentsSubmenu = <Paper>
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
  const inlineReactsSubmenu = <Paper>
    {inlineReactModes.map(mode =>
      <MenuItem
        key={mode.name}
        onClick={() => {
          setInlineReactsMode(mode.name)
        }}
      >
        {inlineReactsMode === mode.name
          ? <Check className={classes.check}/>
          : <div className={classes.notChecked}/>
        }
        {mode.detailedLabel || mode.label}
      </MenuItem>
    )}
  </Paper>
  
  return <>
    <LWTooltip
      title={sideCommentsSubmenu}
      tooltip={false} clickable={true}
      inlineBlock={false}
      placement="left-start"
    >
      <MenuItem>
        <ListItemIcon>
          <ChatBubbleOutline/>
        </ListItemIcon>
        <span>
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
    <LWTooltip
      title={inlineReactsSubmenu}
      tooltip={false} clickable={true}
      inlineBlock={false}
      placement="left-start"
    >
      <MenuItem>
        <ListItemIcon>
          <ChatBubbleOutline/>
        </ListItemIcon>
        <span>
          Inline Reactions
        </span>
        <span className={classes.currentSelectionPreview}>
          {inlineReactModes.find(mode=>mode.name===inlineReactsMode)?.label}
        </span>
        
      </MenuItem>
    </LWTooltip>
  </>
}

export const SideItemVisibilityContextProvider = ({post, children}: {
  post:  PostsDetails|undefined
  children: React.ReactNode
}) => {
  const defaultSideCommentVisibility = hasSideComments
    ? (post?.sideCommentVisibility ?? "highKarma")
    : "hidden";
  const [sideCommentMode,setSideCommentMode] = useState<SideCommentMode>(defaultSideCommentVisibility as SideCommentMode);
  const [inlineReactsMode,setInlineReactsMode] = useState<InlineReactsMode>(defaultInlineReactsMode);
  const context: SideItemVisibilityContextType = useMemo(
    () => ({ sideCommentMode, setSideCommentMode, inlineReactsMode, setInlineReactsMode }),
    [sideCommentMode, setSideCommentMode, inlineReactsMode, setInlineReactsMode]
  );

  return <SideItemVisibilityContext.Provider value={context}>
    {children}
  </SideItemVisibilityContext.Provider>
}

const SetSideItemVisibilityComponent = registerComponent('SetSideItemVisibility', SetSideItemVisibility, {styles});

declare global {
  interface ComponentTypes {
    SetSideItemVisibility: typeof SetSideItemVisibilityComponent
  }
}
