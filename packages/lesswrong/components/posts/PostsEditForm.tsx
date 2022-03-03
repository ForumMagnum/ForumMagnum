import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMessages } from '../common/withMessages';
import { Posts } from '../../lib/collections/posts';
import { postGetPageUrl, postGetEditUrl } from '../../lib/collections/posts/helpers';
import { useLocation, useNavigation } from '../../lib/routeUtil'
import NoSsr from '@material-ui/core/NoSsr';
import { styles } from './PostsNewForm';
import { useDialog } from "../common/withDialog";
import {useCurrentUser} from "../common/withUser";
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import {forumTypeSetting, testServerSetting} from "../../lib/instanceSettings";
import { isCollaborative } from '../editor/EditorFormComponent';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';

const PostsEditForm = ({ documentId, eventForm, classes }: {
  documentId: string,
  eventForm: boolean,
  classes: ClassesType,
}) => {
  const { location, query } = useLocation();
  const { history } = useNavigation();
  const { flash } = useMessages();
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  });
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { params } = location; // From withLocation
  const isDraft = document && document.draft;
  const { WrappedSmartForm, PostSubmit, SubmitToFrontpageCheckbox, HeadTags } = Components
  const EditPostsSubmit = (props) => {
    return <div className={classes.formSubmit}>
      {!eventForm && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit
        saveDraftLabel={isDraft ? "Preview" : "Move to Drafts"}
        feedbackLabel={"Get Feedback"}
        {...props}
      />
    </div>
  }
  
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  })
  
  // If logged out, show a login form. (Even if link-sharing is enabled, you still
  // need to be logged into LessWrong with some account.)
  if (!currentUser) {
    return <Components.SingleColumnSection>
      <Components.WrappedLoginForm/>
    </Components.SingleColumnSection>
  }

  // If we only have read access to this post, but it's shared with us,
  // redirect to the collaborative editor.
  if (document
    && document.userId!==currentUser?._id
    && document.sharingSettings
    && !userIsAdmin(currentUser)
    && !currentUser.groups?.includes('sunshineRegiment')
  ) {
    return <Components.PermanentRedirect url={`/collaborateOnPost?postId=${documentId}${query.key ? "&key="+query.key : ""}`} status={302}/>
  }
  
  // If we don't have access at all but a link-sharing key was provided, redirect to the
  // collaborative editor
  if (!document && !loading && query?.key) {
    return <Components.PermanentRedirect url={`/collaborateOnPost?postId=${documentId}&key=${query.key}`} status={302}/>
  }
  
  // If the post has a link-sharing key which is not in the URL, redirect to add
  // the link-sharing key to the URL
  if (document?.linkSharingKey && !(query?.key)) {
    return <Components.PermanentRedirect url={postGetEditUrl(document._id, false, document.linkSharingKey)} status={302}/>
  }
  
  return (
    <div className={classes.postForm}>
      <HeadTags title={document?.title} />
      <NoSsr>
        <WrappedSmartForm
          collection={Posts}
          documentId={documentId}
          queryFragment={getFragment('PostsEditQueryFragment')}
          mutationFragment={getFragment('PostsEditMutationFragment')}
          successCallback={(post, options) => {
            const alreadySubmittedToAF = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(post.userId)
            if (!post.draft && !alreadySubmittedToAF) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost})
            if (options?.submitOptions?.redirectToEditor) {
              history.push(postGetEditUrl(post._id, false, post.linkSharingKey));
            } else {
              history.push({pathname: postGetPageUrl(post)})
              flash({ messageString: `Post "${post.title}" edited.`, type: 'success'});
            }
          }}
          eventForm={eventForm}
          removeSuccessCallback={({ documentId, documentTitle }) => {
            // post edit form is being included from a single post, redirect to index
            // note: this.props.params is in the worst case an empty obj (from react-router)
            if (params._id) {
              history.push('/');
            }

            flash({ messageString: `Post "${documentTitle}" deleted.`, type: 'success'});
            // todo: handle events in collection callbacks
            // this.context.events.track("post deleted", {_id: documentId});
          }}
          showRemove={true}
          submitLabel={isDraft ? "Publish" : "Publish Changes"}
          formComponents={{FormSubmit:EditPostsSubmit}}
          extraVariables={{
            version: 'String'
          }}
          version="draft"
          noSubmitOnCmdEnter
          repeatErrors
        />
      </NoSsr>
    </div>
  );
}

const PostsEditFormComponent = registerComponent('PostsEditForm', PostsEditForm, {styles});

declare global {
  interface ComponentTypes {
    PostsEditForm: typeof PostsEditFormComponent
  }
}
