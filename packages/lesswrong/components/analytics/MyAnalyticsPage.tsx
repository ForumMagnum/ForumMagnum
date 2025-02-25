import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
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
