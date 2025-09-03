import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useAllABTests, useClientId, getUserABTestKey, getABTestsMetadata } from '../../lib/abTestImpl';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import * as _ from 'underscore';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import { MenuItem } from "../common/Menus";

const styles = (theme: ThemeType) => ({
  explanatoryText: {
    ...theme.typography.body1,
    ...(theme.isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  abTestsTable: {
    ...theme.typography.body1,
    ...(theme.isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
    marginTop: 24,
    "& th": {
      textAlign: "left",
    },
    "& td": {
      paddingRight: 20,
    },
  },
});

const UsersViewABTests = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const allABtests = useAllABTests();
  const abTestsMetadata = getABTestsMetadata();
  const clientId = useClientId();
  
  return <SingleColumnSection>
    <SectionTitle title="A/B Tests"/>
    
    <div className={classes.explanatoryText}>
      <p>
        Your A/B test key is {getUserABTestKey(currentUser ? {user:currentUser} : {clientId})}. This is used to randomize your test group in future A/B tests. You can see which A/B tests are active and which group you are in below, and override your group allocation. (This may cause data you generate to not be counted in certain experiments.)
      </p>
      
      {!currentUser && <p>
        You need to log in to override your A/B test group allocation.
      </p>}
    </div>
    
    {Object.keys(allABtests).length===0
      ? <p className={classes.explanatoryText}>
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
              <td>
                {currentUser &&
                  <Select
                    value={allABtests[abTestName]}
                    onChange={(e) => {
                      const newTestGroup = e.target.value;
                      void updateCurrentUser({
                        abTestOverrides: {
                          ...currentUser.abTestOverrides,
                          [abTestName]: newTestGroup,
                        },
                      });
                    }}
                  >
                    {Object.keys(abTestsMetadata[abTestName].groups).map(testGroup => 
                      <MenuItem value={testGroup} key={testGroup}>
                        {abTestsMetadata[abTestName].groups[testGroup].description}
                      </MenuItem>
                    )}
                  </Select>
                }
                {!currentUser &&
                  abTestsMetadata[abTestName].groups[allABtests[abTestName]].description
                }
              </td>
            </tr>)}
          </tbody>
        </table>
    }
  </SingleColumnSection>
}

export default registerComponent("UsersViewABTests", UsersViewABTests, {styles});


