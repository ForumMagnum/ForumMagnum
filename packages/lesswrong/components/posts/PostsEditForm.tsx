import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../common/withMessages';
import { postGetPageUrl, postGetEditUrl, isNotHostedHere } from '../../lib/collections/posts/helpers';
import {useCurrentUser} from "../common/withUser";
import { useAfNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { isEAForum } from '../../lib/instanceSettings';
import { isMissingDocumentError } from '../../lib/utils/errorUtil';
import type { Editor } from '@ckeditor/ckeditor5-core';
import DeferRender from '../common/DeferRender';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { EditorContext } from './EditorContext';
import Loading from "../vulcan-core/Loading";
import PermanentRedirect from "../common/PermanentRedirect";
import Error404 from "../common/Error404";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import PostsAcceptTos from "./PostsAcceptTos";
import ForeignCrosspostEditForm from "./ForeignCrosspostEditForm";
import RateLimitWarning from "../editor/RateLimitWarning";
import PostForm from "./PostForm";
import DynamicTableOfContents from "./TableOfContents/DynamicTableOfContents";
import NewPostModerationWarning from "../sunshineDashboard/NewPostModerationWarning";
import NewPostHowToGuides from "./NewPostHowToGuides";
import { withDateFields } from '@/lib/utils/dateUtils';
import { PostsEditFormQuery } from './queries';
import { StatusCodeSetter } from '../next/StatusCodeSetter';
import { usePathname } from 'next/navigation';
import { SideItemsContainer, SideItemsSidebar } from '../contents/SideItems';
import {
  SHARE_POPUP_QUERY_PARAM,
  CENTRAL_COLUMN_WIDTH,
  RIGHT_COLUMN_WIDTH_WITH_SIDENOTES,
  RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES,
  RIGHT_COLUMN_WIDTH_XS,
  sidenotesHiddenBreakpoint,
} from './PostsPage/constants';
import { useForumType } from '../hooks/useForumType';

const UsersCurrentPostRateLimitQuery = gql(`
  query PostsEditFormUser($documentId: String, $eventForm: Boolean) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersCurrentPostRateLimit
      }
    }
  }
`);

const LinkSharingEditQuery = gql(`
  query LinkSharingEditQuery($postId: String!, $linkSharingKey: String!, $version: String) {
    getLinkSharedPost(postId: $postId, linkSharingKey: $linkSharingKey) {
      ...PostsEditQueryFragment
    }
  }
`);

const styles = defineStyles("PostsEditForm", (theme: ThemeType) => ({
  postForm: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    margin: "0 auto",

    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },

    "& .vulcan-form .input-draft, & .vulcan-form .input-frontpage": {
      margin: 0,
      [theme.breakpoints.down('xs')]: {
        width:125,
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
  reserveSpaceForSidenotes: {
    width: RIGHT_COLUMN_WIDTH_WITH_SIDENOTES,
    [sidenotesHiddenBreakpoint(theme)]: {
      width: RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES,
      [theme.breakpoints.down('xs')]: {
        width: RIGHT_COLUMN_WIDTH_XS,
      },
    },
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

const PostsEditFormInner = ({ documentId, version }: {
  documentId: string,
  version?: string | null,
}) => {
  const classes = useStyles(styles);
  const { isLW } = useForumType();
  const { query } = useLocation();
  const navigate = useNavigate();
  const { flash } = useMessages();
  const currentUser = useCurrentUser();

  const [editorState, setEditorState] = useState<Editor|null>(null);
  const afNonMemberSuccessHandling = useAfNonMemberSuccessHandling();

  const hasLinkSharingKey = !!query.key;

  // Standard query — used when no link-sharing key is present
  const { loading: loadingStandard, data: dataPost } = useQuery(PostsEditFormQuery, {
    variables: { documentId: documentId, version: version ?? 'draft' },
    fetchPolicy: 'network-only',
    skip: hasLinkSharingKey,
  });

  // Link-sharing query — used when a link-sharing key is in the URL. This
  // handles first-time link-sharing visitors who aren't yet in
  // linkSharingKeyUsedBy and wouldn't pass the standard resolver's access check.
  // We still need to pass the version in for the contents field resolver.
  const { loading: loadingLinkShared, data: dataLinkShared, error: linkSharedError } = useQuery(LinkSharingEditQuery, {
    variables: { postId: documentId, linkSharingKey: query.key || "", version: version ?? 'draft' },
    fetchPolicy: 'network-only',
    skip: !hasLinkSharingKey,
  });

  const loading = hasLinkSharingKey ? loadingLinkShared : loadingStandard;
  const document = hasLinkSharingKey
    ? dataLinkShared?.getLinkSharedPost
    : dataPost?.post?.result;

  const [liveTitle, setLiveTitle] = useState("");
  useEffect(() => {
    setLiveTitle(document?.title ?? "");
  }, [document?.title]);

  const { data: dataUser } = useQuery(UsersCurrentPostRateLimitQuery, {
    variables: { documentId: currentUser?._id, eventForm: document?.isEvent },
    skip: !currentUser,
  });
  const userWithRateLimit = dataUser?.user?.result;


  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost;

  const isDraft = document && document.draft;
  const wasEverDraft = useRef(isDraft);

  useEffect(() => {
    if (wasEverDraft.current === undefined && isDraft !== undefined) {
      wasEverDraft.current = isDraft;
    }
  }, [isDraft]);

  if (loading) {
    return <Loading/>
  }

  // Link-sharing query failed (invalid key, or sharing explicitly set to "none")
  if (hasLinkSharingKey && linkSharedError) {
    if (isMissingDocumentError(linkSharedError)) {
      return <Error404/>
    }
    return <ErrorAccessDenied/>
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
  const postWillBeHidden = isLW && !currentUser?.reviewedByUserId && currentUser?._id === document.userId;
  const rightColumnChildren = <>
    {/* We render a portal target div in the right column. PostForm will use
    createPortal to render the EditorSettingsSidebar into this target, since it needs
    access to the TanStack form API which is created inside PostForm. */}
    <div id="editor-settings-portal" />
    <div className={classes.reserveSpaceForSidenotes}/>
    <SideItemsSidebar />
  </>;

  return (<>
    <StatusCodeSetter status={200}/>
    <SideItemsContainer>
    <DynamicTableOfContents title={liveTitle || document.title} rightColumnChildren={rightColumnChildren}>
      <div className={classes.postForm}>
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
              initialData={withDateFields(document, ['postedAt', 'afDate', 'commentsLockedToAccountsCreatedAfter', 'frontpageDate', 'curatedDate', 'startTime', 'endTime'])}
              onTitleChange={setLiveTitle}
              onSuccess={(post, options) => {
                const alreadySubmittedToAF = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(post.userId!)
                if (!post.draft && !alreadySubmittedToAF) afNonMemberSuccessHandling(post);
                if (options?.submitOptions?.skipRedirect) {
                  return;
                } else if (options?.submitOptions?.redirectToEditor) {
                  const redirectPath = postGetEditUrl(post._id, false, post.linkSharingKey ?? undefined);
                  navigate(redirectPath);
                } else {
                  // If they are publishing a draft, show the share popup
                  // Note: we can't use isDraft here because it gets updated to true when they click "Publish"
                  const showSharePopup = isEAForum() && wasEverDraft.current && !post.draft
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
    </SideItemsContainer>
  </>);
}

const PostsEditForm = ({ documentId, version }: {
  documentId: string,
  version?: string | null,
}) => {
  // HACK: key PostsEditForm with usePathname, so that when you navigate off of
  // /editPost and then return, no state belonging to PostsEditFormInner will be
  // preserved. Without this, if you save a post and then return to the edit
  // page, nextjs (starting in next 16 with cacheComponents:true) will keep a
  // copy of the editor's state variables inside an inactive <Activity>, and
  // when resurrected, the useQuery(..., fetchPolicy: "network-only") will
  // return a stale value on its first render. (This is a bug in the interaction
  // between apollo-client and nextjs 16.)
  const pathname = usePathname();
  return <PostsEditFormInner documentId={documentId} version={version} key={pathname}/>
}

export default PostsEditForm;

