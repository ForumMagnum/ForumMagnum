import React from 'react';
import { registerComponent } from '../../../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { PostWithArtGrid } from './PostWithArtGrid';
import GenerateImagesButton from '@/components/review/GenerateImagesButton';
import Loading from "../../../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const ReviewWinnerArtImagesMultiQuery = gql(`
  query multiReviewWinnerArtSplashImageEditingOptionsQuery($selector: ReviewWinnerArtSelector, $limit: Int, $enableTotal: Boolean) {
    reviewWinnerArts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ReviewWinnerArtImages
      }
      totalCount
    }
  }
`);

const styles = defineStyles("SplashImageEditingOptions", (theme: ThemeType) => ({
  root: { 
    zIndex: theme.zIndexes.splashHeaderImageOptions,
    marginBottom: '40px', 
    gap: '10px',
    width: 'calc(100vw - 40px)',
    flexWrap: 'wrap',
    backgroundColor: theme.palette.background.paper,
    padding: 20,
    ...theme.typography.body2,
  },
  postWithArtGridContainer: {
    ...theme.typography.body2,
    backgroundColor: theme.palette.background.paper,
  },
  imageContainer: {
    width: '200px',
    height: 'auto',
    cursor: 'pointer',
    paddingRight: 5,
  },
  image: { 
    maxWidth: '100%',
    height: 'auto'
  },
}));

export const SplashImageEditingOptions = ({ post }: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
}) => {
  const classes = useStyles(styles);

  const { data, loading } = useQuery(ReviewWinnerArtImagesMultiQuery, {
    variables: {
      selector: { postArt: { postId: post._id } },
      limit: 200,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const images = data?.reviewWinnerArts?.results;

  return (
    <div className={classes.root}>
      <GenerateImagesButton postId={post._id} allowCustomPrompt={true} />
      {images && <div className={classes.postWithArtGridContainer}><PostWithArtGrid post={post} images={images} defaultExpanded={true} /></div>}
      {loading && <Loading />}
    </div>
  );
};

export default registerComponent('SplashImageEditingOptions', SplashImageEditingOptions);


