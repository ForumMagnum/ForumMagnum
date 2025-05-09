import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userGetAnalyticsUrl } from '../../lib/collections/users/helpers';
import { PermanentRedirect } from "../common/PermanentRedirect";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { LoginForm } from "../users/LoginForm";

const MyAnalyticsPageInner = () => {
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


