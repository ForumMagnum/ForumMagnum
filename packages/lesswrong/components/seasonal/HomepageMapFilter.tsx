import React from 'react';
import Paper from '@material-ui/core/Paper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';
import classNames from 'classnames'
import Divider from '@material-ui/core/Divider';
import EmailIcon from '@material-ui/icons/Email';
import { useDialog } from '../common/withDialog'
import { useCurrentUser } from '../common/withUser';
import moment from 'moment';
import { captureEvent } from '../../lib/analyticsEvents';
import { useCookies } from 'react-cookie';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  section: {
    display: "flex",
    alignItems: "center",
    padding: '8px 16px',
    [theme.breakpoints.down('sm')]: {
      display: 'inline-block',
      flexGrow: 1,
      padding: '8px 22px'
    }
  },
  title: {
    padding: 16
  },
  buttonText: {
    marginLeft: 10,
    ...theme.typography.body2,
  },
  hideText: {
    marginLeft: 'auto',
    fontSize: '1rem',
    cursor: "pointer"
  },
  hideSection: {
    backgroundColor: theme.palette.panelBackground.darken05,
  },
  actionIcon: {
    width: '0.7em',
    height: '0.7em',
    marginLeft: theme.spacing.unit,
    position: 'relative',
    top: 2,
    cursor: "pointer"
  },
  divider: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  subscribeSection: {
    cursor: "pointer",
  },
  subscribeIcon: {
    marginLeft: 0,
    top: 0
  }
});

export const hideMapCookieName = `hideMapFromFrontpage`;

const createFallBackDialogHandler = (openDialog, dialogName, currentUser) => {
  return () => openDialog({
    componentName: currentUser ? dialogName : "LoginPopup",
  });
}

const HomepageMapFilter = ({classes}:{classes:ClassesType}) => {
  const openDialog = useDialog()
  const currentUser = useCurrentUser()
  const { flash } = useMessages()
  const updateCurrentUser = useUpdateCurrentUser();
  
  const [_, setCookie, removeCookie] = useCookies([hideMapCookieName]);

  const handleHideMap = () => {
    let undoAction
    captureEvent(`${hideMapCookieName}Clicked`)
    if (currentUser) { 
      void updateCurrentUser({
        hideFrontpageMap: true
      })
      undoAction = () => {
        void updateCurrentUser({hideFrontpageMap: false})
      }
    } else {
      setCookie( hideMapCookieName, "true", {
        expires: moment().add(30, 'days').toDate(), 
        path: "/"
      });
      undoAction = () => {
        removeCookie( hideMapCookieName, { path: "/"});
      }
    }
    flash({messageString: "Hid map from Frontpage", action: undoAction})
  }

  const { LWTooltip } = Components

  return <Paper>
    <div className={classNames(classes.section, classes.title)}>
      <LWTooltip title="Read more about Astral Codex Everywhere, and find a meetup near you">
        <Link to="/posts/fLdADsBLAMuGvky2M/meetups-everywhere-2022-times-and">
          ACX Meetups Everywhere
        </Link>
      </LWTooltip>
    </div>
    <Divider />
    <LWTooltip title="Get notified when events are in your area" placement="left">
      <div
          className={classNames(classes.section, classes.subscribeSection)}
          onClick={createFallBackDialogHandler(openDialog, "EventNotificationsDialog", currentUser)}
        >
        <EmailIcon className={classNames(classes.actionIcon, classes.subscribeIcon)} /> 
        <span className={classes.buttonText}> Subscribe to events</span>
      </div>
    </LWTooltip>
    <div className={classNames(classes.section, classes.hideSection)}>
      <LWTooltip title="Hide the map from the frontpage" placement="left">
        <div className={classNames(classes.buttonText, classes.hideText)} onClick={handleHideMap}> 
          Hide Map 
        </div>
      </LWTooltip>
    </div>
  </Paper>
}

const HomepageMapFilterComponent = registerComponent('HomepageMapFilter', HomepageMapFilter, {styles});

declare global {
  interface ComponentTypes {
    HomepageMapFilter: typeof HomepageMapFilterComponent
  }
}

