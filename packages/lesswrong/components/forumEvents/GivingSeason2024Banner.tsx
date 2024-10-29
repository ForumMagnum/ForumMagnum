import React, { useCallback, useEffect, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { Link } from "@/lib/reactRouterWrapper";
import { formatStat } from "../users/EAUserTooltipContent";
import { useGivingSeasonEvents } from "./useGivingSeasonEvents";
import classNames from "classnames";
import type { Moment } from "moment";

const DOT_SIZE = 12;

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
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
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundBlendMode: "darken",
  },
  backgroundActive: {
    opacity: 1,
  },
  darkText: {
    color: theme.palette.givingSeason.primary,
    "& $line, & $timelineDot": {
      background: theme.palette.givingSeason.primary,
    },
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    transition: "color 0.5s ease",
  },
  line: {
    width: "100%",
    height: 1,
    opacity: 0.6,
    background: theme.palette.text.alwaysWhite,
    transition: "background 0.5s ease",
  },
  timeline: {
    display: "flex",
    justifyContent: "space-between",
  },
  timelineEvent: {
    cursor: "pointer",
    position: "relative",
    zIndex: theme.zIndexes.header + 1,
    margin: "12px 0",
    fontWeight: 400,
    whiteSpace: "nowrap",
    userSelect: "none",
    opacity: 0.6,
    transition: "opacity 0.5s ease",
    // Use `after` to overlay the same text but with the higher font weight as
    // if it's selected, even if it's not. This means that the size of each
    // title won't change when they switch between active/inactive.
    "&:after": {
      display: "block",
      content: "attr(data-title)",
      fontWeight: 600,
      height: 1,
      color: "transparent",
      overflow: "hidden",
      visibility: "hidden",
    },
  },
  timelineEventSelected: {
    fontWeight: 600,
    opacity: 1,
  },
  timelineDot: {
    position: "absolute",
    top: -18.5,
    left: `calc(50% - ${DOT_SIZE / 2}px)`,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: "50%",
    background: theme.palette.text.alwaysWhite,
    transition: "background 0.5s ease",
  },
  mainContainer: {
    display: "flex",
  },
  detailsContainer: {
    whiteSpace: "nowrap",
    overflowX: "scroll",
    scrollSnapType: "x mandatory",
    scrollbarWidth: "none",
    "-ms-overflow-style": "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  eventDetails: {
    display: "inline-block",
    width: "100%",
    scrollSnapAlign: "start",
    paddingTop: 24,
    paddingBottom: 40,
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
    whiteSpace: "wrap",
  },
  eventDescription: {
    maxWidth: 470,
    lineHeight: "140%",
    whiteSpace: "wrap",
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  fund: {
    width: 260,
    minWidth: 260,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    background: theme.palette.givingSeason.electionFundBackground,
    borderRadius: theme.borderRadius.default,
  },
  fundTitle: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.18px",
    marginBottom: 12,
  },
  fundInfo: {
    marginBottom: 16,
    lineHeight: "140%",
    whiteSpace: "wrap",
    "& a": {
      textDecoration: "underline",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  fundBarContainer: {
    width: "100%",
    height: 12,
    marginBottom: 8,
    background: theme.palette.givingSeason.electionFundBackground,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
  },
  fundBar: {
    height: "100%",
    background: theme.palette.text.alwaysWhite,
  },
  fundRaised: {
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "140%",
    textAlign: "center",
  },
  fundAmount: {
    fontWeight: 700,
  },
});

const formatDate = (start: Moment, end: Moment) => {
  const endFormat = start.month() === end.month() ? "D" : "MMM D";
  return `${start.format("MMM D")} - ${end.format(endFormat)}`;
}

const GivingSeason2024Banner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {
    events,
    currentEvent,
    selectedEvent,
    setSelectedEvent,
    amountRaised,
    amountTarget,
  } = useGivingSeasonEvents();
  const [detailsRef, setDetailsRef] = useState<HTMLDivElement | null>(null);

  const fundPercent = Math.round((amountRaised / amountTarget) * 100);

  useEffect(() => {
    if (!detailsRef) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = parseInt(entry.target.getAttribute("data-event-id") ?? "");
          if (Number.isSafeInteger(id) && events[id]) {
            setSelectedEvent(events[id]);
          }
        }
      }
    }, {threshold: 0.5});
    for (const child of Array.from(detailsRef.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [detailsRef, events, setSelectedEvent]);

  const onClickTimeline = useCallback((index: number) => {
    detailsRef?.querySelector(`[data-event-id="${index}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, [detailsRef]);

  return (
    <div className={classNames(
      classes.root,
      selectedEvent.darkText && classes.darkText,
    )}>
      <div className={classes.backgrounds}>
        {events.map(({name, background}) => (
          <div
            key={name}
            style={{backgroundImage: `url(${background})`}}
            className={classNames(
              classes.background,
              name === selectedEvent.name && classes.backgroundActive,
            )}
          />
        ))}
      </div>
      <div className={classes.line} />
      <div className={classes.content}>
        <div className={classes.timeline}>
          {events.map((event, i) => (
            <div
              key={event.name}
              data-event-id={i}
              data-title={event.name}
              onClick={onClickTimeline.bind(null, i)}
              className={classNames(
                classes.timelineEvent,
                selectedEvent === event && classes.timelineEventSelected,
              )}
            >
              {event.name}
              {event === currentEvent &&
                <div className={classes.timelineDot} />
              }
            </div>
          ))}
        </div>
        <div className={classes.mainContainer}>
          <div className={classes.detailsContainer} ref={setDetailsRef}>
            {events.map(({name, description, start, end}, i) => (
              <div className={classes.eventDetails} data-event-id={i} key={name}>
                <div className={classes.eventDate}>{formatDate(start, end)}</div>
                <div className={classes.eventName}>{name}</div>
                <div className={classes.eventDescription}>{description}</div>
              </div>
            ))}
          </div>
          <div className={classes.fund}>
            <div className={classes.fundTitle}>
              Donation Election Fund
            </div>
            <div className={classes.fundInfo}>
              Donate to the fund to boost the value of the Election.{" "}
              <Link to="#">Learn more</Link>.
            </div>
            <div className={classes.fundBarContainer}>
              <div
                style={{width: `${fundPercent}%`}}
                className={classes.fundBar}
              />
            </div>
            <div className={classes.fundRaised}>
              <span className={classes.fundAmount}>
                ${formatStat(amountRaised)}
              </span> raised
            </div>
          </div>
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
