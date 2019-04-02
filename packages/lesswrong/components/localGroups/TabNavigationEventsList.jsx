import React from 'react';
import { registerComponent, Components, withList } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles'
import moment from 'moment';
import withTimezone from '../common/withTimezone';
import { truncate } from '../../lib/editor/ellipsize';
import classNames from 'classnames';

const YESTERDAY_STRING = "[Yesterday]"
const TODAY_STRING = "[Today]"
const TOMORROW_STRING = "[Tomorrow]"
const HIGHLIGHT_LENGTH = 600

const styles = theme => ({
  displayTime: {
    fontSize: ".85rem",
    position: "relative",
    top: -1,
    color: "rgba(0,0,0,.92)",
    marginRight: theme.spacing.unit,
  },
  yesterday: {
    color: "unset"
  },
  tooltipTitle: {
    fontWeight: 600,
  },
  tooltipLogisticsTitle: {
    fontSize: ".75rem",
    fontStyle: "italic",
    marginTop: theme.spacing.unit
  },
  highlight: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2,
    fontSize: "1.1rem",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    '& img': {
      display:"none"
    },
    '& h1': {
      fontSize: "1.2rem"
    },
    '& h2': {
      fontSize: "1.2rem"
    },
    '& h3': {
      fontSize: "1.1rem"
    },
    '& hr': {
      display: "none"
    },
  },
  tooltipDivider: {
    borderTop: "solid 1px rgba(255,255,255,.2)",
    width: 25,
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2
  }
})


const TabNavigationEventsList = ({ results, classes, timezone}) => {
  const { TabNavigationSubItem, EventTime } = Components

  if (!results) return null

  return (
    <div>
      {results.map((event) => {

        const startTime = event.startTime && moment(event.startTime).tz(timezone)

        const displayTime = startTime ? startTime.calendar(null, {
          sameDay: `[${TODAY_STRING}]`,
          nextDay: `[${TOMORROW_STRING}]`,
          nextWeek: ' ',
          lastDay: `[${YESTERDAY_STRING}]`,
          lastWeek: ' ',
          sameElse: ' ',
        }) : ' '

        const { htmlHighlight = "" } = event.contents || {}

        const highlight = truncate(htmlHighlight, HIGHLIGHT_LENGTH)

        const tooltip = <div>
            <div className={classes.tooltipTitle}>{event.title}</div>
            <div className={classes.tooltipLogisticsTitle}>Location</div>
            <div>{event.location}</div>
            <div className={classes.tooltipLogisticsTitle}>Time</div>
            <div>
              {event.startTime
                ? <EventTime post={event} />
                : <span>Start time TBD</span>}
            </div>
            {highlight && <React.Fragment>
                <div className={classes.tooltipDivider} />
                <div className={classes.tooltipLogisticsTitle}>Description</div>
                <div dangerouslySetInnerHTML={{__html: highlight}} className={classes.highlight} />
              </React.Fragment>}
          </div>

        return (
          <Tooltip key={event._id} placement="right-start" title={tooltip}>
            <Link to={Posts.getPageUrl(event)}>
              <TabNavigationSubItem>
                {(displayTime && displayTime !== " ") && <span className={classNames(
                    classes.displayTime, {[classes.yesterday]: displayTime === YESTERDAY_STRING})
                  }>
                    {displayTime}
                </span>}
                <span className={classes.title}>{event.title}</span>
              </TabNavigationSubItem>
            </Link>
          </Tooltip>
        )
      })}
    </div>
  )
}

const options = {
  collection: Posts,
  queryName: 'postsListQuery',
  fragmentName: 'PostsList',
  enableTotal: false,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
  ssr: true
};

registerComponent('TabNavigationEventsList', TabNavigationEventsList, [withList, options], withStyles(styles, {name:"TabNavigationEventsList"}), withTimezone)
