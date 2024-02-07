import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { userGetAnalyticsUrl } from '../../lib/collections/users/helpers';

const MyAnalyticsPage = () => {
  const {PermanentRedirect, SingleColumnSection, LoginForm} = Components;
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return (
      <SingleColumnSection>
        <LoginForm />
      </SingleColumnSection>
    );
  }

  return <PermanentRedirect status={302} url={userGetAnalyticsUrl(currentUser)}/>
}

const MyAnalyticsPageComponent = registerComponent('MyAnalyticsPage', MyAnalyticsPage);

declare global {
  interface ComponentTypes {
    MyAnalyticsPage: typeof MyAnalyticsPageComponent
  }
}
