'use client';

import React, { useCallback, useState } from "react";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import moment from "moment";
import { HIDE_FUNDRAISER_BANNER_COOKIE } from "@/lib/cookies/cookies";
import ForumIcon from "./ForumIcon";
import { useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "@/lib/reactRouterWrapper";
import classNames from "classnames";

const FUNDRAISER_LINK = "https://www.every.org/lightcone-infrastructure/f/2026-fundraiser";
const FUNDRAISER_GOAL = 2_000_000;

const BANNER_ART_URL = "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1764741742/habryka_Art_nouveau_cityscape_sci-fi_victorian_solarpunk_citysc_efcc5189-1666-4dd3-b487-2bdaae4cddb2_e86mhl.png";

const styles = defineStyles("FundraiserBanner", (theme: ThemeType) => ({
  root: {
    display: "block",
    position: "relative",
    height: 34,
    overflow: "hidden",
    textDecoration: "none",
    cursor: "pointer",
    opacity: 1,
    "&:hover": {
      textDecoration: "none",
      opacity: 1,
    },
    [theme.breakpoints.down("sm")]: {
      height: 32,
    },
  },
  rootHoverable: {
    "&:hover $overlay": {
      background: `linear-gradient(90deg, ${theme.palette.greyAlpha(0.4)} 0%, ${theme.palette.greyAlpha(0.15)} 60%, ${theme.palette.greyAlpha(0.3)} 100%)`,
    },
    "&:hover $backgroundImage": {
      filter: "brightness(0.9)",
    },
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${BANNER_ART_URL})`,
    backgroundSize: "cover",
    backgroundPosition: "center 40%",
    filter: "brightness(0.8)",
    transition: "filter 0.2s ease",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(90deg, ${theme.palette.greyAlpha(0.5)} 0%, ${theme.palette.greyAlpha(0.25)} 60%, ${theme.palette.greyAlpha(0.4)} 100%)`,
    transition: "background 0.2s ease",
  },
  content: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    padding: "0 28px",
    [theme.breakpoints.down("sm")]: {
      padding: "0 16px",
    },
  },
  leftSection: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    [theme.breakpoints.down("sm")]: {
      gap: 6,
    },
  },
  title: {
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    textShadow: `0 1px 3px ${theme.palette.greyAlpha(0.6)}`,
    [theme.breakpoints.down("sm")]: {
      fontSize: 12,
    },
  },
  goalText: {
    color: `color-mix(in srgb, ${theme.palette.text.alwaysWhite} 92%, transparent)`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 12,
    fontWeight: 400,
    textShadow: `0 1px 3px ${theme.palette.greyAlpha(0.6)}`,
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  ctaButton: {
    color: theme.palette.text.alwaysWhite,
    padding: "3px 10px",
    borderRadius: 3,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    textDecoration: "none",
    textShadow: `0 1px 2px ${theme.palette.greyAlpha(0.4)}`,
    background: theme.palette.inverseGreyAlpha(0.15),
    border: `1px solid ${theme.palette.inverseGreyAlpha(0.25)}`,
    transition: "background 0.15s ease, border-color 0.15s ease",
    "&:hover": {
      background: theme.palette.inverseGreyAlpha(0.25),
      borderColor: theme.palette.inverseGreyAlpha(0.4),
    },
    [theme.breakpoints.down("sm")]: {
      padding: "2px 8px",
      fontSize: 11,
    },
  },
  close: {
    cursor: "pointer",
    color: theme.palette.inverseGreyAlpha(0.6),
    fontSize: 16,
    padding: 2,
    borderRadius: 3,
    transition: "color 0.15s ease, background 0.15s ease",
    "&:hover": {
      color: theme.palette.inverseGreyAlpha(0.9),
      background: theme.palette.inverseGreyAlpha(0.1),
    },
  },
}));

const FundraiserBanner = () => {
  const classes = useStyles(styles);
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_FUNDRAISER_BANNER_COOKIE]);
  const { captureEvent } = useTracking();
  const [hoveringInteractive, setHoveringInteractive] = useState(false);

  const hideBanner = useCallback(() => {
    setCookie(HIDE_FUNDRAISER_BANNER_COOKIE, "true", {
      expires: moment().add(6, "months").toDate(),
      path: "/",
    });
  }, [setCookie]);

  const onDismissBanner = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hideBanner();
    captureEvent("fundraiser_banner_dismissed");
  }, [hideBanner, captureEvent]);

  const onClickBanner = useCallback(() => {
    captureEvent("fundraiser_banner_clicked");
  }, [captureEvent]);

  if (cookies[HIDE_FUNDRAISER_BANNER_COOKIE] === "true") {
    return null;
  }

  const formattedGoal = `$${(FUNDRAISER_GOAL / 1_000_000).toFixed(0)}M`;

  return (
    <Link 
      to={FUNDRAISER_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClickBanner}
      className={classNames(classes.root, {
        [classes.rootHoverable]: !hoveringInteractive,
      })}
    >
      <div className={classes.backgroundImage} />
      <div className={classes.overlay} />
      <div className={classes.content}>
        <div className={classes.leftSection}>
          <span className={classes.title}>
            LessWrong & Lighthaven are fundraising for 2026
          </span>
          <span className={classes.goalText}>
            – our goal is to raise {formattedGoal} for the next year
          </span>
        </div>

        <div 
          className={classes.rightSection}
          onMouseEnter={() => setHoveringInteractive(true)}
          onMouseLeave={() => setHoveringInteractive(false)}
        >
          <span className={classes.ctaButton}>
            Donate
          </span>
          <ForumIcon
            icon="Close"
            onClick={onDismissBanner}
            className={classes.close}
          />
        </div>
      </div>
    </Link>
  );
};

export default FundraiserBanner;
