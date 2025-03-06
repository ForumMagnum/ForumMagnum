import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import { useTracking } from '@/lib/analyticsEvents';
import { useMulti } from '@/lib/crud/withMulti';
import PetrovWorldmapWrapper from "@/components/seasonal/petrovDay/PetrovWorldmapWrapper";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";
import Row from "@/components/common/Row";

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
  const { results: petrovDayActions = [], refetch: refetchPetrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'adminConsole',
      limit: 200
    },
    skip: !currentUser
  })

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
        mutationFragment={getFragment('PetrovDayActionInfo')}
      /> */}
  </PetrovWorldmapWrapper>
}

const PetrovAdminConsoleComponent = registerComponent('PetrovAdminConsole', PetrovAdminConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovAdminConsole: typeof PetrovAdminConsoleComponent
  }
}

export default PetrovAdminConsoleComponent;
