import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
})


const CookiePolicy = ({classes}: {
  classes: ClassesType,
}) => {
  return <div>
    TODO cookie policy
  </div>;
}

const CookiePolicyComponent = registerComponent("CookiePolicy", CookiePolicy, {styles});

declare global {
  interface ComponentTypes {
    CookiePolicy: typeof CookiePolicyComponent
  }
}
