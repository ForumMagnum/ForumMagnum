import React from 'react';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const BannedNotice = ({classes}: {
  classes: ClassesType
}) => {
  const {SingleColumnSection} = Components;
  
  return <SingleColumnSection>
    <p>Sorry, but we have banned your account. You can still read {siteNameWithArticleSetting.get()}
    in logged-out mode, but you will not be able to post or comment.</p>
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
