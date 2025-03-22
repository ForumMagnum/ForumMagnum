import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments'; 
import { gql, useQuery, useMutation } from '@apollo/client';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { useMulti } from '@/lib/crud/withMulti';
import groupBy from 'lodash/groupBy';
import { PostWithArtGrid } from '../posts/PostsPage/BestOfLessWrong/SplashHeaderImageOptions';
import { defineStyles, useStyles } from '../hooks/useStyles'; 
import { ImageProvider } from '../posts/PostsPage/ImageContext';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

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
  
  // Track which posts are currently generating images
  const [generatingPosts, setGeneratingPosts] = useState<Record<string, boolean>>({});

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

  const { results: images, loading: imagesLoading, refetch: refetchImages } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImagesForYear',
    terms: {
      view: 'allForYear',
      limit: 5000,
    }
  });
  const groupedImages = groupBy(images, (image) => image.post?.title);
  
  // Define mutation for generating cover images
  const [generateCoverImages] = useMutation(gql`
    mutation GenerateCoverImagesForPost($postId: String!) {
      generateCoverImagesForPost(postId: $postId)
    }
  `);
  
  // Function to handle generating cover images for a post
  const handleGenerateCoverImages = async (postId: string) => {
    try {
      setGeneratingPosts(prev => ({ ...prev, [postId]: true }));
      const results = await generateCoverImages({ variables: { postId } });
      console.log("results", results);
      await refetchImages();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating cover images:", error);
    } finally {
      setGeneratingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  if (!userIsAdmin(currentUser)) {
    return <div>You are not authorized to view this page</div>
  }

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
          <h2>
            <Link target="_blank" to={postGetPageUrl(post)}>{post.title}</Link>
            <button 
              className={classes.generateButton}
              onClick={() => handleGenerateCoverImages(post._id)}
              disabled={generatingPosts[post._id]}
            >
              Generate More Images
            </button>
            {generatingPosts[post._id] && <span className={classes.loadingText}>Generating...</span>}
          </h2>
          <ImageProvider>
            <PostWithArtGrid key={title} post={post} images={images} defaultExpanded={false} />
          </ImageProvider>
        </div>  
        })}
      </div>
      <div>
        {reviewWinnersWithoutArt.map((reviewWinner: PostsTopItemInfo) => {
          return <div key={reviewWinner._id} className={classes.post}>
            <h2>
              <Link target="_blank" to={postGetPageUrl(reviewWinner)}>{reviewWinner.title}</Link>
              <button 
                className={classes.generateButton}
                onClick={() => handleGenerateCoverImages(reviewWinner._id)}
                disabled={generatingPosts[reviewWinner._id]}
              >
                Generate Images
              </button>
              {generatingPosts[reviewWinner._id] && <span className={classes.loadingText}>Generating...</span>}
            </h2>
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
