import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMessages } from '../common/withMessages';
import { postGetPageUrl, postGetEditUrl, getPostCollaborateUrl, isNotHostedHere, canUserEditPostMetadata } from '../../lib/collections/posts/helpers';
import { useLocation } from '../../lib/routeUtil'
import NoSSR from 'react-no-ssr';
import { styles } from './PostsNewForm';
import { useDialog } from "../common/withDialog";
import {useCurrentUser} from "../common/withUser";
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import type { SubmitToFrontpageCheckboxProps } from './SubmitToFrontpageCheckbox';
import type { PostSubmitProps } from './PostSubmit';
import { userIsPodcaster } from '../../lib/vulcan-users/permissions';
import { SHARE_POPUP_QUERY_PARAM } from './PostsPage/PostsPage';
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { useNavigate } from '../../lib/reactRouterWrapper';
import moment from 'moment';

const editor : Editor | null = null
export const EditorContext = React.createContext<[Editor | null, (e: Editor) => void]>([editor, _ => {}]);
export const autoArchiveCutoffDays = 24

const PostsEditForm = ({ documentId, classes }: {
  documentId: string,
  classes: ClassesType,
}) => {
  const { query, params } = useLocation();
  const navigate = useNavigate();
  const { flash } = useMessages();
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  });
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  const isDraft = document && document.draft;

  const wasEverDraft = useRef(isDraft);
  useEffect(() => {
    if (wasEverDraft.current === undefined && isDraft !== undefined) {
      wasEverDraft.current = isDraft;
    }
  }, [isDraft]);

  const { WrappedSmartForm, PostSubmit, SubmitToFrontpageCheckbox, HeadTags, ForeignCrosspostEditForm, DialogueSubmit, RateLimitWarning, DynamicTableOfContents, DialogueAutoArchiveNotice, ArchiveNotice } = Components

  const [editorState, setEditorState] = useState<Editor | null>(editor)
  const saveDraftLabel: string = ((post) => {
    if (!post) return "Save Draft"
    if (!post.draft) return "Move to Drafts"
    return "Save Draft"
  })(document)
  
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  })

  const {document: userWithRateLimit} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersCurrentPostRateLimit",
    skip: !currentUser,
    extraVariables: { eventForm: 'Boolean' },
    extraVariablesValues: { eventForm: document?.isEvent }
  });
  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost

  if (!document && loading) {
    return <Components.Loading/>
  }

  // We auto-archive dialogues that have gone stale
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastRevisionAt = document?.lastRevisionAt
  const potentialDialogue = isLWorAF && document?.collabEditorDialogue && document?.draft && !document?.deletedDraft
  const dialogueAutoArchiveNotice = potentialDialogue && !!lastRevisionAt && new Date(lastRevisionAt) < twoWeeksAgo
  const daysLeftUntilAutoArchive = moment(lastRevisionAt).add(autoArchiveCutoffDays, 'days').diff(moment.utc(), 'days')

  const archiveNotice = isLWorAF && document?.deletedDraft

  // If we only have read access to this post, but it's shared with us,
  // redirect to the collaborative editor.
  if (document && !canUserEditPostMetadata(currentUser, document) && !userIsPodcaster(currentUser)) {
    return <Components.PermanentRedirect url={getPostCollaborateUrl(documentId, false, query.key)} status={302}/>
  }
  
  // If we don't have access at all but a link-sharing key was provided, redirect to the
  // collaborative editor
  if (!document && !loading && query?.key) {
    return <Components.PermanentRedirect url={getPostCollaborateUrl(documentId, false, query.key)} status={302}/>
  }
  
  // If the post has a link-sharing key which is not in the URL, redirect to add
  // the link-sharing key to the URL. (linkSharingKey has field-level
  // permissions so it will only be present if we've either already used the
  // link-sharing key, or have access through something other than link-sharing.)
  if (document?.linkSharingKey && !(query?.key)) {
    return <Components.PermanentRedirect url={postGetEditUrl(document._id, false, document.linkSharingKey)} status={302}/>
  }
  
  // If we don't have the post and none of the earlier cases applied, we either
  // have an invalid post ID or the post is a draft that we don't have access
  // to.
  if (!document) {
    return <Components.Error404/>
  }

  if (isNotHostedHere(document)) {
    return <ForeignCrosspostEditForm post={document} />;
  }
  
  const EditPostsSubmit = (props: SubmitToFrontpageCheckboxProps & PostSubmitProps) => {
    return <div className={classes.formSubmit}>
      {!document.isEvent && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit
        saveDraftLabel={saveDraftLabel}
        feedbackLabel={"Get Feedback"}
        {...props}
      />
    </div>
  }

  return (
    <DynamicTableOfContents title={document.title}>
      <div className={classes.postForm}>
        <HeadTags title={document.title} />
        {currentUser && <Components.PostsAcceptTos currentUser={currentUser} />}
        {rateLimitNextAbleToPost && <RateLimitWarning lastRateLimitExpiry={rateLimitNextAbleToPost.nextEligible} rateLimitMessage={rateLimitNextAbleToPost.rateLimitMessage}  />}
        {dialogueAutoArchiveNotice && <DialogueAutoArchiveNotice daysLeft={daysLeftUntilAutoArchive} dialogue={document} />}
        {archiveNotice && <ArchiveNotice post={document} />}
        <NoSSR>
          <EditorContext.Provider value={[editorState, setEditorState]}>
            <WrappedSmartForm
              collectionName="Posts"
              documentId={documentId}
              queryFragment={getFragment('PostsEditQueryFragment')}
              mutationFragment={getFragment('PostsEditMutationFragment')}
              successCallback={(post: any, options: any) => {
                const alreadySubmittedToAF = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(post.userId)
                if (!post.draft && !alreadySubmittedToAF) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost})
                if (options?.submitOptions?.redirectToEditor) {
                  navigate(postGetEditUrl(post._id, false, post.linkSharingKey));
                } else {
                  // If they are publishing a draft, show the share popup
                  // Note: we can't use isDraft here because it gets updated to true when they click "Publish"
                  const showSharePopup = isEAForum && wasEverDraft.current && !post.draft
                  const sharePostQuery = `?${SHARE_POPUP_QUERY_PARAM}=true`
                  navigate({pathname: postGetPageUrl(post), search: showSharePopup ? sharePostQuery : ''})

                  if (!showSharePopup) {
                    flash({ messageString: `Post "${post.title}" edited`, type: 'success'});
                  }
                }
              }}
              eventForm={document.isEvent}
              removeSuccessCallback={({ documentId, documentTitle }: { documentId: string; documentTitle: string; }) => {
                // post edit form is being included from a single post, redirect to index
                // note: this.props.params is in the worst case an empty obj (from react-router)
                if (params._id) {
                  navigate('/');
                }

                flash({ messageString: `Post "${documentTitle}" deleted.`, type: 'success'});
                // todo: handle events in collection callbacks
                // this.context.events.track("post deleted", {_id: documentId});
              }}
              showRemove={true}
              collabEditorDialogue={!!document.collabEditorDialogue}
              submitLabel={isDraft ? "Publish" : "Publish Changes"}
              formComponents={{FormSubmit: !!document.collabEditorDialogue ? DialogueSubmit : EditPostsSubmit}}
              extraVariables={{
                version: 'String'
              }}
              extraVariablesValues={{
                version: 'draft'
              }}
              noSubmitOnCmdEnter
              repeatErrors
              
              /*
              * addFields includes tagRelevance because the field permissions on
              * the schema say the user can't edit this field, but the widget
              * "edits" the tag list via indirect operations (upvoting/downvoting
              * relevance scores).
              */
              addFields={(document.isEvent || !!document.collabEditorDialogue) ? [] : ['tagRelevance']}
            />
          </EditorContext.Provider>
        </NoSSR>
      </div>
    </DynamicTableOfContents>
  );
}

const PostsEditFormComponent = registerComponent('PostsEditForm', PostsEditForm, {styles});

declare global {
  interface ComponentTypes {
    PostsEditForm: typeof PostsEditFormComponent
  }
}
