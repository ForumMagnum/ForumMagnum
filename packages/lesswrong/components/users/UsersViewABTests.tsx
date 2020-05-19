import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useAllABTests, getUserABTestKey, getABTestsMetadata, useClientId } from '../../lib/abTestUtil';
import { useCurrentUser } from '../common/withUser';
import * as _ from 'underscore';

const UsersViewABTests = () => {
  const { SingleColumnSection, SectionTitle } = Components;
  const currentUser = useCurrentUser();
  const allABtests = useAllABTests();
  const abTestsMetadata = getABTestsMetadata();
  const clientId = useClientId();
  
  return <SingleColumnSection>
    <SectionTitle title="A/B Tests"/>
    
    <p>
    Your A/B test key is {getUserABTestKey(currentUser, clientId)}
    </p>
    
    {_.keys(allABtests).map(abTestName => <div key={abTestName}>
      <h2>{abTestsMetadata[abTestName].description}</h2>
      <p>Group: {abTestsMetadata[abTestName].groups[allABtests[abTestName]].description}</p>
    </div>)}
  </SingleColumnSection>
}

const UsersViewABTestsComponent = registerComponent("UsersViewABTests", UsersViewABTests);

declare global {
  interface ComponentTypes {
    UsersViewABTests: typeof UsersViewABTestsComponent
  }
}
