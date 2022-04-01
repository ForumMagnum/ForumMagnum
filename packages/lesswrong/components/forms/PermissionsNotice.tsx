/*import React from 'react';
import { registerComponent, Components, useStyles } from '../../lib/vulcan-lib/components';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import type { LWForm } from './formUtil';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import Info from '@material-ui/icons/Info';

const styles = (theme: ThemeType): JssStyles => ({
});

function PermissionsNotice<T>({form, fieldName}: {
  form: LWForm<T>,
  fieldName: string,
}) {
  const classes = useStyles(styles, "PermissionsNotice");
  const currentUser = useCurrentUser();
  const isAdmin = userIsAdmin(currentUser);
  const isModerator = false; //TODO
  const schemaField = getCollection(form.collectionName)._schemaFields[fieldName as string];
  const { LWTooltip } = Components;
  
  const couldReadIfRegularUser = false; //TODO
  const couldReadIfModerator = false; //TODO
  const couldEditIfRegularUser = false; //TODO
  const couldEditIfModerator = false; //TODO
  
  if ((isAdmin || isModerator) && (!couldReadIfRegularUser || !couldReadIfModerator)) {
    return <LWTooltip title={<div>
      You can access this because you are {isAdmin ? "an admin" : "a moderator."}
    </div>}>
      <Info/>
    </LWTooltip>
  } else {
    return <span/>
  }
}

registerComponent('PermissionsNotice', PermissionsNotice, {styles});
declare global {
  interface ComponentTypes {
    PermissionsNotice: typeof PermissionsNotice
  }
}*/
