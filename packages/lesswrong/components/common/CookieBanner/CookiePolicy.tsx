import React, { FC, PropsWithChildren } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { CENTRAL_COLUMN_WIDTH } from "../../posts/PostsPage/PostsPage";
import { useDialog } from "../withDialog";
import { CookiesTable } from "../../../lib/cookies/utils";

const PADDING = 15;

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing.unit * 3,
    "& .Typography-body1": {
      paddingBottom: PADDING,
      "& a": {
        color: theme.palette.primary.main,
      },
    },
  },
  bold: {
    fontWeight: "bold",
  },
  title: {
    textAlign: "center",
    fontSize: "2.2em",
    marginTop: 40,
  },
  lastUpdated: {
    fontWeight: "bold",
    fontSize: "1.2em",
    textAlign: "center",
    margin: 30 - PADDING,
    padding: PADDING,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  heading: {
    paddingTop: 20,
    fontWeight: "bold",
  },
  subheading: {
    textDecoration: "underline",
  },
  bullet: {
    marginRight: 15,
  },
  subbullet: {
    margin: "0 15px 0 25px",
  },
  cookiePreamble: {
    paddingBottom: "0px !important",
  },
  cookieTable: {
    "& .CookieTable-heading": {
      paddingBottom: "0 !important",
      marginTop: 10,
      marginBottom: 10,
    },
  },
});

const ExternalLink: FC<PropsWithChildren<{ href: string }>> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

const CookiePolicyInner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { Typography, CookieTable } = Components;
  const { openDialog } = useDialog();

  const uniqueNecessaryThirdParties = [
    ...new Set(
      Object.values(CookiesTable)
        .filter((cookie) => cookie.type === "necessary")
        .map((cookie) => cookie.thirdPartyName)
    ),
  ]
    .sort()
    .reverse();
  const uniqueFunctionalThirdParties = [
    ...new Set(
      Object.values(CookiesTable)
        .filter((cookie) => cookie.type === "functional")
        .map((cookie) => cookie.thirdPartyName)
    ),
  ]
    .sort()
    .reverse();
  const uniqueAnalyticsThirdParties = [
    ...new Set(
      Object.values(CookiesTable)
        .filter((cookie) => cookie.type === "analytics")
        .map((cookie) => cookie.thirdPartyName)
    ),
  ]
    .sort()
    .reverse();

  return (
    <div className={classes.root}>
      <Typography variant="display1" className={classes.title}>
        Cookie Notice
      </Typography>
      <Typography variant="body1" className={classes.lastUpdated}>
        Last Updated: April 26, 2023
      </Typography>
      <Typography variant="body1">
        The Centre for Effective Altruism ("CEA", "we" or "us") is a project of the Effective Ventures group — the
        umbrella term for Effective Ventures Foundation and Effective Ventures Foundation USA, Inc., which are two
        separate legal entities that work together. Under UK law, the Effective Ventures Foundation is the “data
        controller” for the personal data that we collect and process.
      </Typography>
      <Typography variant="body1">
        {/* TODO possibly make this generic for all CEA websites once all the cookie banners are done */}
        We use cookies on the EA Forum. This cookie notice applies only to the EA Forum. You may access and change your
        cookie preferences at any time by clicking{" "}
        <a onClick={() => openDialog({
          name: "CookieDialog",
          contents: ({onClose}) => <Components.CookieDialog onClose={onClose} />
        })}>here</a>.
      </Typography>
      <Typography variant="body1">
        If you choose to reject cookies you are ultimately responsible for removing any that have already been set (such as if you
        previously accepted). See the instructions for doing so{" "}
        <ExternalLink href="https://support.google.com/chrome/answer/95647">here</ExternalLink>.
      </Typography>
      <Typography variant="body1">
        This cookie notice is different to the cookie notice that covers other Effective Ventures Foundation websites.
        You can see the Effective Ventures Foundation cookie notice{" "}
        <ExternalLink href="https://ev.org/cookie-policy/">here</ExternalLink>.
      </Typography>
      <Typography variant="body1" className={classes.heading}>
        What are cookies?
      </Typography>
      <Typography variant="body1">
        A cookie is a very small text document, which often includes a unique identifier. Cookies are created when your
        browser loads a particular website. The website sends information to the browser which then creates a text file.
        Every time you go back to the same website, the browser retrieves and sends this file to the website's server.
        Find out more about the use of cookies on{" "}
        <ExternalLink href="https://www.allaboutcookies.org">www.allaboutcookies.org</ExternalLink>.
      </Typography>
      <Typography variant="body1">
        We also use other forms of technology (such as pixels and web beacons and, in apps, software development kits
        (usually referred to as SDKs)) which serve a similar purpose to cookies and which allow us to monitor and
        improve our Platforms and email communications. When we talk about cookies in this notice, this term includes
        these similar technologies.
      </Typography>
      <Typography variant="body1">
        Your use of our Platforms may result in some cookies being stored that are not controlled by us. This may occur
        when the part of the Platform you are visiting makes use of a third party analytics or marketing
        automation/management tool or includes content displayed from a third party website, for example, YouTube or
        Facebook. You should review the privacy and cookie policies of these services to find out how these third
        parties use cookies and whether your cookie data will be transferred to a third country. We've set out below
        which third party cookies we use.
      </Typography>
      <Typography variant="body1" className={classes.heading}>
        What cookies do we use and what information do they collect?
      </Typography>
      <Typography variant="body1">
        <b>Necessary cookies:</b> these cookies are required to enable core functionality. This includes technologies
        that allow you access to our websites, services, applications, and tools; that are required to identify
        irregular site behaviour, prevent fraudulent activity and improve security; or that allow you to make use of our
        functions such as making donations, saved search or similar functions. These cookies expire after 24 months.
      </Typography>
      <Typography variant="body1" className={classes.cookiePreamble}>
        The cookies we use in this category are:
      </Typography>
      {uniqueNecessaryThirdParties.map((name) => (
        <CookieTable
          type={"necessary"}
          thirdPartyName={name}
          key={`necessary_${name}`}
          className={classes.cookieTable}
        />
      ))}
      <br />
      <Typography variant="body1">
        <b>Functional cookies:</b> these cookies enable functionalities that are not strictly necessary for the website
        to be usable, such as allowing you to contact us for support via Intercom. These cookies expire after 24 months.
      </Typography>
      <Typography variant="body1" className={classes.cookiePreamble}>
        The cookies we use in this category are:
      </Typography>
      {uniqueFunctionalThirdParties.map((name) => (
        <CookieTable
          type={"functional"}
          thirdPartyName={name}
          key={`functional_${name}`}
          className={classes.cookieTable}
        />
      ))}
      <br />
      <Typography variant="body1">
        <b>Analytics and performance cookies:</b> these cookies help us improve or optimise the experience we provide.
        They allow us to measure how visitors interact with our Platforms and we use this information to improve the
        user experience and performance of our Platforms. These cookies are used to collect technical information such
        as the last visited Platform, the number of pages visited, whether or not email communications are opened, which
        parts of our website or email communication are clicked on and the length of time between clicks. They may also
        collect information to provide helpful features and e.g. be used to remember your preferences (such as your
        language preference), your interests and the presentation of the website (such as the font size). These cookies
        expire after 24 months.
      </Typography>
      <Typography variant="body1" className={classes.cookiePreamble}>
        The cookies we use in this category are:
      </Typography>
      {uniqueAnalyticsThirdParties.map((name) => (
        <CookieTable
          type={"analytics"}
          thirdPartyName={name}
          key={`analytics_${name}`}
          className={classes.cookieTable}
        />
      ))}
    </div>
  );
};

export const CookiePolicy = registerComponent("CookiePolicy", CookiePolicyInner, { styles });

declare global {
  interface ComponentTypes {
    CookiePolicy: typeof CookiePolicy;
  }
}
