import React, { useState } from 'react';
import classNames from 'classnames';
import { userIsAdminOrMod } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { Link } from '../../../lib/reactRouterWrapper';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { commentBodyStyles } from '../../../themes/stylePiping';
import UserAutoRateLimitsDisplay, { downvoterTooltip, recentKarmaTooltip } from './UserAutoRateLimitsDisplay';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { autoCommentRateLimits, autoPostRateLimits } from '../../../lib/rateLimits/constants';
import { getActiveRateLimitNames } from '../../../lib/rateLimits/utils';
import { useLocation } from '../../../lib/routeUtil';
import UsersReviewInfoCard from "../UsersReviewInfoCard";
import LoadMore from "../../common/LoadMore";
import LWTooltip from "../../common/LWTooltip";
import UsersName from "../../users/UsersName";
import FormatDate from "../../common/FormatDate";
import MetaInfo from "../../common/MetaInfo";
import SectionFooterCheckbox from "../../form-components/SectionFooterCheckbox";
import Row from "../../common/Row";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const SunshineUsersListMultiQuery = gql(`
  query multiUserRecentlyActiveUsersQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineUsersList
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
  header: {
    position: "sticky",
    top: 45,
    background: theme.palette.background.pageActiveAreaBackground,
  },
  tabButton: {
    marginRight: 25,
    color: theme.palette.grey[600],
    cursor: "pointer"
  },
  recentlyActiveTab: {
    color: theme.palette.grey[900],
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexGrow: 1,
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
  },
  cell: {
    cursor: "pointer",
  },
  checkbox: {
    marginRight: 12
  }
});

type SortingType = "lastNotificationsCheck"|"last20Karma"|"downvoters"|"karma"|"lastMonthKarma"|"userSortByRateLimitCount";


const RecentlyActiveUsers = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();

  const [expandId, setExpandId] = useState<string|null>(null);

  const [sorting, setSorting] = useState<SortingType>("lastNotificationsCheck");
  const [ignoreLowKarma, setIgnoreLowKarma] = useState<boolean>(false);

  const {query} = useLocation();
  const limit = parseInt(query.limit) || 200 // this is using || instead of ?? because it correclty handles NaN 

  const { data, refetch, loadMoreProps: recentlyActiveLoadMoreProps } = useQueryWithLoadMore(SunshineUsersListMultiQuery, {
    variables: {
      selector: { recentlyActive: {} },
      limit: limit,
      enableTotal: true,
    },
    itemsPerPage: 200,
  });

  const results = data?.users?.results ?? [];

  const handleExpand = (id: string) => {
    if (expandId === id) {
      setExpandId(null);
    } else {
      setExpandId(id);
    }
  }

  function usersSortedByRecentKarma (users: SunshineUsersList[]) {
    return [...users].sort((a, b) => {
      return a.recentKarmaInfo.last20Karma - b.recentKarmaInfo.last20Karma;
    })
  };

  function usersSortByKarma (users: SunshineUsersList[]) {
    return [...users].sort((a, b) => {
      return (a.karma) - (b.karma)
    })
  };

  function usersSortByDownvoters (users: SunshineUsersList[]) {
    return [...users].sort((a, b) => {
      return b.recentKarmaInfo.downvoterCount - a.recentKarmaInfo.downvoterCount
    })
  };

  function usersSortByLastMonthKarma (users: SunshineUsersList[]) {
    return [...users].sort((a, b) => {
      return a.recentKarmaInfo.lastMonthKarma - b.recentKarmaInfo.lastMonthKarma;
    })
  };

  function userSortByRateLimitCount (users: SunshineUsersList[]) {
    const allRateLimits = [...forumSelect(autoPostRateLimits), ...forumSelect(autoCommentRateLimits)]
    return [...users].sort((a, b) => {
      return getActiveRateLimitNames(b, allRateLimits).length - getActiveRateLimitNames(a, allRateLimits).length
    })
  };

  function userSortByLastNotificationsCheck (users: SunshineUsersList[]) {
    return [...users].sort((a, b) => {
      const timeA = new Date(a.lastNotificationsCheck ?? 0).getTime();
      const timeB = new Date(b.lastNotificationsCheck ?? 0).getTime();
      return timeA - timeB
    })
  };

  let sortedUsers = results

  switch (sorting) {
    case "karma":
      sortedUsers = usersSortByKarma(results);
      break;
    case "last20Karma":
      sortedUsers = usersSortedByRecentKarma(results);
      break;
    case "downvoters":
      sortedUsers = usersSortByDownvoters(results);
      break;
    case "lastMonthKarma":
      sortedUsers = usersSortByLastMonthKarma(results);
      break
    case "userSortByRateLimitCount":
      sortedUsers = userSortByRateLimitCount(results);
      break;
    case "lastNotificationsCheck":
      sortedUsers = userSortByLastNotificationsCheck(results);
      break
  } 

  sortedUsers = ignoreLowKarma ? sortedUsers.filter(user => user.karma >= 5) : sortedUsers;

  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    return null;
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
        <div className={classNames(classes.tabButton, classes.recentlyActiveTab)}>
          Recently Active Users 
          <Row>
            <span className={classes.checkbox}>
              <SectionFooterCheckbox onClick={() => setIgnoreLowKarma(!ignoreLowKarma)} value={ignoreLowKarma} label={"Hide Low Karma"} />
            </span>
            <LoadMore {...recentlyActiveLoadMoreProps}/>
          </Row>
        </div>
      </div>

      <table className={classes.table}>
        <thead className={classes.header}>
          <tr>
            <td></td>
            <td>Index</td>
            <td>DisplayName</td>
            <td className={classNames(classes.cell, classes.numberCell, {[classes.selected]: sorting === "karma"})} 
              onClick={() => setSorting("karma")}>
              Total Karma
            </td>
            <td className={classNames(classes.cell, classes.numberCell, {[classes.selected]: sorting === "last20Karma"})} 
              onClick={() => setSorting("last20Karma")}>
              Recent
            </td>
            <td className={classNames(classes.cell, classes.numberCell, {[classes.selected]: sorting === "lastMonthKarma"})} 
              onClick={() => setSorting("lastMonthKarma")}>
              Last Month
            </td>
            <td className={classNames(classes.cell, classes.numberCell, {[classes.selected]: sorting === "downvoters"})} 
              onClick={() => setSorting("downvoters")}>
              Downvoters
            </td>
            <td className={classNames(classes.cell, classes.numberCell, {[classes.selected]: sorting === "lastNotificationsCheck"})} 
              onClick={() => setSorting("lastNotificationsCheck")}>
              Last Checked
            </td>
            <td className={classNames(classes.cell, {[classes.selected]: sorting === "userSortByRateLimitCount"})} 
              onClick={() => setSorting("userSortByRateLimitCount")}>
              Rate Limits
            </td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, i) => {
            const { last20Karma, lastMonthKarma, downvoterCount } = user.recentKarmaInfo;
            return <React.Fragment key={`${user._id}`}>
              <tr key={user._id}>
                <td onClick={() => handleExpand(user._id)} className={classes.expand}>
                  <MetaInfo>{expandId === user._id ? "[ - ]" : "[+]"}</MetaInfo>
                </td>
                <td>{i+1}</td>
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
                      [classes.lowKarma]: last20Karma < 5 && last20Karma >= 0, 
                      [classes.flagged]: last20Karma < 0})}>
                      {last20Karma}
                    </span>
                  </LWTooltip>
                </td>
                <td className={classes.numberCell}>
                  <LWTooltip title={recentKarmaTooltip(user)}>
                    <span className={classNames({
                      [classes.lowKarma]: lastMonthKarma < 5 && lastMonthKarma >= 0, 
                      [classes.flagged]: lastMonthKarma < 0})}>
                      {lastMonthKarma}
                    </span>
                  </LWTooltip>
                </td>
                <td className={classes.numberCell}>
                  <LWTooltip title={downvoterTooltip(user)}>
                    {downvoterCount}
                  </LWTooltip>
                </td>
                <td>
                  <MetaInfo>{user.lastNotificationsCheck && <FormatDate date={user.lastNotificationsCheck} />}</MetaInfo>
                </td>
                <td>
                  <UserAutoRateLimitsDisplay user={user}/>
                </td>
              </tr>
              {expandId === user._id && <tr>
                <td colSpan={6} className={classes.userInfo}>
                  <UsersReviewInfoCard user={user} key={user._id} refetch={refetch} currentUser={currentUser}/>
                </td>
              </tr>}
            </React.Fragment>
          })}
        </tbody>
      </table>
      <div className={classes.loadMore}>
        <LoadMore {...recentlyActiveLoadMoreProps}/>
      </div>
    </div>
  );
};

export default registerComponent('RecentlyActiveUsers', RecentlyActiveUsers, { styles });


