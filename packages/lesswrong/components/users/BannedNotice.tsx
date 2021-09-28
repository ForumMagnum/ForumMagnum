import { Typography } from '@material-ui/core';
import React from 'react';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: 'white',
    width: '100%',
    padding: 32,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
});

const BannedNotice = ({classes}: {
  classes: ClassesType
}) => {
  const {SingleColumnSection, } = Components;
  
  return <SingleColumnSection>
    <div className={classes.root}>
      <Typography variant='body2' gutterBottom>
        Sorry, but we have banned your account. You can still read{' '}
        {siteNameWithArticleSetting.get()} in logged-out mode, but you will not be able to post or
        comment.
      </Typography>

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
