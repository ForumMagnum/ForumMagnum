import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { getPostPreviewWidth } from './helpers';
import Loading from "../../vulcan-core/Loading";

export const notificationLoadingStyles = (theme: ThemeType) => ({
  width: getPostPreviewWidth(),
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


