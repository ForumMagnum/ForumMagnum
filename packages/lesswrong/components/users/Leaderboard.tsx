import React, { useState } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { gql, NetworkStatus, useQuery } from "@apollo/client";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";

const styles = defineStyles("Leaderboard", (theme: ThemeType) => ({
  container: {
    display: "flex",
    gap: "2rem",
    justifyContent: "center"
  },
  column: {
    flex: 1,
    maxWidth: 800
  },
  heading: {
    textAlign: "center"
  },
  table: {
    borderCollapse: "collapse",
    width: 300,
    margin: "0 auto",
    textAlign: "center"
  },
  headerCell: {
    padding: 8,
    paddingLeft: 16
  },
  headerCenter: {
    composes: '$headerCell',
    textAlign: "center"
  },
  headerLeft: {
    composes: '$headerCell',
    textAlign: "left"
  },
  headerRight: {
    composes: '$headerCell',
    textAlign: "right"
  },
  cell: {
    padding: 8
  },
  cellCenter: {
    composes: '$cell',
    textAlign: "center"
  },
  cellLeft: {
    composes: '$cell',
    textAlign: "left"
  },
  cellRight: {
    composes: '$cell',
    textAlign: "right"
  },
  loadMoreContainer: {
    textAlign: "center",
    marginTop: 16
  },
  noResults: {
    textAlign: "center"
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing.unit * 2,
    gap: theme.spacing.unit,
  },
  toggleButton: {
    padding: '8px 16px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    background: 'transparent',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.grey[100],
    },
  },
  activeToggle: {
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
}));

type NetKarmaChangesResult = {
  NetKarmaChangesForAuthorsOverPeriod: { userId: string; netKarma: number }[];
};

const Leaderboard = () => {
  const { ErrorBoundary, Loading, UsersNameDisplay, UsersName, LoadMore } = Components;
  const classes = useStyles(styles);
  const [timeframe, setTimeframe] = useState<'allTime' | '30days'>('allTime');

  const {
    results: topKarmaUsers,
    loading: topKarmaLoading,
    loadMoreProps,
  } = useMulti({
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    terms: { view: "usersTopKarma" },
    itemsPerPage: 15,
    enableTotal: true,
    limit: 15,
  });

  const {
    data: last30DaysData,
    loading: last30DaysLoading,
    fetchMore,
    networkStatus,
  } = useQuery<NetKarmaChangesResult>(gql`
    query getNetKarmaChangesForAuthorsOverPeriod($days: Int!, $limit: Int!) {
      NetKarmaChangesForAuthorsOverPeriod(days: $days, limit: $limit) {
        userId
        netKarma
      }
    }
  `, {
    variables: {
      days: 30,
      limit: 15,
    },
  });

  const last30DaysResults = last30DaysData?.NetKarmaChangesForAuthorsOverPeriod || [];

  const loading = timeframe === 'allTime' ? topKarmaLoading : last30DaysLoading;

  if (loading) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <div className={classes.container}>
        <div className={classes.column}>
          <div className={classes.toggleContainer}>
            <button 
              className={classNames(classes.toggleButton, {[classes.activeToggle]: timeframe === 'allTime'})}
              onClick={() => setTimeframe('allTime')}
            >
              All Time
            </button>
            <button 
              className={classNames(classes.toggleButton, {[classes.activeToggle]: timeframe === '30days'})}
              onClick={() => setTimeframe('30days')}
            >
              Last 30 Days
            </button>
          </div>
          
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.headerCenter}>#</th>
                <th className={classes.headerLeft}>User</th>
                <th className={classes.headerRight}>Karma</th>
              </tr>
            </thead>
            {timeframe === 'allTime' ? (
              <>
              <tbody>
              {(topKarmaUsers || []).map((entry, i) => (
                <tr key={entry._id}>
                  <td className={classes.cellCenter}>{i + 1}</td>
                  <td className={classes.cellLeft}>
                    <UsersNameDisplay user={entry} />
                  </td>
                  <td className={classes.cellRight}>
                    {entry.karma.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <LoadMore
                {...loadMoreProps}
              />
            </>
            ) : (
              <>
              <tbody>
              {(last30DaysData?.NetKarmaChangesForAuthorsOverPeriod || []).map((entry, i) => (
                <tr key={entry.userId}>
                  <td className={classes.cellCenter}>{i + 1}</td>
                  <td className={classes.cellLeft}>
                    <UsersName documentId={entry.userId} />
                  </td>
                  <td className={classes.cellRight}>
                    {entry.netKarma.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <LoadMore
              loading={networkStatus === NetworkStatus.fetchMore}
              loadMore={() => {
                void fetchMore({
                  variables: {
                    limit: last30DaysResults.length + 15,
                  },
                  updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
                })
              }}
             />
            </>
            )}
          </table>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Register component with Vulcan
const LeaderboardComponent = registerComponent("Leaderboard", Leaderboard);

// Declare it globally so that "Leaderboard" is recognized in the ComponentTypes interface
declare global {
  interface ComponentTypes {
    Leaderboard: typeof LeaderboardComponent;
  }
}

// Default export
export default LeaderboardComponent;
