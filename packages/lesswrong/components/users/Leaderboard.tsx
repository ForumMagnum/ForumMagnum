import React, { useState } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { gql, NetworkStatus, useQuery } from "@apollo/client";
import { defineStyles, useStyles } from "../hooks/useStyles";
import classNames from "classnames";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import LoadMore from "@/components/common/LoadMore";
import Loading from "@/components/vulcan-core/Loading";
import UsersName from "@/components/users/UsersName";
import UsersNameDisplay from "@/components/users/UsersNameDisplay";

const styles = defineStyles("Leaderboard", (theme: ThemeType) => ({
  pageContainer: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: `${theme.spacing.mainLayoutPaddingTop}px 8px`,
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down("xs")]: {
      padding: 16,
    },
    fontFamily: theme.palette.fonts.sansSerifStack,
    "& a": {
      color: theme.palette.primary.main,
    }
  },
  // Combined typography styles for headers
  header: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    textAlign: "left",
  },
  subTitle: {
    ...theme.typography.body1,
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit * 2,
    marginTop: -theme.spacing.unit * 2,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 2,
  },
  toggleGroup: {
    display: "flex",
    marginRight: theme.spacing.unit * 2,
  },
  toggleButton: {
    padding: "8px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    "&:hover": {
      backgroundColor: theme.palette.grey[100],
    },
  },
  activeToggle: {
    fontWeight: "bold",
  },
  columnsContainer: {
    display: "flex",
    gap: '4px',
    justifyContent: "space-between",
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
    },
  },
  column: {
    flex: 1,
  },
  // Simplified table styles
  table: {
    width: "100%",
    maxWidth: 600,
    margin: "0 auto",
    borderCollapse: "collapse",
    border: `1px solid ${theme.palette.grey[300]}`,
    "& th": {
      fontFamily: theme.palette.fonts.sansSerifStack,
      padding: "12px",
      textAlign: "left",
      height: 44,
      boxSizing: 'border-box',
      borderBottom: `1px solid ${theme.palette.grey[300]}`,
    },
    "& td": {
      ...theme.typography.body2,
      padding: 12,
      borderBottom: `1px solid ${theme.palette.grey[300]}`,
    },
    "& th:nth-child(1), & td:nth-child(1)": {
      width: "10%",
    },
    "& th:nth-child(2), & td:nth-child(2)": {
      width: "60%",
    },
    "& th:nth-child(3), & td:nth-child(3)": {
      width: "30%",
    },
  },
}));

type NetKarmaChangesResult = {
  NetKarmaChangesForAuthorsOverPeriod: { userId: string; netKarma: number }[];
};

type AirtableLeaderboardResult = {
  name: string;
  leaderboardAmount?: number;
};

// Query for the donor (Airtable) leaderboard
const DONOR_LEADERBOARD_QUERY = gql`
  query AirtableLeaderboards {
    AirtableLeaderboards {
      name
      leaderboardAmount
    }
  }
`;

const LeaderboardTable = ({ headers, children }: { headers: string[], children: React.ReactNode }) => {
  const classes = useStyles(styles);
  return (
    <table className={classes.table}>
      <thead>
        <tr>
          {headers.map(header => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      {children}
    </table>
  );
};

type KarmaEntry = {
  userId: string;
  netKarma: number;
};

const Leaderboard = () => {
  const classes = useStyles(styles);
  const [timeframe, setTimeframe] = useState<"allTime" | "30days">("allTime");

  // Query #1: Top Karma Users
  //  - We'll load 50 by default now.
  const {
    results: topKarmaUsers,
    loadMoreProps,
  } = useMulti({
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    terms: { view: "usersTopKarma" },
    itemsPerPage: 50,
    enableTotal: true,
    limit: 50,
  });

  // Query #2: Karma changes in last 30 days (also load 50 by default)
  const { data: last30DaysData, fetchMore, networkStatus } =
    useQuery<NetKarmaChangesResult>(
      gql`
        query getNetKarmaChangesForAuthorsOverPeriod($days: Int!, $limit: Int!) {
          NetKarmaChangesForAuthorsOverPeriod(days: $days, limit: $limit) {
            userId
            netKarma
          }
        }
      `,
      {
        variables: {
          days: 30,
          limit: 50,
        },
      }
    );

  // Query #3: Donor leaderboard (from Airtable) -- load 50 donors to match the user karma query's default.
  const { data: donorData, loading: donorLoading, error: donorError } =
    useQuery<{ AirtableLeaderboards: AirtableLeaderboardResult[] }>(
      DONOR_LEADERBOARD_QUERY
    );

  // We'll separate donors into those with a known numeric donation, and those over 5k with no exact data
  const donors = donorData?.AirtableLeaderboards || [];
  const donorsWithAmounts = donors.filter(
    (entry) => typeof entry.leaderboardAmount === "number"
  );
  const donorsOver5kUnknown = donors.filter(
    (entry) => typeof entry.leaderboardAmount !== "number"
  );

  const last30DaysResults =
    last30DaysData?.NetKarmaChangesForAuthorsOverPeriod ?? [];

  // Add type guard functions
  const isAllTimeEntry = (entry: UsersMinimumInfo | KarmaEntry): entry is UsersMinimumInfo => {
    return '_id' in entry;
  };

  return (
    <ErrorBoundary>
      <div className={classes.pageContainer}>
        <h1 className={classes.header}>Leaderboard</h1>
        <p className={classes.subTitle}>
          Here are our top users and donors to <a href="https://lightconeinfrastructure.com">Lightcone Infrastructure</a>, the organization maintaining LessWrong. Contribute to the site, or <a href="https://lightconeinfrastructure.com/donate">donate</a> to show up here! 
        </p>

        <div className={classes.columnsContainer}>
          {/* Karma Leaderboard Column */}
          <div className={classes.column}>
            <div className={classes.headerRow}>
              <h2 className={classes.header}>
                {timeframe === "allTime" ? "Top Karma Users (All Time)" : "Top Karma Gains (30 Days)"}
              </h2>
              <div className={classes.toggleGroup}>
                {["allTime", "30days"].map((period) => (
                  <div
                    key={period}
                    className={classNames(classes.toggleButton, {
                      [classes.activeToggle]: timeframe === period,
                    })}
                    onClick={() => setTimeframe(period as "allTime" | "30days")}
                  >
                    {period === "allTime" ? "All Time" : "30 Days"}
                  </div>
                ))}
              </div>
            </div>

            <LeaderboardTable headers={["#", "User", "Karma"]}>
              <tbody>
                {(timeframe === "allTime" ? topKarmaUsers : last30DaysResults)?.map((entry, i) => (
                  <tr key={isAllTimeEntry(entry) ? entry._id : entry.userId}>
                    <td>{i + 1}</td>
                    <td>
                      {isAllTimeEntry(entry) 
                        ? <UsersNameDisplay user={entry} />
                        : <UsersName documentId={entry.userId} />
                      }
                    </td>
                    <td>
                      {(isAllTimeEntry(entry) ? entry.karma : entry.netKarma).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </LeaderboardTable>
            
            <LoadMore {...(timeframe === "allTime" ? loadMoreProps : {
              loading: networkStatus === NetworkStatus.fetchMore,
              loadMore: () => {
                void fetchMore({
                  variables: { limit: last30DaysResults.length + 50 },
                  updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult ?? prev,
                });
              }
            })} />
          </div>

          {/* Donor Leaderboard Column */}
          <div className={classes.column}>
            <div className={classes.headerRow}>
              <h2 className={classes.header}>Donor Leaderboard</h2>
            </div>
            {donorLoading ? (
              <Loading />
            ) : donorError ? (
              <p>Error loading donor leaderboard.</p>
            ) : (
              <>
                {donorsWithAmounts.length > 0 && (
                  <LeaderboardTable headers={["#", "Name", "Amount"]}>
                    <tbody>
                      {donorsWithAmounts.map((entry, i) => (
                        <tr key={`${entry.name}-${i}`}>
                          <td>{i + 1}</td>
                          <td>{entry.name}</td>
                          <td>{entry.leaderboardAmount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </LeaderboardTable>
                )}

                {donorsOver5kUnknown.length > 0 && (
                  <LeaderboardTable headers={["Others who have given at least $5k"]}>
                    <tbody>
                        {donorsOver5kUnknown.map((entry, i) => (
                          <tr key={`${entry.name}-over5k-${i}`}>
                            <td>{entry.name}</td>
                          </tr>
                        ))}
                    </tbody>
                  </LeaderboardTable>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Leaderboard;
