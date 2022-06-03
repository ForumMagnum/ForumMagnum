import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
});

const CollabEditorPermissionsNotices = ({post, classes}: {
  post: PostsPage,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const canEditAsAdmin = userCanDo(currentUser, 'posts.edit.all');
  const { UsersName } = Components;
  
  return <div>
    {post.myEditorAccess === "none" && <div className={classes.permissionsNotice}>
      {canEditAsAdmin && <span>
        You have not been shared on this post, but you can edit because you are a site moderator. Please use this power sparingly.
      </span>}
    </div>}
    {post.myEditorAccess === "read" && <div className={classes.permissionsNotice}>
      {canEditAsAdmin && <span>
        You have been granted read-only access to this post, but can also comment and edit because you are a site moderator. Please use this power sparingly.
      </span>}
      {!canEditAsAdmin && <span>You have read-only access to this post. Contact <UsersName user={post.user}/> if you wish to be added as a collaborator.</span>}
    </div>}
    {post.myEditorAccess === "comment" && <div className={classes.permissionsNotice}>
      {canEditAsAdmin && <span>
        You have commenting access to this post, but can also edit because you are a site moderator. Please use this power sparingly.
      </span>}
      {!canEditAsAdmin && <span>
        You have commenting access to this post. Contact <UsersName user={post.user}/> if you wish to be able to edit directly.
      </span>}
    </div>}
  </div>;
}

const CollabEditorPermissionsNoticesComponent = registerComponent('CollabEditorPermissionsNotices', CollabEditorPermissionsNotices, {styles});

declare global {
  interface ComponentTypes {
    CollabEditorPermissionsNotices: typeof CollabEditorPermissionsNoticesComponent
  }
}
