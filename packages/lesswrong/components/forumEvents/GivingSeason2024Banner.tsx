import React, { ReactNode, useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import moment, { Moment } from "moment";
import { Link } from "@/lib/reactRouterWrapper";
import classNames from "classnames";

type Event = {
  name: string,
  description: ReactNode,
  start: Moment,
  end: Moment,
}

const events: Event[] = [
  {
    name: "Funding Diversification Week",
    description: <>This week, we are encouraging content around a range of important funding considerations. <Link to="#">Read more</Link>.</>,
    start: moment("2024-11-04").utc(),
    end: moment("2024-11-10").utc(),
  },
  {
    name: "Marginal Funding Week",
    description: <>Here is a description of what Marginal Funding Week is and how to engage with it. Probably also a <Link to="#">link to the posts</Link>.</>,
    start: moment("2024-11-12").utc(),
    end: moment("2024-11-18").utc(),
  },
  {
    name: "Donation Election",
    description: <>A crowd-sourced pot of funds will be distributed amongst three charities based on your votes. <Link to="#">Find out more</Link>.</>,
    start: moment("2024-11-18").utc(),
    end: moment("2024-12-03").utc(),
  },
  {
    name: "Pledge Highlight",
    description: <>A week to post about your experience with pledging, and to discuss the value of pledging. <Link to="#">Read more</Link>.</>,
    start: moment("2024-12-16").utc(),
    end: moment("2024-12-22").utc(),
  },
  {
    name: "Donation Celebration",
    description: <>When the donation celebration starts, you’ll be able to add a heart to the banner showing that you’ve done your annual donations.</>,
    start: moment("2024-12-23").utc(),
    end: moment("2024-12-31").utc(),
  },
];

const DOT_SIZE = 12;

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    paddingBottom: 40,
    marginBottom: 24,
    background: "#440000",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
  },
  timeline: {
    position: "relative",
    zIndex: theme.zIndexes.header + 1,
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 50,
  },
  timelineEvent: {
    position: "relative",
    cursor: "pointer",
    fontWeight: 400,
    opacity: 0.6,
    margin: 12,
    "&:first-child": {
      marginLeft: 0,
    },
    "&:last-child": {
      marginRight: 0,
    },
  },
  timelineEventSelected: {
    fontWeight: 600,
    opacity: 1,
  },
  timelineDot: {
    position: "absolute",
    top: -18,
    left: `calc(50% - ${DOT_SIZE / 2}px)`,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: "50%",
    background: theme.palette.text.alwaysWhite,
  },
  eventDate: {
    maxWidth: 470,
    marginBottom: 8,
  },
  eventName: {
    maxWidth: 640,
    fontSize: 40,
    fontWeight: 600,
    marginBottom: 12,
  },
  eventDescription: {
    maxWidth: 470,
    "& a": {
      textDecoration: "underline",
    },
  },
});

const GivingSeason2024Banner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [selectedEvent, setSelectedEvent] = useState(events[0]);

  const {name, description, start, end} = selectedEvent;
  const endFormat = start.month() === end.month() ? "D" : "MMM D";
  const date = `${start.format("MMM D")} - ${end.format(endFormat)}`;

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <div className={classes.timeline}>
          {events.map((event) => (
            <div
              key={event.name}
              onClick={setSelectedEvent.bind(null, event)}
              className={classNames(
                classes.timelineEvent,
                selectedEvent === event && classes.timelineEventSelected,
              )}
            >
              {event.name}
              <div className={classes.timelineDot} />
            </div>
          ))}
        </div>
        <div>
          <div className={classes.eventDate}>{date}</div>
          <div className={classes.eventName}>{name}</div>
          <div className={classes.eventDescription}>{description}</div>
        </div>
      </div>
    </div>
  );
}

const GivingSeason2024BannerComponent = registerComponent(
  "GivingSeason2024Banner",
  GivingSeason2024Banner,
  {styles},
);

declare global {
  interface ComponentTypes {
    GivingSeason2024Banner: typeof GivingSeason2024BannerComponent
  }
}
