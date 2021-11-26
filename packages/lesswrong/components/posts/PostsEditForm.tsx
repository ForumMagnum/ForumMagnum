import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMessages } from '../common/withMessages';
import { Posts } from '../../lib/collections/posts';
import { postGetPageUrl, userHasMinPostKarma } from '../../lib/collections/posts/helpers';
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
  const { WrappedSmartForm, PostSubmit, SubmitToFrontpageCheckbox, SingleColumnSection } = Components
  if (!userHasMinPostKarma(currentUser!)) {
    return (<SingleColumnSection><h2>Your karma is below the threshold for editing posts.</h2></SingleColumnSection>);
  }
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

  
  return (
    <div className={classes.postForm}>
      <NoSsr>
        <WrappedSmartForm
          collection={Posts}
          documentId={documentId}
          queryFragment={getFragment('PostsEdit')}
          mutationFragment={getFragment('PostsEdit')}
          successCallback={post => {
            const alreadySubmittedToAF = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(post.userId)
            if (!post.draft && !alreadySubmittedToAF) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost})
            flash({ messageString: `Post "${post.title}" edited.`, type: 'success'});
            history.push({pathname: postGetPageUrl(post)});
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

