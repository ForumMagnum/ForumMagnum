import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMessages } from '../common/withMessages';
import { Posts } from '../../lib/collections/posts';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useLocation, useNavigation } from '../../lib/routeUtil'
import NoSsr from '@material-ui/core/NoSsr';
import { styles } from './PostsNewForm';
import { useDialog } from "../common/withDialog";
import {useCurrentUser} from "../common/withUser";
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";

const PostsEditForm = ({ documentId, eventForm, classes }: {
  documentId: string,
  eventForm: boolean,
  classes: ClassesType,
}) => {
  const { location } = useLocation();
  const { history } = useNavigation();
  const { flash } = useMessages();
  const { document } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  });
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const { params } = location; // From withLocation
  const isDraft = document && document.draft;
  const { WrappedSmartForm, PostSubmit, SubmitToFrontpageCheckbox } = Components
  const EditPostsSubmit = (props) => {
    return <div className={classes.formSubmit}>
      {!eventForm && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit
        saveDraftLabel={isDraft ? "Save as draft" : "Move to Drafts"}
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
    return <Components.WrappedLoginForm />;
  }

  // If we only have read access to this post, but it's shared with us
  // as a draft, redirect to the collaborative editor.
  if (document && document.draft && document.userId!==currentUser?._id && document.sharingSettings) {
    return <Components.PermanentRedirect url={`/collaborateOnPost?postId=${documentId}`} status={302}/>
  }
  
  return (
    <div className={classes.postForm}>
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
              history.push(`/editPost?postId=${post._id}`);
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

