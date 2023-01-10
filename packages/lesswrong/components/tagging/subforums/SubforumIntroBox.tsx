import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import useCookies from 'react-cookie/cjs/useCookies';
import { DatabasePublicSetting } from '../../../lib/publicSettings';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import CloseIcon from '@material-ui/icons/Close';

const subforumIntroMessageSetting = new DatabasePublicSetting<string | null>("subforumIntroMessage", null)

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 2,
    paddingBottom: "1em",
    paddingLeft: "1.5em",
    paddingRight: "1.5em",
    backgroundColor: theme.palette.background.primaryDim,
    border: theme.palette.border.commentBorder,
  },
  dismissButtonRow: {
    marginLeft: "auto",
    width: "fit-content",
    fontStyle: "italic",
  },
  closeButton: {
    padding: '.25em',
    margin: "0 -1em -1.4em 0",
    minHeight: '.75em',
    minWidth: '.75em',
    alignSelf: 'end',
  },
  closeIcon: {
    width: '1em',
    height: '1em',
    color: theme.palette.icon.dim6,
  },
  noTopPadding: {
    '& :first-child': {
      paddingTop: "0 !important",
      marginTop: "0 !important"
    },
  }
})

const SubforumIntroBox = ({classes}: {
  classes: ClassesType,
}) => {
  const HIDE_SUBFORUM_INTRO_COOKIE = 'hide_subforum_intro';
  const html = subforumIntroMessageSetting.get()
  const [cookies, setCookie] = useCookies([HIDE_SUBFORUM_INTRO_COOKIE])
  const { ContentStyles } = Components

  const hideBanner = () => setCookie(
    HIDE_SUBFORUM_INTRO_COOKIE,
    "true", {
    expires: moment().add(10, 'years').toDate(),
  });

  if (!html || cookies[HIDE_SUBFORUM_INTRO_COOKIE]) {
    return null
  }

  return (
    <ContentStyles contentType="tag" key={`welcome_box`}>
      <div
        className={classes.root}
      >
        <div className={classes.dismissButtonRow}>
          <Button className={classes.closeButton} onClick={hideBanner}>
            <CloseIcon className={classes.closeIcon} />
          </Button>
        </div>
        <div className={classes.noTopPadding} dangerouslySetInnerHTML={{ __html: html }}></div>
      </div>
    </ContentStyles>
  );
}

const SubforumIntroBoxComponent = registerComponent(
  'SubforumIntroBox', SubforumIntroBox, {styles}
);

declare global {
  interface ComponentTypes {
    SubforumIntroBox: typeof SubforumIntroBoxComponent
  }
}
