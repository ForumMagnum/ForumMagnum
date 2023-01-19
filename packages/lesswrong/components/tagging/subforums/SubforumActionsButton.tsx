import React, { useCallback, useRef, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useTracking } from '../../../lib/analyticsEvents';
import Paper from "@material-ui/core/Paper";
import { useLocation, useNavigation } from '../../../lib/routeUtil';
import qs from 'qs';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon'
import SwapHoriz from '@material-ui/icons/SwapHoriz'
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../../common/withUser';
import { SubforumLayout } from '../../../lib/collections/tags/subforumHelpers';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer",
    paddingLeft: 6,
  },
  icon: {
    verticalAlign: 'middle',
    cursor: "pointer",
    color: theme.palette.grey[500]
  },
  anchor: {
    // Invisible div that the PopperCard attaches to in order to not overlap with the Join button
    position: "relative",
    top: 6,
  },
  popout: {
    padding: "4px 0px 4px 0px",
    maxWidth: 260,
    '& .form-input': {
      marginTop: 0,
    },
    '& .form-input:last-child': {
      marginBottom: 4,
    }
  },
})

const SubforumActionsButton = ({tag, layout, classes}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  layout: SubforumLayout,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();
  const { query } = useLocation();
  const { history } = useNavigation();
  const currentUser = useCurrentUser();
  
  const updateCurrentUser = useUpdateCurrentUser()

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "subforum", tagId: tag._id})
    setIsOpen(open);
  }

  const Icon = MoreVertIcon
  const { PopperCard, LWClickAwayListener } = Components

  const toggleLayout = useCallback(() => {
    const newLayout = layout === "feed" ? "list" : "feed"
    captureEvent("subforumLayoutChanged", {tagId: tag._id, oldLayout: layout, newLayout: newLayout})
    
    // Immediately change the layout for any user (inc logged out)
    const newQuery = {...query, layout: newLayout}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})

    if (currentUser) {
      // For logged in users, also update their layout preference
      void updateCurrentUser({subforumPreferredLayout: newLayout})
    }
    setIsOpen(false)
  }, [captureEvent, currentUser, history, layout, query, tag._id, updateCurrentUser])

  const layoutMessages: Record<SubforumLayout, string> = {
    feed: "Switch to list view",
    list: "Switch to feed view",
  }

  const subforumActions = (
    <Paper className={classes.popout}>
      <MenuItem onClick={toggleLayout}>
        <ListItemIcon>
          <SwapHoriz />
        </ListItemIcon>
        {layoutMessages[layout]}
      </MenuItem>
    </Paper>
  );

  return <div className={classes.root}>
    <div>
      <Icon className={classes.icon} onClick={() => handleSetOpen(!isOpen)}/>
    </div>
    <div className={classes.anchor} ref={anchorEl} />
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="bottom-end"
      allowOverflow
    >
      <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
        {subforumActions}
      </LWClickAwayListener>
    </PopperCard>
  </div>
}


const SubforumActionsButtonComponent = registerComponent('SubforumActionsButton', SubforumActionsButton, {styles});

declare global {
  interface ComponentTypes {
    SubforumActionsButton: typeof SubforumActionsButtonComponent
  }
}
