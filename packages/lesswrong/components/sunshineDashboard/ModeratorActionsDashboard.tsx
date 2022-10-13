import React from 'react';
import { ModeratorActions } from '../../lib/collections/moderatorActions';
import { useMulti } from '../../lib/crud/withMulti';

import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  },
  tableWrapper: {
    ...theme.typography.commentStyle,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    padding: 12,
    paddingTop: 2,
    boxShadow: theme.palette.boxShadow.default,
  },
  table: {
    tableLayout: 'fixed',
    width: '100%'
  }
});

const actionItemStyles = (theme: ThemeType): JssStyles => ({
  cell: {
    textAlign: 'center'
  }
});

const ModeratorActionItem = ({ moderatorAction, classes }: {
  moderatorAction: ModeratorActionDisplay,
  classes: ClassesType
}) => {
  const { UsersName } = Components;
  return (
    <tr>
      <td className={classes.cell}><UsersName user={moderatorAction.user} />{` (${moderatorAction.userId})`}</td>
      <td className={classes.cell}>{moderatorAction.type}</td>
      <td className={classes.cell}>{`${moderatorAction.active}`}</td>
      <td className={classes.cell}>{moderatorAction.createdAt}</td>
      <td className={classes.cell}>{moderatorAction.endedAt}</td>
    </tr>
  );
};

const ModeratorActionsDashboard = ({ classes }: {
  classes: ClassesType
}) => {
  const { ModeratorActionItem, SingleColumnSection, WrappedSmartForm } = Components;

  const currentUser = useCurrentUser();
  if (!userIsAdmin(currentUser)) {
    return null;
  }

  const { results } = useMulti({
    collectionName: 'ModeratorActions',
    fragmentName: 'ModeratorActionDisplay',
    terms: {}
  });

  return (
    <SingleColumnSection>
      <div className={classes.tableWrapper}>
        <table className={classes.table}>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Action Type</th>
              <th>Active</th>
              <th>Created At</th>
              <th>Ended At</th>
            </tr>
          </thead>
          <tbody>
            {results && results.map(moderatorAction => <ModeratorActionItem key={moderatorAction._id} moderatorAction={moderatorAction} />)}
          </tbody>
        </table>
      </div>
      <div className={classes.form}>
        <WrappedSmartForm
          collection={ModeratorActions}
        />
      </div>
    </SingleColumnSection>
  );
};

const ModeratorActionItemComponent = registerComponent('ModeratorActionItem', ModeratorActionItem, { styles: actionItemStyles });
const ModeratorActionsDashboardComponent = registerComponent('ModeratorActionsDashboard', ModeratorActionsDashboard, { styles });

declare global {
  interface ComponentTypes {
    ModeratorActionItem: typeof ModeratorActionItemComponent
    ModeratorActionsDashboard: typeof ModeratorActionsDashboardComponent
  }
}
