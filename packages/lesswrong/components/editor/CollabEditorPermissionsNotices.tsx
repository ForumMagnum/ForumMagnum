import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { UsersName } from "../users/UsersName";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    marginTop: 4,
    marginBottom: 12
  }
});

const CollabEditorPermissionsNoticesInner = ({post, classes}: {
  post: PostsPage,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const canEditAsAdmin = userCanDo(currentUser, 'posts.edit.all');
  return <div className={classes.root}>
    {/* Note: admins and moderators are currently redirected from PostCollaborationEditor to PostsEditForm, so many of these are not currently in use. I didn't want to get rid of them yet because I'm not sure our redirection-scheme is exactly right. */}
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

export const CollabEditorPermissionsNotices = registerComponent('CollabEditorPermissionsNotices', CollabEditorPermissionsNoticesInner, {styles});

declare global {
  interface ComponentTypes {
    CollabEditorPermissionsNotices: typeof CollabEditorPermissionsNotices
  }
}
