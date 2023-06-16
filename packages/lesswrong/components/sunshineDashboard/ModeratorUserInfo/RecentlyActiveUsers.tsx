import React, { useState } from 'react';
import classNames from 'classnames';
import Users, { userIsAdminOrMod } from '../../../lib/vulcan-users';
import { useMulti } from '../../../lib/crud/withMulti';
import { useCurrentUser } from '../../common/withUser';
import { Link } from '../../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { commentBodyStyles } from '../../../themes/stylePiping';
import { downvoterTooltip, recentKarmaTooltip } from './UserReviewMetadata';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...commentBodyStyles(theme),
    width: '90%',
    maxWidth: 1800,
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
    width: 220,
    ...theme.typography.body2,
    position: "sticky",
    top: 64,
    paddingTop: 12,
    [theme.breakpoints.down('md')]: {
      display: "none"
    }
  },
  commentToc: {
    width: 340
  }, 
  loadMore: {
    paddingLeft: 12,
    paddingTop: 12
  },
  flagged: {
    color: theme.palette.error.main,
    fontWeight: 600,
  },
  lowKarma: {
    color: theme.palette.warning.main,
    fontWeight: 600,
  },
  table: {
    '& td': {
      padding: 8,
      whiteSpace: "nowrap",
      borderBottom: theme.palette.border.faint,
      pointerEvents: "unset"
    },
  },
  userInfo: {
    maxWidth: 1200,
    whiteSpace: "normal !important"
  },
  numberCell: {
    textAlign: "center",
  },
  expand: {
    cursor: "pointer",
    opacity: .5
  },
  selected: {
    color: theme.palette.grey[900],
    fontWeight: 600,
  }
});

const RecentlyActiveUsers = ({ classes }: {
  classes: ClassesType
}) => {
  const { UsersReviewInfoCard, LoadMore, LWTooltip, UsersName, FormatDate } = Components;
    
  const currentUser = useCurrentUser();

  const [expandId, setExpandId] = useState<string|null>(null);

  type sortingType = "lastNotificationsCheck"|"recentKarma"|"downvoters"|"karma";
  const [sorting, setSorting] = useState<sortingType>("lastNotificationsCheck");

  const { results = [], loadMoreProps: recentlyActiveLoadMoreProps, refetch } = useMulti({
    terms: {view: "recentlyActive", limit:50},
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    itemsPerPage: 100,
    enableTotal: true
  });

  if (!userIsAdminOrMod(currentUser)) {
    return null;
  }

  const handleExpand = (id: string) => {
    if (expandId === id) {
      setExpandId(null);
    } else {
      setExpandId(id);
    }
  }

  const usersSortedByRecentKarma = [...results].sort((a, b) => {
    return a.recentKarmaInfo.recentKarma - b.recentKarmaInfo.recentKarma;
  });

  const usersSortByKarma = [...results].sort((a, b) => {
    return (a.karma ?? 0) - (b.karma ?? 0)
  });

  const usersSortByDownvoters = [...results].sort((a, b) => {
    return b.recentKarmaInfo.downvoterCount - a.recentKarmaInfo.downvoterCount
  });

  let sortedUsers = results;
  switch (sorting) {
    case "karma":
      sortedUsers = usersSortByKarma;
      break;
    case "recentKarma":
      sortedUsers = usersSortedByRecentKarma;
      break;
    case "downvoters":
      sortedUsers = usersSortByDownvoters;
      break;
    case "lastNotificationsCheck":
      break
  }

  return (
    <div className={classes.root}>
      <div className={classes.topBar}>
        <Link to="/admin/moderation?view=sunshineNewUsers" className={classes.tabButton}>
          Unreviewed Users
        </Link>
        <Link to="/admin/moderation?view=allUsers" className={classes.tabButton}>
          Reviewed Users
        </Link>
        <div className={classNames(classes.tabButton, classes.tabButtonSelected)}>
          Recently Active Users
        </div>
      </div>
      <table className={classes.table}>
        <thead>
          <tr>
            <td>DisplayName</td>
            <td className={classNames(classes.numberCell, {[classes.selected]: sorting === "karma"})} 
              onClick={() => setSorting("karma")}>
              Karma
            </td>
            <td className={classNames(classes.numberCell, {[classes.selected]: sorting === "recentKarma"})} 
              onClick={() => setSorting("recentKarma")}>
              Recent Karma
            </td>
            <td className={classNames(classes.numberCell, {[classes.selected]: sorting === "downvoters"})} 
              onClick={() => setSorting("downvoters")}>
              Downvoters
            </td>
            <td className={classNames(classes.numberCell, {[classes.selected]: sorting === "lastNotificationsCheck"})} 
              onClick={() => setSorting("lastNotificationsCheck")}>
              Last Checked</td>
            <td>
              <LoadMore {...recentlyActiveLoadMoreProps}/>
            </td>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map(user => {
            const { recentKarma, downvoterCount } = user.recentKarmaInfo;
            return <>
              <tr key={user._id}>
                <td>
                  <UsersName user={user}/>
                </td>
                <td className={classes.numberCell}>
                  <span className={classNames({
                    [classes.lowKarma]: user.karma < 5 && user.karma >= 0, 
                    [classes.flagged]: user.karma < 0})}>
                    {user.karma}
                  </span>
                </td>
                <td className={classes.numberCell}>
                  <LWTooltip title={recentKarmaTooltip(user)}>
                    <span className={classNames({
                      [classes.lowKarma]: recentKarma < 5 && recentKarma >= 0, 
                      [classes.flagged]: recentKarma < 0})}>
                      {recentKarma}
                    </span>
                  </LWTooltip>
                </td>
                <td className={classes.numberCell}>
                  <LWTooltip title={downvoterTooltip(user)}>
                    {downvoterCount}
                  </LWTooltip>
                </td>
                <td>
                  {user.lastNotificationsCheck && <FormatDate date={user.lastNotificationsCheck} />}
                </td>
                <td onClick={() => handleExpand(user._id)} className={classes.expand}>
                  {expandId === user._id ? "[ - ]" : "[+]"}
                </td>
              </tr>
              {expandId === user._id && <tr>
                <td colSpan={6} className={classes.userInfo}>
                  <UsersReviewInfoCard user={user} key={user._id} refetch={refetch} currentUser={currentUser}/>
                </td>
              </tr>}
            </>
          })}
        </tbody>
      </table>
      <div className={classes.loadMore}>
        <LoadMore {...recentlyActiveLoadMoreProps}/>
      </div>
    </div>
  );
};

const RecentlyActiveUsersComponent = registerComponent('RecentlyActiveUsers', RecentlyActiveUsers, { styles });

declare global {
  interface ComponentTypes {
    RecentlyActiveUsers: typeof RecentlyActiveUsersComponent
  }
}
