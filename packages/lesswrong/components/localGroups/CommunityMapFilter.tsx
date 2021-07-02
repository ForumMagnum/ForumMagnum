import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import { withLocation, withNavigation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import { withMessages } from '../common/withMessages';
import { groupTypes } from '../../lib/collections/localgroups/groupTypes';
import classNames from 'classnames'
import Divider from '@material-ui/core/Divider';
import VisibilityIcon from '@material-ui/icons/VisibilityOff';
import EmailIcon from '@material-ui/icons/Email';
import AddIcon from '@material-ui/icons/Add';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../common/withDialog'
import withUser from '../common/withUser';
import { PersonSVG, ArrowSVG, GroupIconSVG } from './Icons'
import qs from 'qs'
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { userIsAdmin } from '../../lib/vulcan-users';

const availableFilters = _.map(groupTypes, t => t.shortName);

const styles = (theme: ThemeType): JssStyles => ({
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
    ...theme.typography.body2
  },
  checkedLabel: {
    color: 'white'
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
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  buttonIcon: {
    width: '1.2em',
    height: '1.2em'
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
    color: 'rgba(0,0,0,0.4)',
    cursor: "pointer",
  },
  addIcon: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  checkedVisibilityIcon: {
    color: 'rgba(0,0,0,0.87)'
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
    fill: 'rgba(0,0,0,0.3)'
  },
  bottomDivider: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  }
});

const createFallBackDialogHandler = (openDialog, dialogName, currentUser) => {
  return () => openDialog({
    componentName: currentUser ? dialogName : "LoginPopup",
  });
}

interface ExternalProps {
  setShowMap: any,
  showHideMap: boolean,
  toggleGroups: any,
  showGroups: boolean,
  toggleEvents: any,
  showEvents: boolean,
  toggleIndividuals: any,
  showIndividuals: boolean,
}
interface CommunityMapFilterProps extends ExternalProps, WithLocationProps, WithNavigationProps, WithDialogProps, WithUserProps, WithUpdateCurrentUserProps, WithMessagesProps, WithStylesProps {
}
interface CommunityMapFilterState {
  filters: any,
}

class CommunityMapFilter extends Component<CommunityMapFilterProps,CommunityMapFilterState> {
  constructor(props: CommunityMapFilterProps) {
    super(props);
    const { query } = this.props.location;
    const filters = query?.filters
    if (Array.isArray(filters)) {
      this.state = {filters: filters}
    } else if (typeof filters === "string") {
      this.state = {filters: [filters]}
    } else {
      this.state = {filters: []}
    }
  }

  handleCheck = (filter) => {
    const { location, history } = this.props
    let newFilters: Array<any> = [];
    if (Array.isArray(this.state.filters) && this.state.filters.includes(filter)) {
      newFilters = _.without(this.state.filters, filter);
    } else {
      newFilters = [...this.state.filters, filter];
    }
    this.setState({filters: newFilters});
    // FIXME: qs.stringify doesn't handle array parameters in the way react-router-v3
    // did, which causes awkward-looking and backwards-incompatible (but not broken) URLs.
    history.replace({...location.location, search: qs.stringify({filters: newFilters})})
  }

  handleHideMap = () => {
    const { currentUser, updateCurrentUser, flash, setShowMap } = this.props
    let undoAction
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
  }

  
  render() {
    const { classes, openDialog, currentUser, showHideMap, toggleGroups, showGroups, toggleEvents, showEvents, toggleIndividuals, showIndividuals, history } = this.props;
  
    const isEAForum = forumTypeSetting.get() === 'EAForum';

    const isAdmin = userIsAdmin(currentUser);

    return <Paper>
        {!isEAForum && <div className={classes.filters}>
          {availableFilters.map((value, i) => {
            const checked = this.state.filters.includes(value)
            return <span 
              className={classNames(classes.filter, {[classes.filterChecked]: checked, [classes.firstFilter]: i === 0, [classes.lastFilter]: i === (availableFilters.length - 1)})} 
              key={value} 
              onClick={() => this.handleCheck(value)}
            >
              <span className={classNames(classes.checkboxLabel, {[classes.checkedLabel]: checked})}>
                {value}
              </span>
            </span>
          })}
        </div>}
        <Divider className={classNames(classes.divider, classes.topDivider)} />
        <div className={classes.actions}>
          <div 
            className={classes.filterSection} 
          >
            <span className={classes.desktopFilter}>
              <GroupIconSVG className={classes.buttonIcon} /> 
            </span>
            <span className={classNames(classes.mobileFilter, {[classes.mobileFilterActive]: !showGroups})} onClick={toggleGroups}>
              <GroupIconSVG className={classes.buttonIcon} /> 
            </span>
            <span className={classes.buttonText}>Groups</span>
            <span className={classes.actionContainer}>
              {(!isEAForum || isAdmin) && <Tooltip title="Create New Group">
                <AddIcon className={classNames(classes.actionIcon, classes.addIcon)} onClick={createFallBackDialogHandler(openDialog, "GroupFormDialog", currentUser)} />
              </ Tooltip>}
              <Tooltip title="Hide groups from map">
                <VisibilityIcon 
                  onClick={toggleGroups}
                  className={classNames(classes.actionIcon, classes.visibilityIcon, {[classes.checkedVisibilityIcon]: !showGroups})} 
                />
              </Tooltip>
              
            </span>
          </div>
          <div 
            className={classes.filterSection}
            
          >
            <span className={classes.desktopFilter}>
              <ArrowSVG className={classes.buttonIcon} /> 
            </span>
            <span className={classNames(classes.mobileFilter, {[classes.mobileFilterActive]: !showEvents})} onClick={toggleEvents}>
              <ArrowSVG className={classes.buttonIcon} /> 
            </span>
            <span className={classes.buttonText}> Events </span>
            <span className={classes.actionContainer}>
              {(!isEAForum || isAdmin) && <Tooltip title="Create New Event">
                <AddIcon className={classNames(classes.actionIcon, classes.addIcon)} onClick={() => history.push({ pathname: '/newPost', search: `?eventForm=true`})}/>
              </Tooltip>}
              <Tooltip title="Hide events from map">
                <VisibilityIcon 
                  onClick={toggleEvents}
                  className={classNames(classes.actionIcon, classes.visibilityIcon, {[classes.checkedVisibilityIcon]: !showEvents})} 
                />
              </Tooltip>
              
            </span>
          </div>
          {!isEAForum && <div
            className={classes.filterSection}
          >
            <span className={classes.desktopFilter}>
              <PersonSVG className={classes.buttonIcon} /> 
            </span>
            <span className={classNames(classes.mobileFilter, {[classes.mobileFilterActive]: !showIndividuals})} onClick={toggleIndividuals}>
              <PersonSVG className={classes.buttonIcon} /> 
            </span>
            <span className={classes.buttonText}> Individuals </span>
            <span className={classes.actionContainer}>
              <Tooltip title="Add your location to the map">
                <AddIcon className={classNames(classes.actionIcon, classes.addIcon)} onClick={createFallBackDialogHandler(openDialog, "SetPersonalMapLocationDialog", currentUser)}/>
              </Tooltip>
              <Tooltip title="Hide individual user locations from map">
                <VisibilityIcon 
                  onClick={toggleIndividuals}
                  className={classNames(classes.actionIcon, classes.visibilityIcon, {[classes.checkedVisibilityIcon]: !showIndividuals})} 
                />
              </Tooltip>
            </span>
          </div>}
        </div>
        <Divider className={classNames(classes.divider, classes.bottomDivider)} />
        <div
            className={classNames(classes.filterSection, classes.subscribeSection)}
            onClick={createFallBackDialogHandler(openDialog, "EventNotificationsDialog", currentUser)}
          >
          <EmailIcon className={classNames(classes.actionIcon, classes.subscribeIcon)} /> 
          <span className={classes.buttonText}> Subscribe to events</span>
        </div>
        {showHideMap && <span>
            <Tooltip title="Hide the map from the frontpage">
              <div className={classNames(classes.filterSection, classes.hideSection)}>
                {/* <CloseIcon className={classes.buttonIcon} />  */}
                <span className={classNames(classes.buttonText, classes.hideText)} onClick={this.handleHideMap}> 
                  Hide Map 
                </span>
              </div>
            </Tooltip>
          </span>}
      </Paper>
  }
}

const CommunityMapFilterComponent = registerComponent<ExternalProps>('CommunityMapFilter', CommunityMapFilter, {
  styles,
  hocs: [
    withLocation, withNavigation,
    withDialog,
    withUser,
    withUpdateCurrentUser,
    withMessages
  ]
});

declare global {
  interface ComponentTypes {
    CommunityMapFilter: typeof CommunityMapFilterComponent
  }
}

