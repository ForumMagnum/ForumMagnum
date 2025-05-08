import React, { useCallback, useState } from 'react';
import { Paper }from '@/components/widgets/Paper';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';
import { groupTypes } from '../../lib/collections/localgroups/groupTypes';
import classNames from 'classnames'
import VisibilityIcon from '@/lib/vendor/@material-ui/icons/src/VisibilityOff';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import AddIcon from '@/lib/vendor/@material-ui/icons/src/Add';
import RoomIcon from '@/lib/vendor/@material-ui/icons/src/Room';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import PersonPinIcon from '@/lib/vendor/@material-ui/icons/src/PersonPin';
import { DialogContentsFn, OpenDialogContextType, useDialog } from '../common/withDialog'
import { useCurrentUser } from '../common/withUser';
import { PersonSVG, ArrowSVG, GroupIconSVG } from './Icons'
import qs from 'qs'
import { without } from 'underscore';
import { isEAForum } from '../../lib/instanceSettings';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import {isFriendlyUI} from '../../themes/forumTheme'
import { RouterLocation } from "../../lib/vulcan-lib/routes";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { TooltipSpan } from '../common/FMTooltip';
import { LoginPopup } from "../users/LoginPopup";
import { GroupFormDialog } from "./GroupFormDialog";
import { SetPersonalMapLocationDialog } from "./SetPersonalMapLocationDialog";
import { EventNotificationsDialog } from "./EventNotificationsDialog";
import { SimpleDivider } from "../widgets/SimpleDivider";

const availableFilters = groupTypes.map(t => t.shortName);

const styles = (theme: ThemeType) => ({
  root: {
    width: 120,
    padding: "10px 10px 5px 10px",
    borderRadius: 2,
    marginBottom: theme.spacing.unit,
  },
  filters: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  filter: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'inline-block',
    cursor: "pointer",
    '&:hover': {
      backgroundColor: theme.palette.grey[200]
    }
  },
  firstFilter: {
    paddingLeft: 16
  },
  lastFilter: {
    paddingRight: 16
  },
  filterChecked: {
    backgroundColor: theme.palette.grey[500],
    '&:hover': {
      backgroundColor: theme.palette.grey[400]
    }
  },
  checkbox: {
    padding: 0,
    marginRight: 5,
    width: '0.7em',
    height: '0.7em'
  },
  checkboxLabel: {
    ...theme.typography.body2,
    fontWeight: isEAForum ? 600 : undefined,
  },
  checkedLabel: {
    color: theme.palette.text.tooltipText,
  },
  filterSection: {
    display: "flex",
    alignItems: "center",
    padding: '8px 16px',
    [theme.breakpoints.down('sm')]: {
      display: 'inline-block',
      flexGrow: 1,
      padding: '8px 22px'
    }
  },
  actions: {
    marginBottom: 8,
    [theme.breakpoints.down('sm')]: {
      display: 'flex'
    }
  },
  hideMap: {
    width: 34,
    padding: 5
  },
  buttonText: {
    marginLeft: 10,
    ...theme.typography.body2,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  hideText: {
    marginLeft: 'auto',
    fontSize: '1rem',
    cursor: "pointer"
  },
  hideSection: {
    backgroundColor: theme.palette.panelBackground.darken05,
  },
  buttonIcon: {
    width: '1.2rem',
    height: '1.2rem',
  },
  eaButtonIcon: {
    width: '1.7rem',
    height: '1.7rem',
  },
  actionIcon: {
    width: '0.7em',
    height: '0.7em',
    marginLeft: theme.spacing.unit,
    position: 'relative',
    top: 2,
    cursor: "pointer"
  },
  visibilityIcon: {
    color: theme.palette.icon.dim2,
    cursor: "pointer",
  },
  addIcon: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  checkedVisibilityIcon: {
    color: theme.palette.text.normal,
  },
  actionContainer: {
    marginLeft: 'auto',
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  divider: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  topDivider: {
    marginTop: 0
  },
  subscribeSection: {
    cursor: "pointer",
    marginBottom: theme.spacing.unit,
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  subscribeIcon: {
    marginLeft: 0,
    top: 0
  },
  desktopFilter: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  mobileFilter: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    },
  },
  mobileFilterActive: {
    opacity: 0.3
  },
  bottomDivider: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  }
});

export const createFallBackDialogHandler = (
  openDialog: OpenDialogContextType['openDialog'],
  name: string,
  contents: DialogContentsFn,
  currentUser: UsersCurrent | null
) => {
  if (currentUser) {
    return () => openDialog({ name, contents });
  } else {
    return () => openDialog({
      name: "LoginPopup",
      contents: ({onClose}) => <LoginPopup onClose={onClose} />
    });
  }
}

const getInitialFilters = ({query}: RouterLocation) => {
  const filters = query?.filters;
  if (Array.isArray(filters)) {
    return filters;
  } else if (typeof filters === "string") {
    return [filters];
  }
  return [];
}

const CommunityMapFilterInner = ({
  setShowMap,
  showHideMap,
  toggleGroups,
  showGroups,
  toggleEvents,
  showEvents,
  toggleIndividuals,
  showIndividuals,
  classes,
}: {
  setShowMap: any,
  showHideMap: boolean,
  toggleGroups: any,
  showGroups: boolean,
  toggleEvents: any,
  showEvents: boolean,
  toggleIndividuals: any,
  showIndividuals: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const location = useLocation();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const navigate = useNavigate();
  const {openDialog} = useDialog();
  const {flash} = useMessages();
  const [filters, setFilters] = useState(() => getInitialFilters(location));

  const handleCheck = useCallback((filter: string) => {
    let newFilters: AnyBecauseTodo[] = [];
    if (Array.isArray(filters) && filters.includes(filter)) {
      newFilters = without(filters, filter);
    } else {
      newFilters = [...filters, filter];
    }
    setFilters(newFilters);
    // FIXME: qs.stringify doesn't handle array parameters in the way
    // react-router-v3 did, which causes awkward-looking and backwards
    // incompatible (but not broken) URLs.
    navigate({...location.location, search: qs.stringify({filters: newFilters})});
  }, [filters, location.location, navigate]);

  const handleHideMap = useCallback(() => {
    let undoAction;
    if (currentUser) {
      void updateCurrentUser({
        hideFrontpageMap: true
      })
      undoAction = () => {
        void updateCurrentUser({hideFrontpageMap: false})
      }
    } else {
      setShowMap(false)
      undoAction = () => setShowMap(true)
    }
    flash({messageString: "Hid map from Frontpage", action: undoAction})
  }, [currentUser, flash, setShowMap, updateCurrentUser]);

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const GroupIcon = () => isEAForum
    ? <StarIcon className={classes.eaButtonIcon}/>
    : <GroupIconSVG className={classes.buttonIcon}/>;
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const EventIcon = () => isEAForum
    ? <RoomIcon className={classes.eaButtonIcon}/>
    : <ArrowSVG className={classes.buttonIcon}/>;
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const PersonIcon = () => isEAForum
    ? <PersonPinIcon className={classes.eaButtonIcon}/>
    : <PersonSVG className={classes.buttonIcon}/>;

  const isAdmin = userIsAdmin(currentUser);

  return (
    <Paper>
      {!isFriendlyUI && <div className={classes.filters}>
        {availableFilters.map((value, i) => {
          const checked = filters.includes(value)
          return (
            <span
              className={classNames(classes.filter, {
                [classes.filterChecked]: checked,
                [classes.firstFilter]: i === 0,
                [classes.lastFilter]: i === (availableFilters.length - 1),
              })}
              key={value}
              onClick={() => handleCheck(value)}
            >
              <span
                className={classNames(classes.checkboxLabel, {
                  [classes.checkedLabel]: checked,
                })}
              >
                {value}
              </span>
            </span>
          );
        })}
      </div>}
      <SimpleDivider className={classNames(classes.divider, classes.topDivider)} />
      <div className={classes.actions}>
        <div className={classes.filterSection}>
          <span className={classes.desktopFilter}>
            <GroupIcon />
          </span>
          <span className={classNames(classes.mobileFilter, {[classes.mobileFilterActive]: !showGroups})} onClick={toggleGroups}>
            <GroupIcon />
          </span>
          <span className={classes.buttonText}>Groups</span>
          <span className={classes.actionContainer}>
            {(!isEAForum || isAdmin) && <TooltipSpan title="Create New Group">
              <AddIcon
                className={classNames(classes.actionIcon, classes.addIcon)}
                onClick={createFallBackDialogHandler(
                  openDialog, "GroupFormDialog",
                  ({onClose}) => <GroupFormDialog onClose={onClose}/>,
                  currentUser
                )}
              />
            </ TooltipSpan>}
            <TooltipSpan title="Hide groups from map">
              <VisibilityIcon 
                onClick={toggleGroups}
                className={classNames(classes.actionIcon, classes.visibilityIcon, {[classes.checkedVisibilityIcon]: !showGroups})}
              />
            </TooltipSpan>
          </span>
        </div>
        <div 
          className={classes.filterSection}>
          <span className={classes.desktopFilter}>
            <EventIcon/>
          </span>
          <span className={classNames(classes.mobileFilter, {[classes.mobileFilterActive]: !showEvents})} onClick={toggleEvents}>
            <EventIcon/>
          </span>
          <span className={classes.buttonText}> Events </span>
          <span className={classes.actionContainer}>
            {currentUser && <TooltipSpan title="Create New Event">
              <AddIcon
                className={classNames(classes.actionIcon, classes.addIcon)}
                onClick={() => navigate({ pathname: '/newPost', search: `?eventForm=true`})}
              />
            </TooltipSpan>}
            <TooltipSpan title="Hide events from map">
              <VisibilityIcon
                onClick={toggleEvents}
                className={classNames(classes.actionIcon, classes.visibilityIcon, {[classes.checkedVisibilityIcon]: !showEvents})}
              />
            </TooltipSpan>
          </span>
        </div>
        <div
          className={classes.filterSection}
        >
          <span className={classes.desktopFilter}>
            <PersonIcon />
          </span>
          <span className={classNames(classes.mobileFilter, {[classes.mobileFilterActive]: !showIndividuals})} onClick={toggleIndividuals}>
            <PersonIcon />
          </span>
          <span className={classes.buttonText}> Individuals </span>
          <span className={classes.actionContainer}>
            <TooltipSpan title="Add your location to the map">
              <AddIcon className={classNames(classes.actionIcon, classes.addIcon)} onClick={
                createFallBackDialogHandler(
                  openDialog, "SetPersonalMapLocationDialog",
                  ({onClose}) => <SetPersonalMapLocationDialog onClose={onClose} />,
                  currentUser
                )
              }/>
            </TooltipSpan>
            <TooltipSpan title="Hide individual user locations from map">
              <VisibilityIcon
                onClick={toggleIndividuals}
                className={classNames(classes.actionIcon, classes.visibilityIcon, {[classes.checkedVisibilityIcon]: !showIndividuals})}
              />
            </TooltipSpan>
          </span>
        </div>
      </div>
      <SimpleDivider className={classNames(classes.divider, classes.bottomDivider)} />
      <div
        className={classNames(classes.filterSection, classes.subscribeSection)}
        onClick={createFallBackDialogHandler(
          openDialog, "EventNotificationsDialog",
          ({onClose}) => <EventNotificationsDialog onClose={onClose} />,
          currentUser
        )}
      >
        <EmailIcon className={classNames(classes.actionIcon, classes.subscribeIcon)} />
        <span className={classes.buttonText}> Subscribe to events</span>
      </div>
      {showHideMap && <span>
        <TooltipSpan title="Hide the map from the frontpage">
          <div className={classNames(classes.filterSection, classes.hideSection)}>
            {/* <CloseIcon className={classes.buttonIcon} />  */}
            <span
              className={classNames(classes.buttonText, classes.hideText)}
              onClick={handleHideMap}
            >
              Hide Map
            </span>
          </div>
        </TooltipSpan>
      </span>}
    </Paper>
  );
}

export const CommunityMapFilter = registerComponent(
  'CommunityMapFilter',
  CommunityMapFilterInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    CommunityMapFilter: typeof CommunityMapFilter
  }
}
