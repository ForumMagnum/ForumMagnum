import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React, { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { postGetPageUrl, postGetEditUrl } from '../../lib/collections/posts/helpers';
import { editorStyles, postBodyStyles, ckEditorStyles } from '../../themes/stylePiping'
import NoSSR from 'react-no-ssr';
import { isMissingDocumentError } from '../../lib/utils/errorUtil';
import type { CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { useQuery, gql } from '@apollo/client';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    marginBottom: "1em",
  },
  editor: {
    ...editorStyles(theme),
    ...ckEditorStyles(theme),
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
  const { SingleColumnSection, Loading, ContentStyles } = Components
  const currentUser = useCurrentUser();
  const [editorLoaded, setEditorLoaded] = useState(false)

  const { query: { postId, key } } = useLocation();

  const { data, loading, error } = useQuery(gql`
    query LinkSharingQuery($postId: String!, $linkSharingKey: String!) {
      getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
        ...PostsPage
      }
    }
    ${fragmentTextForQuery("PostsPage")}
  `, {
    variables: {
      postId,
      linkSharingKey: key||"",
    },
    ssr: true,
  });
  const post: PostsPage = data?.getLinkSharedPost;
  
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
  if (post?.userId === currentUser?._id) {
    return <Components.PermanentRedirect url={postGetEditUrl(post._id, false, post.linkSharingKey)}/>
  }
  
  return <SingleColumnSection>
    <div className={classes.title}>{post?.title}</div>
    <Components.PostsAuthors post={post}/>
    <Components.CollabEditorPermissionsNotices post={post}/>
    {/*!post.draft && <div>
      You are editing an already-published post. The primary author can push changes from the edited revision to the <Link to={postGetPageUrl(post)}>published revision</Link>.
    </div>*/}
    <ContentStyles className={classes.editor} contentType="post">
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
    </ContentStyles>
  </SingleColumnSection>
};

const PostCollaborationEditorComponent = registerComponent('PostCollaborationEditor', PostCollaborationEditor, {styles});

declare global {
  interface ComponentTypes {
    PostCollaborationEditor: typeof PostCollaborationEditorComponent
  }
}

