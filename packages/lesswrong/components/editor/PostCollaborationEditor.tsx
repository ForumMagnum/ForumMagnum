import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { getPostCollaborateUrl, canUserEditPostMetadata, postGetEditUrl, isNotHostedHere } from '../../lib/collections/posts/helpers';
import { editorStyles, ckEditorStyles } from '../../themes/stylePiping'
import { isMissingDocumentError } from '../../lib/utils/errorUtil';
import type { CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { gql } from '@apollo/client';
import { useQuery } from '@/lib/crud/useQuery';
import DeferRender from '../common/DeferRender';

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, Loading, ContentStyles, ErrorAccessDenied, PermanentRedirect, ForeignCrosspostEditForm, PostVersionHistoryButton } = Components
  const currentUser = useCurrentUser();

  const { query: { postId, key } } = useLocation();

  const { data, loading, error } = useQuery(gql`
    query LinkSharingQuery($postId: String!, $linkSharingKey: String!) {
      getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
        ...PostsEdit
      }
    }
    ${fragmentTextForQuery("PostsEdit")}
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
  
  if (loading) {
    return <Loading/>
  }
  
  if (!post) {
    // This branch is most commonly expected for users who were shared on the post, 
    // but whose editing privileged have explicitly been set to "None"
    return <ErrorAccessDenied/> 
  }

  // If you're the primary author, an admin, or have edit permissions, redirect to the main editor (rather than the
  // collab editor) so you can edit metadata etc
  if (canUserEditPostMetadata(currentUser, post)) {
      return <PermanentRedirect url={postGetEditUrl(post._id, false, post.linkSharingKey ?? undefined)}/>
  }

  // If the post has a link-sharing key which is not in the URL, redirect to add
  // the link-sharing key to the URL
  // NOTE: this only works if you're the primary author, an admin, or have already been added to `linkSharingKeyUsedBy`
  // by previously accessing the post using the link-sharing key, due to the linkSharingKey read permissions.
  // If someone else knows the post ID, they shouldn't be able to view the post.
  if (post.linkSharingKey && !key) {
    return <PermanentRedirect url={getPostCollaborateUrl(post._id, false, post.linkSharingKey)} status={302}/>
  }

  if (isNotHostedHere(post)) {
    return <ForeignCrosspostEditForm post={post} />;
  }

  return <SingleColumnSection>
    <div className={classes.title}>{post.title}</div>
    <Components.PostsAuthors post={post}/>
    <Components.CollabEditorPermissionsNotices post={post}/>
    {/*!post.draft && <div>
      You are editing an already-published post. The primary author can push changes from the edited revision to the <Link to={postGetPageUrl(post)}>published revision</Link>.
    </div>*/}
    <ContentStyles className={classes.editor} contentType="post">
      <DeferRender ssr={false}>
        <Components.CKPostEditor
          documentId={postId}
          collectionName="Posts"
          fieldName="contents"
          formType="edit"
          userId={currentUser?._id}
          isCollaborative={true}
          accessLevel={post.myEditorAccess as CollaborativeEditingAccessLevel}
          document={post}
          onReady={()=>{}}
        />
        <PostVersionHistoryButton
          post={post}
          postId={postId}
        />
      </DeferRender>
    </ContentStyles>
  </SingleColumnSection>
};

const PostCollaborationEditorComponent = registerComponent('PostCollaborationEditor', PostCollaborationEditor, {styles});

declare global {
  interface ComponentTypes {
    PostCollaborationEditor: typeof PostCollaborationEditorComponent
  }
}
