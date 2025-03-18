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
import { getCloudinaryThumbnail, PostWithArtRow, SplashHeaderImageOptions } from '../posts/PostsPage/SplashHeaderImageOptions';
import { defineStyles, useStyles } from '../hooks/useStyles'; 

const styles = defineStyles("BestOfLessWrongAdmin", (theme: ThemeType) => ({
  root: {
    padding: 50,
    ...theme.typography.body2,
  },
  post: {
    display: "flex",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    padding: 3
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

  const { results: images, loading } = useMulti({
    collectionName: 'ReviewWinnerArts',
    fragmentName: 'ReviewWinnerArtImagesForYear',
    terms: {
      view: 'allForYear',
      limit: 100,
    }
  });

  const groupedImages = groupBy(images, (image) => image.post?.title);

  return <div className={classes.root}>
    {Object.entries(groupedImages).map(([title, images]) => {
      return images[0].post && <PostWithArtRow key={title} post={images[0].post} images={images} />
    })}
  </div>
}

const BestOfLessWrongAdminComponent = registerComponent('BestOfLessWrongAdmin', BestOfLessWrongAdmin);

declare global {
  interface ComponentTypes {
    BestOfLessWrongAdmin: typeof BestOfLessWrongAdminComponent
  }
}
