"use client";
import React, { useMemo } from 'react';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import groupBy from 'lodash/groupBy';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import Loading from "../vulcan-core/Loading";
import {
  getActiveImage,
  getPostStatus,
  type ReviewPostWithStatus,
} from './reviewAdminViews/types';
import { FocusedView } from './reviewAdminViews/FocusedView';

const ReviewWinnerArtImagesMultiQuery = gql(`
  query multiReviewWinnerArtBestOfLessWrongAdminQuery($selector: ReviewWinnerArtSelector, $limit: Int, $enableTotal: Boolean) {
    reviewWinnerArts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ReviewWinnerArtImages
      }
      totalCount
    }
  }
`);

const styles = defineStyles("BestOfLessWrongAdmin", (theme: ThemeType) => ({
  root: {
    paddingLeft: 24,
    paddingRight: 24,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    margin: 0,
  },
  stats: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
}));

export const BestOfLessWrongAdmin = ({year}: {year: string}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { data, loading: reviewWinnersLoading } = useQuery(gql(`
    query BestOfLessWrongAdmin {
      GetAllReviewWinners {
        ...PostsTopItemInfo
      }
    }
  `));
  
  const reviewWinners = useMemo(() => data?.GetAllReviewWinners ?? [], [data]);

  const { data: dataReviewWinnerArtImages, loading: imagesLoading, refetch: refetchImages } = useQuery(ReviewWinnerArtImagesMultiQuery, {
    variables: {
      selector: { allForYear: { year: parseInt(year) } },
      limit: 5000,
      enableTotal: false,
    },
    skip: !year || !userIsAdmin(currentUser),
    notifyOnNetworkStatusChange: true,
  });

  const images = useMemo(() => dataReviewWinnerArtImages?.reviewWinnerArts?.results ?? [], [dataReviewWinnerArtImages]);
  const groupedImages = useMemo(() => groupBy(images, (image) => image.postId), [images]);

  const posts: ReviewPostWithStatus[] = useMemo(() => {
    // Only include posts that have art generated for the selected year
    return reviewWinners
      .filter((post: PostsTopItemInfo) => groupedImages[post._id]?.length > 0)
      .map((post: PostsTopItemInfo) => {
        const postImages = groupedImages[post._id];
        const activeImage = getActiveImage(postImages);
        const status = getPostStatus(postImages);
        return { post, images: postImages, activeImage, status };
      });
  }, [reviewWinners, groupedImages]);

  const statusCounts = useMemo(() => {
    const counts = { 'needs-selection': 0, 'needs-upscale': 0, 'needs-coordinates': 0, 'review': 0 };
    for (const p of posts) {
      counts[p.status]++;
    }
    return counts;
  }, [posts]);

  if (!userIsAdmin(currentUser)) {
    return <div>You are not authorized to view this page</div>;
  }

  const loading = reviewWinnersLoading || imagesLoading;

  return <div className={classes.root}>
    <div className={classes.header}>
      <h1 className={classes.title}>Best of LessWrong Admin — {year}</h1>
    </div>
    <div className={classes.stats}>
      <span className={classes.statItem}>
        {posts.length} posts total
      </span>
      {statusCounts['needs-selection'] > 0 && <span className={classes.statItem}>
        <span className={classes.statDot} style={{backgroundColor: '#e53935'}} />
        {statusCounts['needs-selection']} need selection
      </span>}
      <span className={classes.statItem}>
        <span className={classes.statDot} style={{backgroundColor: '#f9a825'}} />
        {statusCounts['needs-upscale']} need upscale
      </span>
      <span className={classes.statItem}>
        <span className={classes.statDot} style={{backgroundColor: '#1e88e5'}} />
        {statusCounts['needs-coordinates']} need coordinates
      </span>
      <span className={classes.statItem}>
        <span className={classes.statDot} style={{backgroundColor: '#43a047'}} />
        {statusCounts['review']} ready for review
      </span>
    </div>
    {loading && <Loading />}
    <FocusedView posts={posts} refetchImages={refetchImages} loading={loading} />
  </div>;
};

export default BestOfLessWrongAdmin;
