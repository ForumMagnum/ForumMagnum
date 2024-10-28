import React, { ReactNode, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import moment, { Moment } from "moment";
import classNames from "classnames";

type Event = {
  name: string,
  description: ReactNode,
  start: Moment,
  end: Moment,
  background: string,
  darkText?: boolean,
}

const events: Event[] = [
  {
    name: "Funding Diversification Week",
    description: <>This week, we are encouraging content around a range of important funding considerations. <Link to="#">Read more</Link>.</>,
    start: moment("2024-11-04").utc(),
    end: moment("2024-11-10").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143995/Rectangle_5034.jpg",
  },
  {
    name: "Marginal Funding Week",
    description: <>Here is a description of what Marginal Funding Week is and how to engage with it. Probably also a <Link to="#">link to the posts</Link>.</>,
    start: moment("2024-11-12").utc(),
    end: moment("2024-11-18").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5064.jpg",
  },
  {
    name: "Donation Election",
    description: <>A crowd-sourced pot of funds will be distributed amongst three charities based on your votes. <Link to="#">Find out more</Link>.</>,
    start: moment("2024-11-18").utc(),
    end: moment("2024-12-03").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5069.jpg",
  },
  {
    name: "Pledge Highlight",
    description: <>A week to post about your experience with pledging, and to discuss the value of pledging. <Link to="#">Read more</Link>.</>,
    start: moment("2024-12-16").utc(),
    end: moment("2024-12-22").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5072.jpg",
  },
  {
    name: "Donation Celebration",
    description: <>When the donation celebration starts, you’ll be able to add a heart to the banner showing that you’ve done your annual donations.</>,
    start: moment("2024-12-23").utc(),
    end: moment("2024-12-31").utc(),
    background: "https://res.cloudinary.com/cea/image/upload/v1730143996/Rectangle_5075.jpg",
    darkText: true,
  },
];

const DOT_SIZE = 12;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    paddingBottom: 40,
    marginBottom: 24,
  },
  backgrounds: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
    background: theme.palette.text.alwaysWhite,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    transition: "opacity 0.5s ease",
  },
  backgroundActive: {
    opacity: 1,
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    transition: "color 0.5s ease",
  },
  darkText: {
    color: theme.palette.givingSeason.primary,
    "& $timelineDot": {
      background: theme.palette.givingSeason.primary,
    },
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
    width: 200,
    textAlign: "center",
    whiteSpace: "nowrap",
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
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
});

const GivingSeason2024Banner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [selectedEvent, setSelectedEvent] = useState(events[0]);

  const {name, description, start, end, darkText} = selectedEvent;
  const endFormat = start.month() === end.month() ? "D" : "MMM D";
  const date = `${start.format("MMM D")} - ${end.format(endFormat)}`;

  return (
    <div className={classes.root}>
      <div className={classes.backgrounds}>
        {events.map(({name, background}) => (
          <div
            key={name}
            style={{background: `url(${background})`}}
            className={classNames(
              classes.background,
              name === selectedEvent.name && classes.backgroundActive,
            )}
          />
        ))}
      </div>
      <div className={classNames(classes.content, darkText && classes.darkText)}>
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
              {selectedEvent === event &&
                <div className={classes.timelineDot} />
              }
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
