import React from 'react';
import { registerComponent, Components, withList } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles'
import moment from 'moment';
import withTimezone from '../common/withTimezone';

const styles = theme => ({
  displayTime: {
    marginRight: theme.spacing.unit,
    fontSize: ".85rem",
    position: "relative",
    top: -1,
    color: "rgba(0,0,0,.92)",
  },
  tooltipTitle: {
    fontWeight: 600,
  },
  tooltipLogisticsTitle: {
    fontSize: ".75rem",
    fontStyle: "italic",
    marginTop: theme.spacing.unit
  }
})


const TabNavigationEventsList = ({ results, classes, loading, timezone}) => {
  const { Loading, TabNavigationSubItem, EventTime } = Components

  if (!results && loading) return <Loading />

  return (
    <div>
      {results.map((event) => {

        let displayTime = ""
        const startTime = moment(event.startTime).tz(timezone)
        const tomorrow = moment().add(2, 'day').tz(timezone).toDate()
        const yesterday = moment().subtract(2, 'day').tz(timezone).toDate()

        if ((startTime.toDate() > yesterday) && (startTime.toDate() < tomorrow)) {
          displayTime = startTime.calendar().split(" ")[0]
        }

        const tooltip = <div>
            <div className={classes.tooltipTitle}>{event.title}</div>
            <div className={classes.tooltipLogisticsTitle}>Location</div>
            <div>{event.location}</div>
            <div className={classes.tooltipLogisticsTitle}>Time</div>
            <div className={classes.startTime}>
              {event.startTime
                ? <EventTime post={event} />
                : <span>Start time TBD</span>}
            </div>
          </div>

        return (
          <Tooltip key={event._id} placement="right-start" title={tooltip}>
            <Link to={Posts.getPageUrl(event)}>
              <TabNavigationSubItem>
                {displayTime && <span className={classes.displayTime}>{displayTime}</span> }
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
