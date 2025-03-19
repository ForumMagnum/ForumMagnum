// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from "../../lib/analyticsEvents";
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments'; 
import { gql, useQuery } from '@apollo/client';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { getCloudinaryThumbnail, PostWithArtGrid, SplashHeaderImageOptions } from '../posts/PostsPage/SplashHeaderImageOptions';
import { defineStyles, useStyles } from '../hooks/useStyles'; 
import { ImageProvider } from '../posts/PostsPage/ImageContext';

const styles = defineStyles("BestOfLessWrongAdmin", (theme: ThemeType) => ({
  root: {
    padding: 50,
    ...theme.typography.body2,
  },
  post: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginBottom: 30,
    '& h3': {
      marginBottom: 6,
    }
  },
  postWrapper: {
    display: "flex",
    gap: '10px',
    flexWrap: "wrap",
    textWrap: "wrap",
  }
}));

export const BestOfLessWrongAdmin = () => { 
  const classes = useStyles(styles);
  const { Loading } = Components;

  const { data, loading: reviewWinnersLoading } = useQuery(gql`
    query GetAllReviewWinners {
      GetAllReviewWinners {
        ...PostsTopItemInfo
      }
    }
    ${fragmentTextForQuery('PostsTopItemInfo')}
  `);
  const reviewWinners = data?.GetAllReviewWinners ?? [];
  const reviewWinnersWithoutArt = reviewWinners.filter((reviewWinner: PostsTopItemInfo) => !reviewWinner.reviewWinner?.reviewWinnerArt);

  const { results: images, loading: imagesLoading } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImagesForYear',
    terms: {
      view: 'allForYear',
      limit: 5000,
    }
  });
  const groupedImages = groupBy(images, (image) => image.post?.title);

  return <div className={classes.root}>
      {(reviewWinnersLoading || imagesLoading) && <Loading/>}
      <div>
        <div>{Object.entries(groupedImages).length} Posts with art</div>
        <div>{reviewWinnersWithoutArt.length} Posts without art</div>
      </div>
      <div>
        {Object.entries(groupedImages).map(([title, images]) => {
        const post = images[0].post;
        return post && <div key={title} className={classes.post}>
          <h2><Link target="_blank" to={postGetPageUrl(post)}>{post.title}</Link></h2>
          <ImageProvider>
            <PostWithArtGrid key={title} post={post} images={images} defaultExpanded={false} />
          </ImageProvider>
        </div>  
        })}
      </div>
      <div>
        {reviewWinnersWithoutArt.map((reviewWinner: PostsTopItemInfo) => {
          return <div key={reviewWinner._id} className={classes.post}>
            <h2><Link target="_blank" to={postGetPageUrl(reviewWinner)}>{reviewWinner.title}</Link></h2>
          </div>
        })}
      </div>
  </div>
}

const BestOfLessWrongAdminComponent = registerComponent('BestOfLessWrongAdmin', BestOfLessWrongAdmin);

declare global {
  interface ComponentTypes {
    BestOfLessWrongAdmin: typeof BestOfLessWrongAdminComponent
  }
}
