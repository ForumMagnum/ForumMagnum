import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React, { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { editorStyles, postBodyStyles } from '../../themes/stylePiping'
import NoSSR from 'react-no-ssr';
import { isMissingDocumentError } from '../../lib/utils/errorUtil';
import type { CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    marginBottom: "1em",
  },
  editor: {
    ...editorStyles(theme, postBodyStyles),
    cursor: "text",
    maxWidth: 640,
    position: "relative",
    padding: 0,
    '& li .public-DraftStyleDefault-block': {
      margin: 0
    }
  }
})

// Editor that _only_ gives people access to the ckEditor, without any other post options
const PostCollaborationEditor = ({ classes }: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, Loading } = Components
  const currentUser = useCurrentUser();
  const [editorLoaded, setEditorLoaded] = useState(false)

  const { query: { postId } } = useLocation();

  const { document: post, loading, error } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    fetchPolicy: 'cache-then-network' as any, //TODO
    documentId: postId,
  });
  
  // If logged out, show a login form. (Even if link-sharing is enabled, you still
  // need to be logged into LessWrong with some account.)
  if (!currentUser) {
    return <Components.SingleColumnSection>
      <div>
        Please log in to access this draft
      </div>
      <Components.WrappedLoginForm/>
    </Components.SingleColumnSection>
  }
  
  // Error handling and loading state
  if (error) {
    if (isMissingDocumentError(error)) {
      return <Components.Error404 />
    }
    return <SingleColumnSection>Sorry, you don't have access to this draft</SingleColumnSection>
  }
  
  if (loading || !post) {
    return <Loading/>
  }
  
  // If you're the primary author, redirect to the main editor (rather than the
  // collab editor) so you can edit metadata etc
  if (post?.userId === currentUser._id) {
    return <Components.PermanentRedirect url={`/editPost?postId=${post._id}`}/>
  }
  
  return <SingleColumnSection>
    <div className={classes.title}>{post?.title}</div>
    <Components.PostsAuthors post={post}/>
    <Components.CollabEditorPermissionsNotices post={post}/>
    {/*!post.draft && <div>
      You are editing an already-published post. The primary author can push changes from the edited revision to the <Link to={postGetPageUrl(post)}>published revision</Link>.
    </div>*/}
    <div className={classes.editor}>
      <NoSSR>
        <Components.CKPostEditor
          documentId={postId}
          collectionName="Posts"
          fieldName="contents"
          formType="edit"
          userId={currentUser?._id}
          isCollaborative={true}
          accessLevel={post.myEditorAccess as CollaborativeEditingAccessLevel}
        />
      </NoSSR>
    </div>
  </SingleColumnSection>
};

const PostCollaborationEditorComponent = registerComponent('PostCollaborationEditor', PostCollaborationEditor, {styles});

declare global {
  interface ComponentTypes {
    PostCollaborationEditor: typeof PostCollaborationEditorComponent
  }
}

