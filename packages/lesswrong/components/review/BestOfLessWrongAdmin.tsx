import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
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
import Loading from "../vulcan-core/Loading";

const previewWidth = 300;

const rowStyles = defineStyles("BestOfLessWrongAdminRow", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: 'flex', 
    gap: '10px',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageInfo: {
    maxWidth: `calc(100% - ${previewWidth}px)`,
  }
}));

const BestOfLessWrongAdminRow = ({post, images, refetchImages}: {post: {_id: string, slug: string, title: string}, images: ReviewWinnerArtImages[], refetchImages: () => void}) => { 
  const classes = useStyles(rowStyles);
  const { selectedImageInfo, setImageInfo } = useImageContext();
  const previewUrl = selectedImageInfo?.splashArtImageUrl ? getCloudinaryThumbnail(selectedImageInfo.splashArtImageUrl) : null;
  const imageThumbnail = previewUrl && getCloudinaryThumbnail(previewUrl, previewWidth);

  if (!post) {
    return null;
  }

  return <div key={post._id} className={classes.root}>
    {imageThumbnail && <img src={imageThumbnail} />}
    <div className={classes.imageInfo}>
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
      position: 'sticky',
      top: 0,
      zIndex: theme.zIndexes.bestOfLessWrongAdminHeader,
      backgroundColor: theme.palette.background.default,
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

/* 
Display the art for all ReviewWinners created in a given year,
making it easier to quickly make a call for each post.

(Note, because it was a bit annoying to do the fetch otherwise, this is using *createdAt*
date rather than ReviewYear, i.e. 2 years after a ReviewYear)

*/
export const BestOfLessWrongAdmin = () => { 
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  const { data, loading: reviewWinnersLoading } = useQuery(gql(`
    query BestOfLessWrongAdmin {
      GetAllReviewWinners {
        ...PostsTopItemInfo
      }
    }
  `));
  const reviewWinners = data?.GetAllReviewWinners ?? [];
  const reviewWinnersWithoutArt = reviewWinners.filter((reviewWinner: PostsTopItemInfo) => !reviewWinner.reviewWinner?.reviewWinnerArt);

  const { params: { year } } = useLocation()

  const { results: images, loading: imagesLoading, refetch: refetchImages } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImages',
    terms: {
      view: 'allForYear',
      year: parseInt(year),
      limit: 5000,
    },
    skip: !year || !userIsAdmin(currentUser),
  });
  const groupedImages = groupBy(images, (image) => image.postId);
  
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
        {Object.entries(groupedImages).map(([postId, images]) => {
          const post = reviewWinners.find((reviewWinner: PostsTopItemInfo) => reviewWinner._id === postId);
          return post && <ImageProvider key={postId}>
            <BestOfLessWrongAdminRow key={postId} post={post} images={images} refetchImages={refetchImages} />
          </ImageProvider>
        })}
      </div>
      <div>
        {reviewWinnersWithoutArt.map((reviewWinner: PostsTopItemInfo) => {
          return <ImageProvider key={reviewWinner._id}>
            <BestOfLessWrongAdminRow key={reviewWinner._id} post={reviewWinner} images={[]} refetchImages={refetchImages} />
          </ImageProvider>
        })}
      </div>
  </div>
}

export default registerComponent('BestOfLessWrongAdmin', BestOfLessWrongAdmin);


