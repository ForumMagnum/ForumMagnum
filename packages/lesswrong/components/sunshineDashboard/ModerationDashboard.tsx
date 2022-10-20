import classNames from 'classnames';
import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';

import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  page: {
    width: '90%',
    margin: 'auto'
  },
  topBar: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.eventCard,
    marginBottom: 16,
    padding: 12,
    ...theme.typography.body2,
    zIndex: theme.zIndexes.modTopBar
  },
  tabButton: {
    marginRight: 25,
    color: theme.palette.grey[600],
    cursor: "pointer"
  },
  tabButtonSelected: {
    color: theme.palette.grey[900]
  },
  row: {
    display: "flex"
  },
  toc: {
    width: 200,
    ...theme.typography.body2,
    position: "sticky",
    top: 64,
    paddingTop: 12,
  },
  main: {
    width: "calc(100% - 230px)"
  },
  tocListing: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 12
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

const ModerationDashboard = ({ classes }: {
  classes: ClassesType
}) => {
  const { UsersReviewInfoCard, LoadMore, Loading } = Components;
    
  const currentUser = useCurrentUser();

  const [view, setView] = useState<UsersViewName>("sunshineNewUsers")
  
  const { results: usersToReview, count, totalCount, loadMoreProps, refetch, loading } = useMulti({
    terms: {view: view, limit: 25},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    itemsPerPage: 60
  });

  if (!userIsAdmin(currentUser)) {
    return null;
  }

  return (
    <div className={classes.page}>
      <div className={classes.row}>
        <div>
          <div className={classes.toc}>
            {usersToReview?.map(user => {
              return <div key={user._id} className={classes.tocListing}>
                {user.displayName}
              </div>
            })}
            <div className={classes.loadMore}>
              <LoadMore {...loadMoreProps}/>
            </div>
          </div>
        </div>
        <div className={classes.main}>
          <div className={classes.topBar}>
            <div 
              onClick={() => setView("sunshineNewUsers")}
              className={classNames(classes.tabButton, {[classes.tabButtonSelected]: view === "sunshineNewUsers"})} 
            >
              Unreviewed Users {view === "sunshineNewUsers" && (loading ? <Loading/> : <>({count} to Review)</>)}
            </div>
            <div 
              onClick={() => setView("allUsers")}
              className={classNames(classes.tabButton, {[classes.tabButtonSelected]: view === "allUsers"})}         
            >
              Reviewed Users
            </div>
          </div>
          {usersToReview && usersToReview.map(user =>
            <div key={user._id}>
              <UsersReviewInfoCard user={user} refetch={refetch} currentUser={currentUser}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ModeratorActionItemComponent = registerComponent('ModeratorActionItem', ModeratorActionItem, { styles: actionItemStyles });
const ModerationDashboardComponent = registerComponent('ModerationDashboard', ModerationDashboard, { styles });

declare global {
  interface ComponentTypes {
    ModeratorActionItem: typeof ModeratorActionItemComponent
    ModerationDashboard: typeof ModerationDashboardComponent
  }
}
