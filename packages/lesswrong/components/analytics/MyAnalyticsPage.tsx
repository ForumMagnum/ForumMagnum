import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userGetAnalyticsUrl } from '../../lib/collections/users/helpers';

const MyAnalyticsPageInner = () => {
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

export const MyAnalyticsPage = registerComponent('MyAnalyticsPage', MyAnalyticsPageInner);

declare global {
  interface ComponentTypes {
    MyAnalyticsPage: typeof MyAnalyticsPage
  }
}
