import React from 'react';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.default,
    width: '100%',
    padding: 32,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
});

const BannedNotice = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const {SingleColumnSection, Typography } = Components;
  
  return <SingleColumnSection>
    <div className={classes.root}>
      <Typography variant='body2' gutterBottom>
        Sorry, but we have banned your account. You can still read{' '}
        {siteNameWithArticleSetting.get()} in logged-out mode, but you will not be able to post or
        comment.
      </Typography>

      {/*
        lw-look-here y'all should get a contact page at /contact or change
        this link to be dynamic based on the forumType
      */}
      <Typography variant='body2'>
        If you believe this is a mistake, please <Link to='/contact'>contact us.</Link>
      </Typography>
    </div>
  </SingleColumnSection>
}

const BannedNoticeComponent = registerComponent(
  'BannedNotice', BannedNotice, {styles}
);

declare global {
  interface ComponentTypes {
    BannedNotice: typeof BannedNoticeComponent
  }
}
