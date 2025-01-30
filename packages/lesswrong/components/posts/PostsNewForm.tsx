import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { userCanPost } from '../../lib/collections/posts';
import { postGetPageUrl, postGetEditUrl, isPostCategory, postDefaultCategory } from '../../lib/collections/posts/helpers';
import pick from 'lodash/pick';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { useLocation } from '../../lib/routeUtil';
import { isAF, isEAForum, isLW, isLWorAF } from '../../lib/instanceSettings';
import { useDialog } from "../common/withDialog";
import { afNonMemberSuccessHandling } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { useUpdate } from "../../lib/crud/withUpdate";
import { useSingle } from '../../lib/crud/withSingle';
import type { SubmitToFrontpageCheckboxProps } from './SubmitToFrontpageCheckbox';
import type { PostSubmitProps } from './PostSubmit';
import { SHARE_POPUP_QUERY_PARAM } from './PostsPage/PostsPage';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import { QuestionIcon } from '../icons/questionIcon';
import DeferRender from '../common/DeferRender';
import { userCanCreateAndEditJargonTerms } from '@/lib/betas';

// Also used by PostsEditForm
export const styles = (theme: ThemeType) => ({
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
  editorGuideOffset: {
    paddingTop: isLW ? 80 : 100,
  },
  editorGuide: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 10,
    borderRadius: theme.borderRadius.default,
    color: theme.palette.primary.main,
    [theme.breakpoints.up('lg')]: {
      width: 'max-content',
      paddingLeft: 20,
      paddingRight: 20
    },
  },
  editorGuideIcon: {
    height: 40,
    width: 40,
    fill: theme.palette.primary.main,
    marginRight: -4
  },
  editorGuideLink: {},
  userFeedbackPromptInput: {
    marginTop: 310,
    position: 'absolute',
    backgroundColor: theme.palette.background.default,
    borderRadius: 4,
    padding: '4px 7px',
    width: 240,
    ['@media (max-width: 1590px)']: {
      display: 'none',
    },
  }
})

const prefillFromTemplate = (template: PostsEdit) => {
  return pick(
    template,
    [
      "contents",
      "activateRSVPs",
      "location",
      "googleLocation",
      "onlineEvent",
      "globalEvent",
      "startTime",
      "endTime",
      "localStartTime",
      "localEndTime",
      "eventRegistrationLink",
      "joinEventLink",
      "website",
      "contactInfo",
      "isEvent",
      "eventImageId",
      "eventType",
      "types",
      "groupId",
      "group",
      "title",
      "coauthorStatuses",
      "hasCoauthorPermission",
    ]
  )
}

export const getPostEditorGuide = (classes: ClassesType<typeof styles>) => {
  const {LWTooltip, NewPostHowToGuides} = Components;
  if (isLWorAF) {
    return (
      <div className={classes.editorGuideOffset}>
        <LWTooltip title='The Editor Guide covers sharing drafts, co-authoring, crossposting, LaTeX, footnotes, internal linking, and more!'>
          <div className={classes.editorGuide}>
            <QuestionIcon className={classes.editorGuideIcon} />
            <div className={classes.editorGuideLink}>
              <Link to="/tag/guide-to-the-lesswrong-editor">Editor Guide / FAQ</Link>
            </div>
          </div>
        </LWTooltip>
      </div>
    );
  }
  if (isEAForum) {
    return <NewPostHowToGuides />;
  }
  return undefined;
}

function getPostCategory(query: Record<string, string>, questionInQuery: boolean) {
  return isPostCategory(query.category)
    ? query.category
    : questionInQuery
      ? ("question" as const)
      : postDefaultCategory;
}

/**
 * This is to pre-hydrate the apollo cache for when we redirect to PostsEditForm after doing an autosave.
 * If we don't do that, the user will experience an unfortunate loading state.
 * The transition still isn't totally seamless because ckEditor needs to remount, but if you blink you can miss it.
 * We also use userWithRateLimit (UsersCurrentPostRateLimit) on both pages, but that's less critical.
 * 
 * We don't rely on fetching the document with the initial `useSingle`, but only on the refetch - this is basically a hacky way to imperatively run a query on demand
 */
function usePrefetchForAutosaveRedirect() {
  const { refetch: fetchAutosavedPostForEditPage } = useSingle({
    documentId: undefined,
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    skip: true,
  });

  const extraVariablesValues = { version: 'draft' };

  const { refetch: fetchAutosavedPostForEditForm } = useSingle({
    documentId: undefined,
    collectionName: "Posts",
    fragmentName: 'PostsEditQueryFragment',
    extraVariables: { version: 'String' },
    extraVariablesValues,
    fetchPolicy: 'network-only',
    skip: true,
  });

  const prefetchPostFragmentsForRedirect = (postId: string) => {
    return Promise.all([
      fetchAutosavedPostForEditPage({ input: { selector: { documentId: postId } } }),
      fetchAutosavedPostForEditForm({ input: { selector: { documentId: postId }, resolverArgs: extraVariablesValues }, ...extraVariablesValues })
    ]);
  };

  return prefetchPostFragmentsForRedirect;
}

const PostsNewForm = ({classes, showTableOfContents, fields}: {
  showTableOfContents?: boolean,
  fields?: string[],
  classes: ClassesType<typeof styles>,
}) => {
  const {
    PostSubmit, WrappedSmartForm, LoginForm, SubmitToFrontpageCheckbox,
    RecaptchaWarning, SingleColumnSection, Typography, Loading, PostsAcceptTos,
    NewPostModerationWarning, RateLimitWarning, DynamicTableOfContents,
  } = Components;

  const { query } = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { openDialog } = useDialog();

  const prefetchPostFragmentsForRedirect = usePrefetchForAutosaveRedirect();

  const templateId = query && query.templateId;
  const debateForm = !!(query && query.debate);
  const questionInQuery = query && !!query.question;
  const eventForm = query && query.eventForm

  const postCategory = getPostCategory(query, questionInQuery);
  
  // on LW, show a moderation message to users who haven't been approved yet
  const postWillBeHidden = isLW && !currentUser?.reviewedByUserId

  // if we are trying to create an event in a group,
  // we want to prefill the "onlineEvent" checkbox if the group is online
  const { document: groupData } = useSingle({
    collectionName: "Localgroups",
    fragmentName: 'localGroupsIsOnline',
    documentId: query && query.groupId,
    skip: !query || !query.groupId
  });

  const { document: templateDocument, loading: templateLoading } = useSingle({
    documentId: templateId,
    collectionName: "Posts",
    fragmentName: 'PostsEditMutationFragment',
    skip: !templateId,
  });

  // `UsersCurrent` doesn't have the editable field with their originalContents for performance reasons, so we need to fetch them explicitly
  const { document: currentUserWithModerationGuidelines } = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersEdit",
    skip: !currentUser,
  });

  const { document: userWithRateLimit } = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersCurrentPostRateLimit",
    fetchPolicy: "cache-and-network",
    skip: !currentUser,
    extraVariables: { eventForm: 'Boolean' },
    extraVariablesValues: { eventForm: !!eventForm }
  });

  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost;

  let prefilledProps = templateDocument ? prefillFromTemplate(templateDocument) : {
    isEvent: query && !!query.eventForm,
    question: (postCategory === "question") || questionInQuery,
    activateRSVPs: true,
    onlineEvent: groupData?.isOnline,
    globalEvent: groupData?.isOnline,
    types: query && query.ssc ? ['SSC'] : [],
    meta: query && !!query.meta,
    af: isAF || (query && !!query.af),
    groupId: query && query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    moderationGuidelines: currentUserWithModerationGuidelines?.moderationGuidelines ?? undefined,
    generateDraftJargon: currentUser?.generateJargonForDrafts,
    debate: debateForm,
    postCategory
  }

  if (query?.subforumTagId || query?.tagId) {
    prefilledProps = {
      ...prefilledProps,
      subforumTagId: query.subforumTagId || query.tagId,
      tagRelevance: {[query.subforumTagId || query.tagId]: 1},
    }
  }

  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  });

  if (!currentUser) {
    return (<LoginForm />);
  }
  if (!currentUserWithModerationGuidelines) {
    return <Loading/>
  }

  if (!userCanPost(currentUser)) {
    return (<SingleColumnSection>
      <Typography variant="display1">
        You don't have permission to post
      </Typography>
    </SingleColumnSection>);
  }

  if (templateId && templateLoading) {
    return <Loading />
  }

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const NewPostsSubmit = (props: SubmitToFrontpageCheckboxProps & PostSubmitProps) => {
    return <div className={classes.formSubmit}>
      {!eventForm && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit {...props} />
    </div>
  }

  const addFields: string[] = [];
  
  // This is a resolver-only field, so we need to add it to the addFields array to get it to show up in the form
  if (userCanCreateAndEditJargonTerms(currentUser)) {
    addFields.push('glossary');
  }

  const editor = <div className={classes.postForm}>
    <RecaptchaWarning currentUser={currentUser}>
      <PostsAcceptTos currentUser={currentUser} />
      {postWillBeHidden && <NewPostModerationWarning />}
      {rateLimitNextAbleToPost && <RateLimitWarning lastRateLimitExpiry={rateLimitNextAbleToPost.nextEligible} rateLimitMessage={rateLimitNextAbleToPost.rateLimitMessage}  />}
      <DeferRender ssr={false}>
          <WrappedSmartForm
            collectionName="Posts"
            mutationFragment={getFragment('PostsPage')}
            prefilledProps={prefilledProps}
            successCallback={(post: any, options: any) => {
              if (!post.draft) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost});
              if (options?.submitOptions?.noReload) {
                // First prefetch the relevant post fragments to hydrate the apollo cache, then do the navigation after that's done
                void prefetchPostFragmentsForRedirect(post._id).then(() => {
                  const editPostUrl = `${postGetEditUrl(post._id, false, post.linkSharingKey)}&autosaveRedirect=true`;
                  navigate(editPostUrl, { replace: true });
                });
              } else if (options?.submitOptions?.redirectToEditor) {
                navigate(postGetEditUrl(post._id));
              } else {
                // If they are publishing a non-draft post, show the share popup
                const showSharePopup = !isLWorAF && !post.draft
                const sharePostQuery = `?${SHARE_POPUP_QUERY_PARAM}=true`
                const url  = postGetPageUrl(post);
                navigate({pathname: url, search: showSharePopup ? sharePostQuery: ''})

                const postDescription = post.draft ? "Draft" : "Post";
                if (!showSharePopup) {
                  flash({ messageString: `${postDescription} created`, type: 'success'});
                }
              }
            }}
            eventForm={eventForm}
            debateForm={debateForm}
            repeatErrors
            {...(fields ? {fields: fields} : {})}
            addFields={addFields}
            noSubmitOnCmdEnter
            formComponents={{
              FormSubmit: NewPostsSubmit
            }}
          />
      </DeferRender>
    </RecaptchaWarning>
  </div>


  if (!showTableOfContents) {
    return editor;
  }

  return (
    <DynamicTableOfContents rightColumnChildren={getPostEditorGuide(classes)}>
      {editor}
    </DynamicTableOfContents>

  );
}

const PostsNewFormComponent = registerComponent('PostsNewForm', PostsNewForm, {styles});

declare global {
  interface ComponentTypes {
    PostsNewForm: typeof PostsNewFormComponent
  }
}
