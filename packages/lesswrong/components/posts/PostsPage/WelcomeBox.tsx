import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import React, { ComponentProps, PropsWithoutRef } from 'react';
import { useCookies } from 'react-cookie';
import { AnalyticsContext } from '../../../lib/analyticsEvents';
import { ForumOptions } from '../../../lib/forumTypeUtils';
import { Link } from '../../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { HashLinkProps } from '../../common/HashLink';

const styles = (theme: ThemeType): JssStyles => ({
  welcomeBox: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    border: theme.palette.border.normal,
    borderRadius: 3
  },
  welcomeBoxCloseButton: {
    padding: '.25em',
    margin: "-1.75em -1.75em 0 0",
    minHeight: '.75em',
    minWidth: '.75em',
    alignSelf: 'end',
  },
  welcomeBoxCloseIcon: {
    width: '.6em',
    height: '.6em',
    color: theme.palette.icon.dim6,
  },
  welcomeBoxHeader: {
    fontFamily: theme.typography.fontFamily,
    fontSize: "1.8rem",
    fontWeight: 400,
    paddingBottom: 8,
    borderBottom: theme.palette.border.faint,
    marginBottom: 6
  },
  welcomeBoxHeaderSeparator: {
    display: 'flex'
  },
  welcomeBoxLink: {
    fontFamily: theme.typography.fontFamily,
    fontSize: "1.2rem",
    color: theme.palette.primary.main
  },
});

const HIDE_WELCOME_BOX_COOKIE = 'hide_welcome_box';

const WelcomeBox = ({ title, linksProps, classes }: {
  title: string,
  linksProps: HashLinkProps[],
  classes: ClassesType
}) => {
  const [cookies, setCookie] = useCookies([HIDE_WELCOME_BOX_COOKIE]);

  if (cookies[HIDE_WELCOME_BOX_COOKIE]) {
    return null;
  }

  const hideBox = () => setCookie(
    HIDE_WELCOME_BOX_COOKIE,
    "true", {
    expires: moment().add(30, 'days').toDate(),
  });

  const { Typography } = Components;
  return (
    <AnalyticsContext pageElementContext="welcomeBox">
      <div className={classes.welcomeBox}>
        <Button className={classes.welcomeBoxCloseButton} onClick={hideBox}>
          <CloseIcon className={classes.welcomeBoxCloseIcon}/>
        </Button>
        <span className={classes.welcomeBoxHeaderSeparator}>
          <Typography variant="title" className={classes.welcomeBoxHeader}>{title}</Typography>
        </span>
        {linksProps.map((linkProps, idx) => {
          const { children, ...otherProps } = linkProps;
          return (
            <Link key={`welcomeBoxLink_${idx}`} {...otherProps}>
              <Typography variant="body1" className={classes.welcomeBoxLink}>{children}</Typography>
            </Link>
          );
        })}
      </div>
    </AnalyticsContext>
  );
};


const WelcomeBoxComponent = registerComponent('WelcomeBox', WelcomeBox, { styles });

export const welcomeBoxes: ForumOptions<ComponentProps<typeof WelcomeBoxComponent> | null> = {
  LessWrong: {
    title: "New to LessWrong?",
    linksProps: [
      // TODO - different getting started link?
      { to: "/about", children: "Getting Started" },
      { to: "/about", children: "About" },
      { to: "/faq", children: "FAQ" }
    ]
  },
  default: null
};

declare global {
  interface ComponentTypes {
      WelcomeBox: typeof WelcomeBoxComponent
  }
}