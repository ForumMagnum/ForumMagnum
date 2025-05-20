import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../common/withMessages';
import { postGetPageUrl, postGetEditUrl, getPostCollaborateUrl, isNotHostedHere, canUserEditPostMetadata } from '../../lib/collections/posts/helpers';
import { useDialog } from "../common/withDialog";
import {useCurrentUser} from "../common/withUser";
import { useUpdate } from "../../lib/crud/withUpdate";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { userIsPodcaster } from '../../lib/vulcan-users/permissions';
import { SHARE_POPUP_QUERY_PARAM } from './PostsPage/constants';
import { isEAForum, isLW } from '../../lib/instanceSettings';
import type { Editor } from '@ckeditor/ckeditor5-core';
import DeferRender from '../common/DeferRender';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import { EditorContext } from './EditorContext';
import Loading from "../vulcan-core/Loading";
import PermanentRedirect from "../common/PermanentRedirect";
import Error404 from "../common/Error404";
import PostsAcceptTos from "./PostsAcceptTos";
import HeadTags from "../common/HeadTags";
import ForeignCrosspostEditForm from "./ForeignCrosspostEditForm";
import RateLimitWarning from "../editor/RateLimitWarning";
import PostForm from "./PostForm";
import DynamicTableOfContents from "./TableOfContents/DynamicTableOfContents";
import NewPostModerationWarning from "../sunshineDashboard/NewPostModerationWarning";
import NewPostHowToGuides from "./NewPostHowToGuides";
import { withDateFields } from '@/lib/utils/dateUtils';

const UsersCurrentPostRateLimitQuery = gql(`
  query PostsEditFormUser($documentId: String, $eventForm: Boolean) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersCurrentPostRateLimit
      }
    }
  }
`);

const PostsEditFormQuery = gql(`
  query PostsEditFormPost($documentId: String, $version: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsEditQueryFragment
      }
    }
  }
`);

const styles = defineStyles("PostsEditForm", (theme: ThemeType) => ({
  postForm: {
    maxWidth: 715,
    margin: "0 auto",

    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },

    "& .vulcan-form .input-draft, & .vulcan-form .input-frontpage": {
      margin: 0,
      [theme.breakpoints.down('xs')]: {
        width:125,
      },

      "& .form-group.row": {
        marginBottom:0,
      },

      "& .checkbox": {
        width: 150,
        margin: "0 0 6px 0",
        [theme.breakpoints.down('xs')]: {
          width: 150,
        }
      }
    },
    "& .document-new .input-frontpage .checkbox": {
      marginBottom: 12,
    },
    "& .document-new .input-draft .checkbox": {
      marginBottom: 12,
    },

    "& .vulcan-form .input-draft": {
      right:115,
      width:125,
      [theme.breakpoints.down('xs')]: {
        bottom: 50,
        right: 0,
        width: 100,

        "& .checkbox": {
          width: 100,
        }
      }
    },

    "& .vulcan-form .input-frontpage": {
      right: 255,
      width: 150,
      [theme.breakpoints.down('xs')]: {
        bottom: 50,
        right: 150,
        width: 100,
      }
    },

    "& .document-edit > div > hr": {
    // Ray Sept 2017:
    // This hack is necessary because SmartForm automatically includes an <hr/> tag in the "delete" menu:
    // path: /packages/vulcan-forms/lib/Form.jsx
      display: "none",
    },

    "& .form-submit": {
      textAlign: "right",
    },
    
    "& .form-input.input-url": {
      margin: 0,
      width: "100%"
    },
    "& .form-input.input-contents": {
      marginTop: 0,
    },
  },
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: 20
  },
  collaborativeRedirectLink: {
    color:  theme.palette.secondary.main
  },
  modNote: {
    [theme.breakpoints.down('xs')]: {
      paddingTop: 20,
    },
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20
  },
}))

const PostsEditForm = ({ documentId, version }: {
  documentId: string,
  version?: string | null,
}) => {
  // return <></>;
  const classes = useStyles(styles);
  const { query } = useLocation();
  const navigate = useNavigate();
  const { flash } = useMessages();
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();

  const [editorState, setEditorState] = useState<Editor|null>(null);

  const { loading, data: dataPost } = useQuery(PostsEditFormQuery, {
    variables: { documentId: documentId, version: version ?? 'draft' },
    fetchPolicy: 'network-only',
  });
  const document = dataPost?.post?.result;

  const { data: dataUser } = useQuery(UsersCurrentPostRateLimitQuery, {
    variables: { documentId: currentUser?._id, eventForm: document?.isEvent },
    skip: !currentUser,
  });
  const userWithRateLimit = dataUser?.user?.result;

  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  });

  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost;

  const isDraft = document && document.draft;
  const wasEverDraft = useRef(isDraft);

  useEffect(() => {
    if (wasEverDraft.current === undefined && isDraft !== undefined) {
      wasEverDraft.current = isDraft;
    }
  }, [isDraft]);
  
  if (!document && loading) {
    return <Loading/>
  }

  // If we only have read access to this post, but it's shared with us,
  // redirect to the collaborative editor.
  if (document && !canUserEditPostMetadata(currentUser, document) && !userIsPodcaster(currentUser)) {
    return <PermanentRedirect url={getPostCollaborateUrl(documentId, false, query.key)} status={302}/>
  }
  
  // If we don't have access at all but a link-sharing key was provided, redirect to the
  // collaborative editor
  if (!document && !loading && query?.key) {
    return <PermanentRedirect url={getPostCollaborateUrl(documentId, false, query.key)} status={302}/>
  }
  
  // If the post has a link-sharing key which is not in the URL, redirect to add
  // the link-sharing key to the URL. (linkSharingKey has field-level
  // permissions so it will only be present if we've either already used the
  // link-sharing key, or have access through something other than link-sharing.)
  if (document?.linkSharingKey && !(query?.key)) {
    return <PermanentRedirect url={postGetEditUrl(document._id, false, document.linkSharingKey)} status={302}/>
  }
  
  // If we don't have the post and none of the earlier cases applied, we either
  // have an invalid post ID or the post is a draft that we don't have access
  // to.
  if (!document) {
    return <Error404/>
  }

  if (isNotHostedHere(document)) {
    return <ForeignCrosspostEditForm post={document} />;
  }

  // on LW, show a moderation message to users who haven't been approved yet
  const postWillBeHidden = isLW && !currentUser?.reviewedByUserId

  return (
    <DynamicTableOfContents title={document.title} rightColumnChildren={isEAForum && <NewPostHowToGuides/>}>
      <div className={classes.postForm}>
        <HeadTags title={document.title} />
        {currentUser && <PostsAcceptTos currentUser={currentUser} />}
        {postWillBeHidden && <NewPostModerationWarning />}
        {rateLimitNextAbleToPost && <RateLimitWarning
          contentType="post"
          lastRateLimitExpiry={rateLimitNextAbleToPost.nextEligible}
          rateLimitMessage={rateLimitNextAbleToPost.rateLimitMessage}
        />}
        <DeferRender ssr={false}>
          <EditorContext.Provider value={[editorState, setEditorState]}>
            <PostForm
              initialData={withDateFields(document, ['createdAt', 'postedAt', 'afDate', 'commentsLockedToAccountsCreatedAfter', 'frontpageDate', 'curatedDate', 'startTime', 'endTime'])}
              onSuccess={(post, options) => {
                const alreadySubmittedToAF = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(post.userId!)
                if (!post.draft && !alreadySubmittedToAF) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost})
                if (options?.submitOptions?.redirectToEditor) {
                  navigate(postGetEditUrl(post._id, false, post.linkSharingKey ?? undefined));
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
              
            />
          </EditorContext.Provider>
        </DeferRender>
      </div>
    </DynamicTableOfContents>
  );
}

export default registerComponent('PostsEditForm', PostsEditForm);


