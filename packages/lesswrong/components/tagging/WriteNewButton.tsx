import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';
import Paper from '@material-ui/core/Paper';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    textTransform: 'none',
    boxShadow: 'none',
    padding: 0,
    fontSize: '14px',
    alignItems: 'unset', // required for vertical bar
    minHeight: 32,
  },
  buttonSection: {
    display: 'flex',
    alignItems: 'center'
  },
  buttonLabelContainer: {
    padding: '0px 9px 0px 8px',
  },
  subscribedButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  notSubscribedButton: {
    backgroundColor: theme.palette.grey[200],
    color: 'default'
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 3,
  },
  popout: {
    padding: "4px 0px 4px 0px",
    marginTop: 8,
    minWidth: 145,
    maxWidth: 220,
    '& a:hover': {
      opacity: 'inherit',
    }
  },
  menuItem: {
    color: theme.palette.grey[1000],
    borderRadius: theme.borderRadius.small,
    justifyContent: 'space-between',
    padding: '6px 8px',
    margin: '0px 3px',
    fontSize: '14px',
    '&:focus': {
      outline: "none",
    },
    '&:hover': {
      backgroundColor: theme.palette.grey[250],
      color: theme.palette.grey[1000],
    }
  },
})

const WriteNewButton = ({
  tag,
  isSubscribed,
  setNewShortformOpen,
  className,
  classes,
}: {
  tag: TagBasicInfo,
  isSubscribed: boolean,
  setNewShortformOpen: (open: boolean) => void,
  className?: string,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [open, setOpen] = useState(false);
  const anchorEl = useRef(null);

  const { LWClickAwayListener, LWPopper, ForumIcon, MenuItem } = Components;

  return (
    <div className={classNames(className, classes.root)}>
      <Button
        variant="contained"
        color={isSubscribed ? "primary" : undefined}
        onClick={(e) => {
          e.stopPropagation();
          captureEvent('writeNewClicked', {tagId: tag._id, newState: open ? "closed" : "open"});
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {},
            });
            return
          }
          setOpen((prev) => !prev);
        }}
        className={classes.button}
      >
        <div className={classNames(classes.buttonSection, classes.buttonLabelContainer)} ref={anchorEl}>
          <ForumIcon icon="Plus" className={classes.icon} />
          <span className={classes.subscribeText}>Write new</span>
        </div>
      </Button>
      <LWPopper open={!!anchorEl.current && open} anchorEl={anchorEl.current} placement="bottom-start">
        <LWClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper className={classes.popout}>
            <Link to={`/newPost?subforumTagId=${tag._id}`} eventProps={{writeNewMenuItem: "newPost"}}>
              <MenuItem className={classes.menuItem}>New post</MenuItem>
            </Link>
            <MenuItem
              className={classes.menuItem}
              onClick={(e) => {
                captureEvent('writeNewShortformClicked', {writeNewMenuItem: "newShortform"})
                setNewShortformOpen(true);
                setOpen(false);
              }}
            >
              New quick take
            </MenuItem>
            <Link to={`/newPost?question=true&subforumTagId=${tag._id}`} eventProps={{writeNewMenuItem: "newQuestion"}}>
              <MenuItem className={classes.menuItem}>New question</MenuItem>
            </Link>
          </Paper>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  );
}

const WriteNewButtonComponent = registerComponent('WriteNewButton', WriteNewButton, {styles});

declare global {
  interface ComponentTypes {
    WriteNewButton: typeof WriteNewButtonComponent
  }
}
