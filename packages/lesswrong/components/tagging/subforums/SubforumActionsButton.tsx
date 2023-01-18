import React, { useCallback, useRef, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useTracking } from '../../../lib/analyticsEvents';
import Paper from "@material-ui/core/Paper";
import Checkbox from '@material-ui/core/Checkbox';
import { useLocation, useNavigation } from '../../../lib/routeUtil';
import qs from 'qs';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { defaultSubforumLayout, isSubforumLayout, SubforumLayout } from '../../../lib/collections/tags/helpers';

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

const SubforumActionsButton = ({tag, userTagRel, layout, classes}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  userTagRel?: UserTagRelDetails,
  layout: SubforumLayout,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();
  const { query } = useLocation();
  const { history } = useNavigation();
  
  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelDetails",
  })

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "subforum", tagId: tag._id})
    setIsOpen(open);
  }

  const Icon = MoreVertIcon
  const { PopperCard, LWClickAwayListener, Typography } = Components

  const toggleLayout = useCallback(() => {
    const newLayout = layout == "feed" ? "list" : "feed"
    const newQuery = {...query, layout: newLayout}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
    if (userTagRel) {
      void updateUserTagRel({
        selector: {_id: userTagRel._id},
        data: {subforumPreferredLayout: newLayout}
      })
    }
  }, [history, layout, query, updateUserTagRel, userTagRel])

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
