import React from 'react'
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";
import { AUTHOR_MARKER_STYLES } from './authorMarkerStyles';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsCoauthor', (_: ThemeType) => ({
  markers: AUTHOR_MARKER_STYLES,
}));

const PostsCoauthor = ({coauthor, pageSectionContext, disableNoKibitz}: {
  coauthor: UsersMinimumInfo,
  pageSectionContext?: string,
  disableNoKibitz?: boolean,
}) => {
  const classes = useStyles(styles);

  return (
    <>
      , <UsersName user={coauthor} pageSectionContext={pageSectionContext} disableNoKibitz={disableNoKibitz} />
      <UserCommentMarkers user={coauthor} className={classes.markers} />
    </>
  );
}

export default PostsCoauthor;


