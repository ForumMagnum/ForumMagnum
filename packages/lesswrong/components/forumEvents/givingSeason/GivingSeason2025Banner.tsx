import React, { CSSProperties, FC, MouseEvent, useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { AnalyticsContext, useTracking } from "@/lib/analyticsEvents";
import { formatStat } from "@/components/users/EAUserTooltipContent";
import { HEADER_HEIGHT } from "@/components/common/Header";
import { Link } from "@/lib/reactRouterWrapper";
import { useNavigate } from "@/lib/routeUtil";
import {
  ELECTION_DONATE_HREF,
  ELECTION_INFO_HREF,
  givingSeasonEvents,
  useGivingSeason,
} from "@/lib/givingSeason";
import classNames from "classnames";
import moment from "moment";

const styles = defineStyles("GivingSeason2025Banner", (theme: ThemeType) => ({
  root: {
    marginTop: -HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
    fontFamily: theme.palette.fonts.sansSerifStack,
    background: theme.palette.text.alwaysBlack,
    width: "100%",
    borderBottom: `1px solid ${theme.palette.text.alwaysBlack}`,
  },
  main: {
    padding: "20px 80px 40px 80px",
    display: "grid",
    gridTemplateColumns: "400px 1fr",
    gap: "40px",
    color: "var(--event-color)",
    transition: "color ease 0.2s",
  },
  events: {
    display: "grid",
    gridTemplateColumns: "min-content 1fr",
    alignItems: "center",
    gap: "12px",
  },
  event: {
    cursor: "pointer",
    transition: "opacity ease 0.2s",
    display: "contents",
  },
  eventNotSelected: {
    "& > *": {
      opacity: 0.6,
    },
  },
  eventDate: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: "100%",
    letterSpacing: "4%",
    whiteSpace: "nowrap",
  },
  eventTitle: {
    fontSize: 33,
    fontWeight: 600,
    lineHeight: "115%",
    letterSpacing: "-5%",
  },
  eventDescription: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "140%",
    letterSpacing: "0%",
    marginTop: -6,
  },
  readMore: {
    textDecoration: "underline",
    "&:hover": {
      opacity: 1,
      textDecoration: "none",
    },
  },
  election: {
    backgroundColor: "var(--event-color)",
    transition: "background-color ease 0.2s",
    color: theme.palette.text.alwaysBlack,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "16px 50px",
  },
  amountRaised: {
    fontSize: 19,
    fontWeight: 700,
    lineHeight: "140%",
    letterSpacing: "-3%",
    "& span": {
      opacity: 0.4,
    },
  },
  progress: {
    position: "relative",
    width: 480,
    height: 12,
    borderRadius: 100,
    overflow: "hidden",
  },
  progressBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: theme.palette.text.alwaysBlack,
    opacity: 0.1,
    zIndex: 1,
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: theme.palette.text.alwaysBlack,
    zIndex: 2,
  },
  electionButtons: {
    position: "absolute",
    top: 0,
    right: 50,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    height: "100%",
    "& button": {
      cursor: "pointer",
      height: 38,
      padding: "12px 24px",
      outline: "none",
      borderRadius: theme.borderRadius.default,
      fontSize: 14,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${theme.palette.text.alwaysBlack}`,
      transition: "background-color ease 0.2, color ease 0.2s",
    },
  },
  buttonOutlined: {
    backgroundColor: "transparent",
    color: theme.palette.text.alwaysBlack,
    "&:hover": {
      backgroundColor: theme.palette.text.alwaysBlack,
      color: theme.palette.text.alwaysWhite,
    },
  },
  buttonFilled: {
    backgroundColor: theme.palette.text.alwaysBlack,
    color: theme.palette.text.alwaysWhite,
    "&:hover": {
      backgroundColor: "transparent",
      color: theme.palette.text.alwaysBlack,
    },
  },
}))

export const GivingSeason2025Banner: FC = () => {
  const {captureEvent} = useTracking();
  const navigate = useNavigate();
  const {
    currentEvent,
    selectedEvent,
    setSelectedEvent,
    amountRaised,
    amountTarget,
  } = useGivingSeason();

  const onButtonClick = useCallback((
    eventName: string,
    href: string,
    ev: MouseEvent<HTMLButtonElement>,
  ) => {
    ev.preventDefault();
    captureEvent(eventName, {href});
    navigate(href);
  }, [captureEvent, navigate]);

  const classes = useStyles(styles);
  if (!currentEvent) {
    return null;
  }
  return (
    <AnalyticsContext pageSectionContext="GivingSeason2025Banner">
      <div
        style={{"--event-color": selectedEvent.color} as CSSProperties}
        className={classes.root}
      >
        <div className={classes.main}>
          <div className={classes.events}>
            {givingSeasonEvents.map((event) => (
              <div
                key={event.name}
                role="button"
                onClick={setSelectedEvent.bind(null, event)}
                className={classNames(
                  classes.event,
                  event !== selectedEvent && classes.eventNotSelected,
                )}
              >
                <div className={classes.eventDate}>
                  {moment(event.start).format("MMM D")}
                </div>
                <div className={classes.eventTitle}>
                  {event.name}
                </div>
                {event === selectedEvent && (
                  <>
                    <div />
                    <div className={classes.eventDescription}>
                      {event.description}{" "}
                      {event.readMoreHref && (
                        <Link to={event.readMoreHref} className={classes.readMore}>
                          Read more.
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div>
          </div>
        </div>
        <div className={classes.election}>
          <div className={classes.amountRaised}>
            ${formatStat(amountRaised)} raised{" "}
            <span>to the Donation Election Fund</span>
          </div>
          <div className={classes.progress} aria-hidden>
            <div className={classes.progressBackground} />
            <div
              style={{width: `${amountRaised / amountTarget * 100}%`}}
              className={classes.progressBar}
            />
          </div>
          <div className={classes.electionButtons}>
            <button
              onClick={onButtonClick.bind(null, "learnMore", ELECTION_INFO_HREF)}
              className={classes.buttonOutlined}
            >
              Learn more
            </button>
            <button
              onClick={onButtonClick.bind(null, "donate", ELECTION_DONATE_HREF)}
              className={classes.buttonFilled}
            >
              Donate
            </button>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
}

export default registerComponent("GivingSeason2025Banner", GivingSeason2025Banner);
