import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useTracking } from '@/lib/analyticsEvents';
import PetrovWorldmapWrapper from "./PetrovWorldmapWrapper";
import Row from "../../common/Row";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PetrovDayActionInfoMultiQuery = gql(`
  query multiPetrovDayActionPetrovAdminConsoleQuery($selector: PetrovDayActionSelector, $limit: Int, $enableTotal: Boolean) {
    petrovDayActions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PetrovDayActionInfo
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    maxHeight: 350,
    width: 350,
    overflowY: 'scroll',
    textAlign: 'center'
  },
  consoleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '.9rem',
    fontFamily: 'monospace',
    marginBottom: 12,
    '& h3': {
      fontSize: '1rem',
      fontWeight: 'bold',
      marginRight: 12
    }
  }
});

export const PetrovAdminConsole = ({classes, currentUser}: {
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { data, refetch: refetchPetrovDayActions } = useQuery(PetrovDayActionInfoMultiQuery, {
    variables: {
      selector: { adminConsole: {} },
      limit: 200,
      enableTotal: false,
    },
    skip: !currentUser,
    notifyOnNetworkStatusChange: true,
  });

  const petrovDayActions = data?.petrovDayActions?.results ?? [];

  return <PetrovWorldmapWrapper>
    <div className={classes.root}>
      <h1>Petrov Admin Console</h1>
        {petrovDayActions.map((action) => (
          <div className={classes.consoleRow} key={action._id}>
            <h3>{action.actionType}</h3>
            <div>{new Date(action.createdAt).toLocaleTimeString()} {action.userId}
              <div>{JSON.stringify(action.data, null, 2)}</div>
            </div>
          </div>
        ))}
    </div>
      {/* <WrappedSmartForm
        collectionName="PetrovDayActions"
        mutationFragmentName={'PetrovDayActionInfo'}
      /> */}
  </PetrovWorldmapWrapper>
}

export default registerComponent('PetrovAdminConsole', PetrovAdminConsole, {styles});


