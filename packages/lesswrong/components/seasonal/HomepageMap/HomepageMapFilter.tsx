import React from 'react';
import { Paper }from '@/components/widgets/Paper';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useMessages } from '../../common/withMessages';
import classNames from 'classnames'
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { useDialog } from '../../common/withDialog'
import { useCurrentUser } from '../../common/withUser';
import moment from 'moment';
import { captureEvent } from '../../../lib/analyticsEvents';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { HIDE_MAP_COOKIE } from '../../../lib/cookies/cookies';
import { createFallBackDialogHandler } from '@/components/localGroups/CommunityMapFilter';
import EventNotificationsDialog from "../../localGroups/EventNotificationsDialog";
import LWTooltip from "../../common/LWTooltip";
import SimpleDivider from "../../widgets/SimpleDivider";

const styles = (theme: ThemeType) => ({
  section: {
    display: "flex",
    alignItems: "center",
    padding: '8px 16px',
    ...theme.typography.body2,
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
  },
  hideText: {
    fontSize: '1rem',
    cursor: "pointer"
  },
  actionIcon: {
    width: '0.7em',
    height: '0.7em',
    marginLeft: theme.spacing.unit,
    position: 'relative',
    top: 2,
    cursor: "pointer"
  },
  hideSection: {
    backgroundColor: theme.palette.panelBackground.darken05,
  },
  divider: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  subscribeSection: {
    cursor: "pointer",
    marginTop: 4,
    marginBottom: 4
  },
  subscribeIcon: {
    marginLeft: 0,
    top: 0
  }
});

const HomepageMapFilter = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { openDialog } = useDialog()
  const currentUser = useCurrentUser()
  const { flash } = useMessages()
  const updateCurrentUser = useUpdateCurrentUser();
  
  const [_, setCookie, removeCookie] = useCookiesWithConsent([HIDE_MAP_COOKIE]);

  const handleHideMap = () => {
    let undoAction
    captureEvent(`${HIDE_MAP_COOKIE}Clicked`)
    if (currentUser) { 
      void updateCurrentUser({
        hideFrontpageMap: true
      })
      undoAction = () => {
        void updateCurrentUser({hideFrontpageMap: false})
      }
    } else {
      setCookie( HIDE_MAP_COOKIE, "true", {
        expires: moment().add(30, 'days').toDate(), 
        path: "/"
      });
      undoAction = () => {
        removeCookie( HIDE_MAP_COOKIE, { path: "/"});
      }
    }
    flash({messageString: "Hid map from Frontpage", action: undoAction})
  }
  return <Paper>
    <LWTooltip title="September is Meetups Month, celebrating Astral Codex Everywhere. Find a meetup near you." placement="left">
      <div className={classNames(classes.section, classes.title)}>
        <Link to="/posts/ynpC7oXhXxGPNuCgH/acx-meetups-everywhere-2023-times-and-places">
          Meetups Month
        </Link>
      </div>
    </LWTooltip>
    <SimpleDivider />
    <LWTooltip title="Get notified when events are in your area" placement="left">
      <div
          className={classNames(classes.section, classes.subscribeSection)}
          onClick={createFallBackDialogHandler(
            openDialog, "EventNotificationsDialog",
            ({onClose}) => <EventNotificationsDialog onClose={onClose} />,
            currentUser
          )}
        >
        <EmailIcon className={classNames(classes.actionIcon, classes.subscribeIcon)} /> 
        <span className={classes.buttonText}> Subscribe to events</span>
      </div>
    </LWTooltip>
    <LWTooltip title="Hide the map from the frontpage" placement="left" inlineBlock={false}>
      <div className={classNames(classes.section, classes.hideSection)} onClick={handleHideMap}>
        <div className={classes.hideText}> 
          Hide Map 
        </div>
      </div>
    </LWTooltip>
  </Paper>
}

export default registerComponent('HomepageMapFilter', HomepageMapFilter, {styles});



