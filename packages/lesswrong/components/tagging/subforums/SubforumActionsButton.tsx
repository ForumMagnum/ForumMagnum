import React, { useCallback, useRef, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import Paper from "@material-ui/core/Paper";
import Checkbox from '@material-ui/core/Checkbox';
import { useLocation, useNavigation } from '../../../lib/routeUtil';
import { defaultSubforumLayout, isSubforumLayout } from './SubforumSubforumTab';
import qs from 'qs';
import { useUpdate } from '../../../lib/crud/withUpdate';

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
  checkbox: {
    display: "flex",
    alignItems: "center",
    marginRight: 24,
    "& .MuiButtonBase-root": {
      padding: 6,
    },
    "& .Typography-root": {
      cursor: "default",
    },
  },
})

const SubforumActionsButton = ({tag, userTagRel, classes}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  userTagRel?: UserTagRelNotifications, // TODO merge with open PRs
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();
  const { query } = useLocation();
  const { history } = useNavigation();

  const layout = isSubforumLayout(query.layout) ? query.layout : defaultSubforumLayout
  
  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelNotifications",
  })

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "subforum", tagId: tag._id})
    setIsOpen(open);
  }

  const Icon = MoreVertIcon
  const { PopperCard, LWClickAwayListener, Typography } = Components

  const toggleLayout = useCallback(() => {
    const newQuery = {...query, layout: layout == "feed" ? "list" : "feed"}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
    if (userTagRel) {
      void updateUserTagRel({
        selector: {_id: userTagRel._id},
        data: {subforumLayout: newQuery.layout}
      })
    }
  }, [history, layout, query])

  const subforumActions = <Paper className={classes.popout}>
    <span className={classes.checkbox}>
      <Checkbox checked={layout == "feed"} onChange={toggleLayout} disableRipple />
      <Typography variant="body2">Show expanded previews</Typography>
    </span>
  </Paper>

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <Icon className={classes.icon} onClick={() => handleSetOpen(!isOpen)}/>
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="bottom-end"
      allowOverflow
    >
      {/*FIXME: ClickAwayListener doesn't handle portals correctly, which winds up making submenus inoperable. But we do still need clickaway to close.*/}
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
