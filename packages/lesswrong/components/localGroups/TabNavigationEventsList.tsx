import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../lib/reactRouterWrapper';
import { createStyles } from '@material-ui/core/styles'
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { truncate } from '../../lib/editor/ellipsize';
import classNames from 'classnames';

const YESTERDAY_STRING = "[Yesterday]"
const TODAY_STRING = "[Today]"
const TOMORROW_STRING = "[Tomorrow]"
const HIGHLIGHT_LENGTH = 600

const styles = createStyles((theme: ThemeType): JssStyles => ({
  subItemOverride: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    }
  },
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
    ...theme.typography.tinyText,
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
  },
  event: {
    textOverflow: "ellipsis",
  }
}))


const TabNavigationEventsList = ({ terms, onClick, classes }: {
  terms: PostsViewTerms,
  onClick: ()=>void,
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone();
  const { results } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsList',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  });
  const { TabNavigationSubItem, EventTime, LWTooltip } = Components

  if (!results) return null

  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Case to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  return (
    <div>
      {results.map((event) => {

        const startTime = event.startTime && moment(event.startTime).tz(timezone)

        const displayTime = startTime ? startTime.calendar(undefined, {
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
            <div className={classes.tooltipLogisticsTitle}>
             {event.onlineEvent ? "Onlne Event" : "Location"}
            </div>
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
          <LWTooltip key={event._id} placement="right-start" title={tooltip}>
            <MenuItemUntyped
              onClick={onClick}
              component={Link} to={postGetPageUrl(event)}
              classes={{root: classes.subItemOverride}}
            >
              <TabNavigationSubItem className={classes.event}>
                {(displayTime && displayTime !== " ") && <span className={classNames(
                    classes.displayTime, {[classes.yesterday]: displayTime === YESTERDAY_STRING})
                  }>
                    {displayTime}
                </span>} 
                <span className={classes.title}>{event.title}</span>
              </TabNavigationSubItem>
            </MenuItemUntyped>
          </LWTooltip>
        )
      })}
    </div>
  )
}

const TabNavigationEventsListComponent = registerComponent('TabNavigationEventsList', TabNavigationEventsList, {
  styles,
});

declare global {
  interface ComponentTypes {
    TabNavigationEventsList: typeof TabNavigationEventsListComponent
  }
}
