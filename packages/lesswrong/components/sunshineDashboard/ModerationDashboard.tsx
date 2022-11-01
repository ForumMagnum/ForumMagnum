import classNames from 'classnames';
import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';

import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  page: {
    width: '90%',
    margin: 'auto',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    }
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
    [theme.breakpoints.down('md')]: {
      display: "none"
    }
  },
  main: {
    width: "calc(100% - 230px)",
    [theme.breakpoints.down('md')]: {
      width: "100%"
    }
  },
  tocListing: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 12
  },
  hidden: {
    display: "none"
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

type DashboardTabs = 'sunshineNewUsers' | 'allUsers' | 'moderatedComments';

const ModerationDashboard = ({ classes }: {
  classes: ClassesType
}) => {
  const { UsersReviewInfoCard, CommentsReviewTab, LoadMore, Loading } = Components;
    
  const currentUser = useCurrentUser();

  const [view, setView] = useState<DashboardTabs>('sunshineNewUsers');
  
  const { results: usersToReview = [], count, loadMoreProps, refetch, loading } = useMulti({
    terms: {view: "sunshineNewUsers", limit: 10},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    itemsPerPage: 50
  });

  const { results: allUsers = [], loadMoreProps: allUsersLoadMoreProps, refetch: refetchAllUsers } = useMulti({
    terms: {view: "allUsers", limit: 10},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    itemsPerPage: 50,
  });

  if (!userIsAdmin(currentUser)) {
    return null;
  }

  return (
    <div className={classes.page}>
      <div className={classes.row}>
        <div className={classNames({ [classes.hidden]: view !== 'sunshineNewUsers' })}>
          <div className={classes.toc}>
            {usersToReview.map(user => {
              return <div key={user._id} className={classes.tocListing}>
                <a href={`/admin/moderation#${user._id}`}>
                  {user.displayName}
                </a>
              </div>
            })}
            <div className={classes.loadMore}>
              <LoadMore {...loadMoreProps}/>
            </div>
          </div>
        </div>
        <div className={classNames({ [classes.hidden]: view !== 'allUsers' })}>
          <div className={classes.toc}>
            {allUsers.map(user => {
              return <div key={user._id} className={classes.tocListing}>
                {user.displayName}
              </div>
            })}
            <div className={classes.loadMore}>
              <LoadMore {...allUsersLoadMoreProps}/>
            </div>
          </div>
        </div>
        <div className={classNames({ [classes.hidden]: view !== 'moderatedComments' })}>
          <div className={classes.toc}></div>
        </div>
        <div className={classes.main}>
          <div className={classes.topBar}>
            <div 
              onClick={() => setView("sunshineNewUsers")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: view === 'sunshineNewUsers' })} 
            >
              Unreviewed Users {view === "sunshineNewUsers" && (loading ? <Loading/> : <>({count} to Review)</>)}
            </div>
            <div 
              onClick={() => setView("allUsers")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: view === 'allUsers' })} 
            >
              Reviewed Users
            </div>
            <div
              onClick={() => setView("moderatedComments")}
              className={classNames(classes.tabButton, { [classes.tabButtonSelected]: view === 'moderatedComments' })} 
            >
              Moderated Comments
            </div>
          </div>
          <div className={classNames({ [classes.hidden]: view !== 'sunshineNewUsers' })}>
            {usersToReview.map(user =>
              <div key={user._id} id={user._id}>
                <UsersReviewInfoCard user={user} refetch={refetch} currentUser={currentUser}/>
              </div>
            )}
          </div>
          <div className={classNames({ [classes.hidden]: view !== 'allUsers' })}>
            {allUsers.map(user =>
              // TODO: we probably want to display something different for already-reviewed users, since a bunch of the actions we can take only make sense for unreviewed users
              <div key={user._id}>
                <UsersReviewInfoCard user={user} refetch={refetchAllUsers} currentUser={currentUser}/>
              </div>
            )}
          </div>
          <div className={classNames({ [classes.hidden]: view !== 'moderatedComments' })}>
            <CommentsReviewTab />
          </div>
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
