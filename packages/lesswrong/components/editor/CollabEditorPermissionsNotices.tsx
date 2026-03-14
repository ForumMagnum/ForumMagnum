import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import UsersName from "../users/UsersName";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('CollabEditorPermissionsNotices', (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    marginTop: 4,
    marginBottom: 12
  }
}));

const CollabEditorPermissionsNotices = ({post}: {
  post: PostsPage,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const canEditAsAdmin = userCanDo(currentUser, 'posts.edit.all');
  return <div className={classes.root}>
    {post.myEditorAccess === "none" && <div>
      {canEditAsAdmin && <span>
        You have not been shared on this post, but you can edit because you are a site moderator. Please use this power sparingly.
      </span>}
    </div>}
    {post.myEditorAccess === "read" && <div>
      {canEditAsAdmin && <span>
        You have been granted read-only access to this post, but can also comment and edit because you are a site moderator. Please use this power sparingly.
      </span>}
      {!canEditAsAdmin && <span>You have read-only access to this post. Contact <UsersName user={post.user}/> if you wish to be added as a collaborator.</span>}
    </div>}
    {post.myEditorAccess === "comment" && <div>
      {canEditAsAdmin && <span>
        You have commenting access to this post, but can also edit because you are a site moderator. Please use this power sparingly.
      </span>}
      {!canEditAsAdmin && <span>
        You have commenting access to this post. Contact <UsersName user={post.user}/> if you wish to be able to edit directly.
      </span>}
    </div>}
  </div>;
}

export default CollabEditorPermissionsNotices;


