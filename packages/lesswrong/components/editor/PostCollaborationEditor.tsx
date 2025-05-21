import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { getPostCollaborateUrl, canUserEditPostMetadata, postGetEditUrl, isNotHostedHere } from '../../lib/collections/posts/helpers';
import { editorStyles, ckEditorStyles } from '../../themes/stylePiping'
import { isMissingDocumentError } from '../../lib/utils/errorUtil';
import type { CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { useQuery } from '@apollo/client';
import DeferRender from '../common/DeferRender';
import Error404 from "../common/Error404";
import PostsAuthors from "../posts/PostsPage/PostsAuthors";
import CollabEditorPermissionsNotices from "./CollabEditorPermissionsNotices";
import CKPostEditor from "./CKPostEditor";
import SingleColumnSection from "../common/SingleColumnSection";
import Loading from "../vulcan-core/Loading";
import ContentStyles from "../common/ContentStyles";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import PermanentRedirect from "../common/PermanentRedirect";
import ForeignCrosspostEditForm from "../posts/ForeignCrosspostEditForm";
import PostVersionHistoryButton from './PostVersionHistory';
import { gql } from '@/lib/generated/gql-codegen';

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
  const currentUser = useCurrentUser();

  const { query: { postId, key } } = useLocation();

  const { data, loading, error } = useQuery(gql(`
    query LinkSharingQuery($postId: String!, $linkSharingKey: String!) {
      getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
        ...PostsEdit
      }
    }
  `), {
    variables: {
      postId,
      linkSharingKey: key||"",
    },
    ssr: true,
  });

  // Many downstream components expect something with `contents`, which PostsEdit doesn't have.
  // I don't know whether a bunch of this functionality was just broken in the context of the collaborative editor
  // because the types used to be wrong, or if none of it mattered.
  const post: PostsPage | undefined = data?.getLinkSharedPost ? { ...data.getLinkSharedPost, contents: null } : undefined;
  
  // Error handling and loading state
  if (error) {
    if (isMissingDocumentError(error)) {
      return <Error404 />
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
    <PostsAuthors post={post}/>
    <CollabEditorPermissionsNotices post={post}/>
    {/*!post.draft && <div>
      You are editing an already-published post. The primary author can push changes from the edited revision to the <Link to={postGetPageUrl(post)}>published revision</Link>.
    </div>*/}
    <ContentStyles className={classes.editor} contentType="post">
      <DeferRender ssr={false}>
        <CKPostEditor
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

export default registerComponent('PostCollaborationEditor', PostCollaborationEditor, {styles});


