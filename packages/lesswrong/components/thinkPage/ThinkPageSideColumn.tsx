// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import moment from 'moment';
import { gql, useQuery } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '@/lib/routeUtil';
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {
    width: 260,
    position: 'absolute',
    padding: 16,
    left: 0,
    top: 70,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.unit,
    opacity: 0,
    '&:hover': {
      transition: 'opacity .2s ease-in-out',
      opacity: 1,
    },
    ...theme.typography.body2,
    '& h3': {
      marginTop: 10,
      marginBottom: 10,
      fontSize: '1.1rem',
      opacity: .4,
      fontStyle: 'italic',
    },
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }
});

export const ThinkPageSideColumn = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const currentUser = useCurrentUser();
  const { query } = useLocation();

  const currentSorting = query.sortDraftsBy ?? query.view ?? currentUser?.draftsListSorting ?? "lastModified";

  const limit = query.limit ? parseInt(query.limit) : 10;
  
  const { results: drafts = [], loading: draftsLoading, loadMoreProps: draftsLoadMoreProps } = useMulti({
    terms: {
      view: "drafts",
      userId: currentUser?._id,
      sortDraftsBy: currentSorting,
      limit,
    },
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: "cache-first",
  });

  const { data, loading, fetchMore, networkStatus } = useQuery(gql`
    query getReadHistory($limit: Int) {
      UserReadHistory(limit: $limit) {
        posts {
          ...PostsListWithVotes
          lastVisitedAt
        }
      }
    }
    ${fragmentTextForQuery("PostsListWithVotes")}
    `,
    {
      ssr: true,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-only",
      skip: !currentUser,
      variables: {limit},
      notifyOnNetworkStatusChange: true
    }
  )
  const readHistory: (PostsListWithVotes & {lastVisitedAt: Date})[] = data?.UserReadHistory?.posts ?? []
  const readHistoryArray = Array.from(readHistory)
  const allPosts = [...readHistoryArray, ...drafts]

  // group the posts by last read "Today", "Yesterday", and "Older"
  const todaysPosts = allPosts.filter(post => moment(post.lastVisitedAt).isSame(moment(), 'day'))
  const yesterdaysPosts = allPosts.filter(post => moment(post.lastVisitedAt).isSame(moment().subtract(1, 'day'), 'day'))
  const olderPosts = allPosts.filter(post => moment(post.lastVisitedAt).isBefore(moment().subtract(1, 'day'), 'day'))

  const { ThinkPageSideItem } = Components

  return <div className={classes.root}>
    {todaysPosts.length > 0 && <>
      <h3>Today</h3>
      {todaysPosts.map(post => <ThinkPageSideItem key={post._id} post={post} />)}
    </>}
    {yesterdaysPosts.length > 0 && <>
      <h3>Yesterday</h3>
      {yesterdaysPosts.map(post => <ThinkPageSideItem key={post._id} post={post} />)}
    </>}
    {olderPosts.length > 0 && <>
      <h3>Older</h3>
      {olderPosts.map(post => <ThinkPageSideItem key={post._id} post={post} />)}
    </>}
  </div>;
}

const ThinkPageSideColumnComponent = registerComponent('ThinkPageSideColumn', ThinkPageSideColumn, {styles});

declare global {
  interface ComponentTypes {
    ThinkPageSideColumn: typeof ThinkPageSideColumnComponent
  }
}
