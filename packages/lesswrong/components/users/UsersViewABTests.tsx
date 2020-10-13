import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useAllABTests, useClientId } from '../../lib/abTestUtil';
import { getUserABTestKey, getABTestsMetadata } from '../../lib/abTestImpl';
import { useCurrentUser } from '../common/withUser';
import * as _ from 'underscore';

const styles = (theme: ThemeType) => ({
  abTestKey: {
    ...theme.typography.body1,
  },
  noAbTests: {
    ...theme.typography.body1,
  },
  abTestsTable: {
    ...theme.typography.body1,
    "& th": {
      textAlign: "left",
    },
    "& td": {
      paddingRight: 20,
    },
  },
});

const UsersViewABTests = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle } = Components;
  const currentUser = useCurrentUser();
  const allABtests = useAllABTests();
  const abTestsMetadata = getABTestsMetadata();
  const clientId = useClientId();
  
  return <SingleColumnSection>
    <SectionTitle title="A/B Tests"/>
    
    <p className={classes.abTestKey}>
      Your A/B test key is {getUserABTestKey(currentUser, clientId)}
    </p>
    
    {Object.keys(allABtests).length===0
      ? <p className={classes.noAbTests}>
          There aren't any A/B tests active right now
        </p>
      : <table className={classes.abTestsTable}>
          <thead><tr>
            <th>A/B Test</th>
            <th>Your Group</th>
          </tr></thead>
          <tbody>
            {_.keys(allABtests).map(abTestName => <tr key={abTestName}>
              <td>{abTestsMetadata[abTestName].description}</td>
              <td>{abTestsMetadata[abTestName].groups[allABtests[abTestName]].description}</td>
            </tr>)}
          </tbody>
        </table>
    }
  </SingleColumnSection>
}

const UsersViewABTestsComponent = registerComponent("UsersViewABTests", UsersViewABTests, {styles});

declare global {
  interface ComponentTypes {
    UsersViewABTests: typeof UsersViewABTestsComponent
  }
}
