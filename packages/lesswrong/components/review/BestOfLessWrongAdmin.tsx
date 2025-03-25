import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments'; 
import { gql, useQuery, useMutation } from '@apollo/client';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { getCloudinaryThumbnail, PostWithArtGrid } from '../posts/PostsPage/BestOfLessWrong/PostWithArtGrid';
import { defineStyles, useStyles } from '../hooks/useStyles'; 
import { ImageProvider, useImageContext } from '../posts/PostsPage/ImageContext';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import GenerateImagesButton from './GenerateImagesButton';
import { useLocation } from '@/lib/routeUtil'; 

const rowStyles = defineStyles("BestOfLessWrongAdminRow", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: 'flex', 
    gap: '10px',
    alignItems: 'flex-start',
  }
}));

const BestOfLessWrongAdminRow = ({post, images, refetchImages}: {post: {_id: string, slug: string, title: string}, images: ReviewWinnerArtImages[], refetchImages: () => void}) => { 
  const classes = useStyles(rowStyles);
  const { selectedImageInfo, setImageInfo } = useImageContext();
  const previewUrl = selectedImageInfo?.splashArtImageUrl ? getCloudinaryThumbnail(selectedImageInfo.splashArtImageUrl) : null;
  const imageThumbnail = previewUrl && getCloudinaryThumbnail(previewUrl);

  return post && <div key={post._id} className={classes.root}>
    {imageThumbnail && <img src={imageThumbnail} />}
    <div>
      <h2>
        <Link target="_blank" to={postGetPageUrl(post)}>{post.title}</Link>
      </h2>
      <GenerateImagesButton 
        postId={post._id}
        allowCustomPrompt={true}
        buttonText="Generate More Images"
        onComplete={refetchImages}
      />
      <PostWithArtGrid key={post._id} post={post} images={images} defaultExpanded={false} />
    </div>  
  </div>
}


const styles = defineStyles("BestOfLessWrongAdmin", (theme: ThemeType) => ({
  root: {
    paddingLeft: 50,
    paddingRight: 50,
    ...theme.typography.body2,
    '& h2': {
      marginTop: 10,
      marginBottom: 0,
    }
  },
  post: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: 'flex', 
    gap: '10px',
    alignItems: 'flex-start',
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
  },
  generateButton: {
    padding: '10px 0',
    display: 'block',
    color: theme.palette.primary.dark,
    backgroundColor: 'transparent',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    }
  },
  loadingText: {
    marginLeft: 10,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
  }
}));

export const BestOfLessWrongAdmin = () => { 
  const classes = useStyles(styles);
  const { Loading } = Components;
  
  const currentUser = useCurrentUser();

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

  const { params: { year } } = useLocation()

  const { results: images, loading: imagesLoading, refetch: refetchImages } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImagesForYear',
    terms: {
      view: 'allForYear',
      year: parseInt(year),
      limit: 5000,
    },
    skip: !year,
  });
  const groupedImages = groupBy(images, (image) => image.post?.title);
  
  if (!userIsAdmin(currentUser)) {
    return <div>You are not authorized to view this page</div>
  }

  return <div className={classes.root}>
    <h1>Best of LessWrong Admin</h1>
    <p>Showing art created in {year}</p>
      {(reviewWinnersLoading || imagesLoading) && <Loading/>}
      <div>
        <div>{Object.entries(groupedImages).length} Posts with art</div>
        <div>{reviewWinnersWithoutArt.length} Posts without art</div>
      </div>
      <div>
        {Object.entries(groupedImages).map(([title, images]) => {
          const post = images[0].post;
          return post && <ImageProvider key={title}>
            <BestOfLessWrongAdminRow key={title} post={post} images={images} refetchImages={refetchImages} />
          </ImageProvider>
        })}
      </div>
      <div>
        {reviewWinnersWithoutArt.map((reviewWinner: PostsTopItemInfo) => {
          return <div key={reviewWinner._id} className={classes.post}>
            <h2>
              <Link target="_blank" to={postGetPageUrl(reviewWinner)}>{reviewWinner.title}</Link>
            </h2>
              <GenerateImagesButton 
                postId={reviewWinner._id}
                allowCustomPrompt={true}
                onComplete={refetchImages}
              />
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
