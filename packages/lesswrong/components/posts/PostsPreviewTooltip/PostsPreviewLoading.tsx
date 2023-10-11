import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { POST_PREVIEW_WIDTH } from './helpers';

export const notificationLoadingStyles = (theme: ThemeType): JssStyles => ({
  width: POST_PREVIEW_WIDTH,
  paddingTop: theme.spacing.unit,
  paddingBottom: theme.spacing.unit,
});

const styles = (theme: ThemeType): JssStyles => ({
  loading: {
    ...notificationLoadingStyles(theme)
  },
});

const PostsPreviewLoading = ({classes}: {classes: ClassesType}) => {
  const {Loading} = Components;
  return (
    <div className={classes.loading}>
      <Loading/>
    </div>
  );
}

const PostsPreviewLoadingComponent = registerComponent(
  'PostsPreviewLoading',
  PostsPreviewLoading,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsPreviewLoading: typeof PostsPreviewLoadingComponent
  }
}
