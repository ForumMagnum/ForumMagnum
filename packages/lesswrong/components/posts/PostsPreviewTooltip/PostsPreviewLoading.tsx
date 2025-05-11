import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { POST_PREVIEW_WIDTH } from './helpers';
import Loading from "../../vulcan-core/Loading";

export const notificationLoadingStyles = (theme: ThemeType) => ({
  width: POST_PREVIEW_WIDTH,
  paddingTop: theme.spacing.unit,
  paddingBottom: theme.spacing.unit,
});

const styles = (theme: ThemeType) => ({
  loading: {
    ...notificationLoadingStyles(theme),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
  },
});

const PostsPreviewLoading = ({classes}: {classes: ClassesType<typeof styles>}) => {
  return (
    <div className={classes.loading}>
      <Loading/>
    </div>
  );
}

export default registerComponent(
  'PostsPreviewLoading',
  PostsPreviewLoading,
  {styles},
);


