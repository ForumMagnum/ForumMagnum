import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";
import { AUTHOR_MARKER_STYLES } from './authorMarkerStyles';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsCoauthor', (_: ThemeType) => ({
  markers: AUTHOR_MARKER_STYLES,
}));

const PostsCoauthor = ({coauthor, pageSectionContext}: {
  coauthor: UsersMinimumInfo,
  pageSectionContext?: string,
}) => {
  const classes = useStyles(styles);

  return (
    <>
      , <UsersName user={coauthor} pageSectionContext={pageSectionContext} />
      <UserCommentMarkers user={coauthor} className={classes.markers} />
    </>
  );
}

export default PostsCoauthor;


