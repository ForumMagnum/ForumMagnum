import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { getPostPreviewWidth } from './helpers';
import Loading from "../../vulcan-core/Loading";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

export const notificationLoadingStyles = (theme: ThemeType) => ({
  width: getPostPreviewWidth(),
  paddingTop: 8,
  paddingBottom: 8,
});

const styles = defineStyles('PostsPreviewLoading', (theme: ThemeType) => ({
  loading: {
    ...notificationLoadingStyles(theme),
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    border: `1px solid ${theme.palette.grey[120]}`,
    boxShadow: theme.palette.boxShadow.eaCard,
  },
}));

const PostsPreviewLoading = () => {
  const classes = useStyles(styles);

  return (
    <div className={classes.loading}>
      <Loading/>
    </div>
  );
}

export default PostsPreviewLoading;


