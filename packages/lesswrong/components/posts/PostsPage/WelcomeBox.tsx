import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import React, { ComponentProps } from 'react';
import { AnalyticsContext } from '../../../lib/analyticsEvents';
import { ForumOptions } from '../../../lib/forumTypeUtils';
import { Link } from '../../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { HashLinkProps } from '../../common/HashLink';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { HIDE_WELCOME_BOX_COOKIE } from '../../../lib/cookies/cookies';

const styles = (theme: ThemeType): JssStyles => ({
  welcomeBox: {
    paddingTop: 14,
    paddingLeft: 24,
    paddingRight: 16,
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    border: theme.palette.border.normal,
    borderRadius: 3,
  },
  welcomeBoxCloseButton: {
    padding: 0,
    marginBottom: 14,
    minHeight: '.75em',
    minWidth: '.75em',
  },
  welcomeBoxCloseIcon: {
    width: '.6em',
    height: '.6em',
    color: theme.palette.icon.dim6,
  },
  welcomeBoxHeader: {
    ...theme.typography.body2,
    fontWeight: 400,
    paddingBottom: 8,
    borderBottom: theme.palette.border.faint,
    marginBottom: 6,
    marginRight: 16,
    whiteSpace: 'pre'
  },
  welcomeBoxHeaderSeparator: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  welcomeBoxLink: {
    fontFamily: theme.typography.body2.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.primary.main,
    whiteSpace: 'pre'
  },
});

const WelcomeBox = ({ title, contents, classes }: {
  title: string,
  contents: Pick<HashLinkProps, 'to' | 'children'>[],
  classes: ClassesType
}) => {
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_WELCOME_BOX_COOKIE]);

  if (cookies[HIDE_WELCOME_BOX_COOKIE]) {
    return null;
  }

  const hideBox = () => setCookie(HIDE_WELCOME_BOX_COOKIE, "true", {
    path: "/"
  });

  const { Typography } = Components;
  return (
    <AnalyticsContext pageElementContext="welcomeBox">
      <div className={classes.welcomeBox}>
        <span className={classes.welcomeBoxHeaderSeparator}>
          <Typography variant="title" className={classes.welcomeBoxHeader}>{title}</Typography>
          <Button className={classes.welcomeBoxCloseButton} onClick={hideBox}>
            <CloseIcon className={classes.welcomeBoxCloseIcon}/>
          </Button>
        </span>
        {contents.map((linkProps, idx) => {
          const { children, ...otherProps } = linkProps;
          return (
            <Typography key={`welcomeBoxContent_${idx}`} variant="body1" className={classes.welcomeBoxLink}>
              <Link {...otherProps}>
                {children}
              </Link>
            </Typography>
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
    contents: [
      { to: "/about", children: "Getting Started" },
      { to: "/faq", children: "FAQ" },
      { to: "/library", children: "Library" }
    ]
  },
  default: null
};

declare global {
  interface ComponentTypes {
      WelcomeBox: typeof WelcomeBoxComponent
  }
}
