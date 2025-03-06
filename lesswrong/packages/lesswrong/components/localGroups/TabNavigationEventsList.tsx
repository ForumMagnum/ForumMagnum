import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { truncate } from '../../lib/editor/ellipsize';
import { twoLineEventsSidebarABTest } from '../../lib/abTests';
import { useABTest } from '../../lib/abTestImpl';
import classNames from 'classnames';
import LWTooltip from "@/components/common/LWTooltip";
import TabNavigationSubItem from "@/components/common/TabNavigationMenu/TabNavigationSubItem";
import { MenuItemLink } from "@/components/common/Menus";
import TimeTag from "@/components/common/TimeTag";
import FormatDate from "@/components/common/FormatDate";
import EventTime from "@/components/localGroups/EventTime";

const YESTERDAY_STRING = "[Yesterday]"
const TODAY_STRING = "[Today]"
const TOMORROW_STRING = "[Tomorrow]"
const HIGHLIGHT_LENGTH = 600

const styles = (theme: ThemeType) => ({
  eventWrapper: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    }
  },
  twoLine: {
    height: "auto",
  },
  city: {
    marginLeft: 6,
  },
  date: {
    marginRight: 6,
  },
  displayTime: {
    fontSize: ".85rem",
    position: "relative",
    top: -1,
    color: theme.palette.text.slightlyIntense,
    marginRight: theme.spacing.unit,
  },
  yesterday: {
    color: "unset"
  },
  tooltipGroup: {
    ...theme.typography.tinyText
  },
  tooltipTitle: {
    fontWeight: 600,
  },
  tooltipLogisticsTitle: {
    ...theme.typography.tinyText,
    ...theme.typography.italic,
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
    borderTop: theme.palette.border.tooltipHR,
    width: 25,
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2
  },
  event: {
    textOverflow: "ellipsis",
  },
  twoLineEvent: {
    lineHeight: "1.3rem !important",
  },
  dot: {
    color: theme.palette.grey[500]
  }
});

const TabNavigationEventsList = ({ terms, onClick, classes }: {
  terms: PostsViewTerms,
  onClick: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { results } = useMulti({
    terms,
    collectionName: "Posts",
    fragmentName: 'PostsList',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  });

  const abTestGroup = useABTest(twoLineEventsSidebarABTest);
  const EventComponent = (abTestGroup === "expanded") ? TabNavigationEventTwoLines : TabNavigationEventSingleLine;
  if (!results) return null
  
  return <div>
    {results.map((event) =>
      <LWTooltip
        key={event._id}
        placement="right-start"
        title={<EventSidebarTooltip event={event} classes={classes}/>}
      >
        <EventComponent
          event={event}
          onClick={onClick}
          classes={classes}
        />
      </LWTooltip>)}
  </div>
}

const TabNavigationEventSingleLine = ({event, onClick, classes}: {
  event: PostsList,
  onClick: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { timezone } = useTimezone();
  const startTime = event.startTime && moment(event.startTime).tz(timezone)

  const displayTime = startTime ? startTime.calendar(undefined, {
    sameDay: `[${TODAY_STRING}]`,
    nextDay: `[${TOMORROW_STRING}]`,
    nextWeek: ' ',
    lastDay: `[${YESTERDAY_STRING}]`,
    lastWeek: ' ',
    sameElse: ' ',
  }) : ' '

  return <MenuItemLink
    onClick={onClick}
    to={postGetPageUrl(event)}
    rootClass={classes.eventWrapper}
  >
    <TabNavigationSubItem className={classes.event}>
      {(event.startTime && displayTime && displayTime !== " ") && <TimeTag className={classNames(
        classes.displayTime, {[classes.yesterday]: displayTime === YESTERDAY_STRING})
      } dateTime={event.startTime}>
        {displayTime}
      </TimeTag>}
      <span>{event.title}</span>
    </TabNavigationSubItem>
  </MenuItemLink>
}

const TabNavigationEventTwoLines = ({event, onClick, classes}: {
  event: PostsList,
  onClick: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const cityName = event.onlineEvent ? "Online" : getCityName(event)
  
  return <MenuItemLink
    onClick={onClick}
    to={postGetPageUrl(event)}
    rootClass={classNames(classes.eventWrapper, classes.twoLine)}
  >
    <TabNavigationSubItem className={classNames(classes.event, classes.twoLineEvent)}>
      <span>{event.title}</span>
      <div/>
      <span>
        {event.startTime && <FormatDate className={classes.date} date={event.startTime} format={"ddd MMM D"} />}
        {cityName && <>
          <span className={classes.dot}>{"•"}</span>
          <span className={classes.city}>{cityName}</span>
        </>}
      </span>
    </TabNavigationSubItem>
  </MenuItemLink>
}

export function getCityName(event: PostsBase|PostsList): string|null {
  if (event.googleLocation) {
    const locationTypePreferenceOrdering = ["locality", "political", "country"];
    for (let locationType of locationTypePreferenceOrdering) {
      for (let addressComponent of event.googleLocation.address_components) {
        if (addressComponent.types.indexOf(locationType) >= 0)
          return addressComponent.long_name;
      }
    }
    return null;
  } else {
    return "Online";
  }
}

const EventSidebarTooltip = ({event, classes}: {
  event: PostsList,
  classes: ClassesType<typeof styles>,
}) => {
  const { htmlHighlight = "" } = event.contents || {}
  const highlight = truncate(htmlHighlight, HIGHLIGHT_LENGTH)
  return <div>
    {event.group && <div className={classes.tooltipGroup}>{event.group.name}</div>}
    <div className={classes.tooltipTitle}>{event.title}</div>
    <div className={classes.tooltipLogisticsTitle}>
      {event.onlineEvent ? "Online Event" : "Location"}
    </div>
    {!event.onlineEvent && <div>{event.location}</div>}
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
}

const TabNavigationEventsListComponent = registerComponent('TabNavigationEventsList', TabNavigationEventsList, {styles});

declare global {
  interface ComponentTypes {
    TabNavigationEventsList: typeof TabNavigationEventsListComponent
  }
}

export default TabNavigationEventsListComponent;
