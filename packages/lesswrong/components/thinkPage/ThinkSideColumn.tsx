// TODO: Import component in components.ts
import React, { useState } from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import moment from 'moment';
import { gql, useQuery } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { useLocation, useNavigate } from '@/lib/routeUtil';
import { useMulti } from '@/lib/crud/withMulti';
import { useCreate } from '@/lib/crud/withCreate';
import { getThinkUrl } from './ThinkLink';
import { ToCData } from '@/lib/tableOfContents';

export type WebsiteData = {
  postId: string;
  postSlug: string;
};

export type PostData = PostsListWithVotes & {
  lastVisitedAt: Date;
};

export type AllPostData = PostData | WebsiteData;

const styles = (theme: ThemeType) => ({
  root: {
    width: 370,
    padding: 16,
    paddingRight: 100,
    position: 'absolute',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    ...theme.typography.body2,
    '& h3': {
      marginTop: 10,
      marginBottom: 10,
      fontSize: '1.1rem',
      opacity: .7,
      fontStyle: 'italic',
    },
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
    '&:hover $historyContainer': {
      opacity: 1,
    },
  },
  historyContainer: {
    opacity: 0,
    transition: 'opacity 0.15s ease-in-out',
  },
  icon: {
    cursor: 'pointer',
    height: 20,
    width: 20,
    opacity: .5,
    '&:hover': {
      opacity: .7,
    },
  }
});

const getSideItems = (readHistory: PostsListWithVotes[], drafts: PostsListWithVotes[]) => {
  const allPosts = [...readHistory, ...drafts].sort((a, b) => {
    const aDate = moment(a.modifiedAt || a.lastVisitedAt)
    const bDate = moment(b.modifiedAt || b.lastVisitedAt)
    if (aDate.isBefore(bDate)) return 1
    if (aDate.isAfter(bDate)) return -1
    return 0
  })

  // group the posts by last read "Today", "Yesterday", and "Older"
  const todaysPosts = allPosts.filter(post => {
    const date = post.modifiedAt || post.lastVisitedAt;
    return moment(date).isSame(moment(), 'day');
  })
  const yesterdaysPosts = allPosts.filter(post => {
    const date = post.modifiedAt || post.lastVisitedAt;
    return moment(date).isSame(moment().subtract(1, 'day'), 'day');
  })
  const olderPosts = allPosts.filter(post => {
    const date = post.modifiedAt || post.lastVisitedAt;
    return moment(date).isBefore(moment().subtract(1, 'day'), 'day');
  })

  return { todaysPosts, yesterdaysPosts, olderPosts }
}

const identifyDocument = (document?: PostsListWithVotes | SequencesPageWithChaptersFragment) => {
  if (!document) return ""
  if ('score' in document) return 'Post'
  return 'Sequence'
}

export const ThinkSideColumn = ({classes, document, sectionData}: {
  classes: ClassesType<typeof styles>,
  document?: SequencesPageWithChaptersFragment | PostsPage,
  sectionData?: ToCData | null
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const [active, setActive] = useState(false);

  const limit = query.limit ? parseInt(query.limit) : 100;

  // TODO: Add back in  
  // const currentSorting = query.sortDraftsBy ?? query.view ?? currentUser?.draftsListSorting ?? "lastModified";
  // const { results: drafts = [], loading: draftsLoading, loadMoreProps: draftsLoadMoreProps } = useMulti({
  //   terms: {
  //     view: "drafts",
  //     userId: currentUser?._id,
  //     sortDraftsBy: currentSorting,
  //     limit,
  //   },
  //   collectionName: "Posts",
  //   fragmentName: 'PostsListWithVotes',
  //   fetchPolicy: 'cache-and-network',
  //   nextFetchPolicy: "cache-first",
  // });

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

  const { todaysPosts, yesterdaysPosts, olderPosts } = getSideItems(readHistoryArray, [])

  const { create: createPost, loading: createPostLoading } = useCreate({
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
  })

  const { create: createSequence, loading: createSequenceLoading } = useCreate({
    collectionName: "Sequences",
    fragmentName: "SequencesPageWithChaptersFragment",
  })


  const navigate = useNavigate();

  const handleNewPostClick = async () => {
    if (!currentUser) return;
    const createResult = await createPost({
      data: {
        title: "Untitled Post",
        userId: currentUser._id,
        draft: true,
      }
    })
    if (!createResult) return;
    if (createResult?.data?.createPost?.data) {
      const post = createResult.data.createPost.data; 
      void navigate(getThinkUrl(post))
    }
  }

  const handleNewSequenceClick = async () => {
    if (!currentUser) return;
    const createResult = await createSequence({
      data: {
        title: "Untitled Sequence",
        userId: currentUser._id,
        draft: true,
      }
    })
    if (!createResult) return;
    if (createResult?.data?.createSequence?.data) {
      const sequence = createResult.data.createSequence.data; 
      void navigate(getThinkUrl(sequence))
    }
  }

  const { ThinkSideItem, ForumIcon, Row, Loading, ThinkSidePost, ThinkSideSequence, LWTooltip } = Components

  let documentSideComponent
  if (identifyDocument(document) === 'Post') {
    documentSideComponent = <ThinkSidePost post={document as PostsPage} sectionData={sectionData} />
  } else if (identifyDocument(document) === 'Sequence') {
    documentSideComponent = <ThinkSideSequence sequence={document as SequencesPageWithChaptersFragment} />
  }

  return <div className={classes.root}>
    <Row gap={8} justifyContent="flex-start">
      <LWTooltip title="Create a new post">
        <ForumIcon icon="Document" className={classes.icon} onClick={handleNewPostClick} /></LWTooltip>
      <LWTooltip title="Create a new sequence">
        <ForumIcon icon="Book" className={classes.icon} onClick={handleNewSequenceClick} /></LWTooltip>
      {createPostLoading && <Loading />}
    </Row>
    {documentSideComponent}
    <div className={classes.historyContainer}>
      {todaysPosts.length > 0 && <>
        <h3>Today</h3>
        {todaysPosts.map(post => <ThinkSideItem key={post._id} post={post} />)}
      </>}
      {yesterdaysPosts.length > 0 && <>
        <h3>Yesterday</h3>
        {yesterdaysPosts.map(post => <ThinkSideItem key={post._id} post={post} />)}
      </>}
      {olderPosts.length > 0 && <>
        <h3>Older</h3>
        {olderPosts.map(post => <ThinkSideItem key={post._id} post={post} />)}
      </>}
    </div>
  </div>;
}

const ThinkSideColumnComponent = registerComponent('ThinkSideColumn', ThinkSideColumn, {styles});

declare global {
  interface ComponentTypes {
    ThinkSideColumn: typeof ThinkSideColumnComponent
  }
}
