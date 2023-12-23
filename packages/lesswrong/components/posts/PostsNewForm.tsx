import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { userCanPost } from '../../lib/collections/posts';
import { postGetPageUrl, postGetEditUrl, isPostCategory, postDefaultCategory } from '../../lib/collections/posts/helpers';
import pick from 'lodash/pick';
import React from 'react';
import { useCurrentUser } from '../common/withUser'
import { useLocation } from '../../lib/routeUtil';
import { NoSSR } from '../../lib/utils/componentsWithChildren';
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

// Also used by PostsEditForm
export const styles = (theme: ThemeType): JssStyles => ({
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
  editorGuideLink: {}
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

export const getPostEditorGuide = (classes: ClassesType) => {
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

const PostsNewForm = ({classes}: {
  classes: ClassesType,
}) => {
  const { query } = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { openDialog } = useDialog();
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SuggestAlignmentPost',
  })
  const templateId = query && query.templateId;
  
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
    fragmentName: 'PostsEdit',
    skip: !templateId,
  });

  const {
    PostSubmit, WrappedSmartForm, LoginForm, SubmitToFrontpageCheckbox,
    RecaptchaWarning, SingleColumnSection, Typography, Loading, PostsAcceptTos,
    NewPostModerationWarning, RateLimitWarning, DynamicTableOfContents,
  } = Components;

  const userHasModerationGuidelines = currentUser && currentUser.moderationGuidelines && currentUser.moderationGuidelines.originalContents
  const debateForm = !!(query && query.debate);

  const questionInQuery = query && !!query.question
  const postCategory = isPostCategory(query.category)
    ? query.category
    : questionInQuery
    ? ("question" as const)
    : postDefaultCategory;

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
    moderationGuidelines: userHasModerationGuidelines ? currentUser!.moderationGuidelines : undefined,
    debate: debateForm,
    postCategory
  }
  const eventForm = query && query.eventForm

  if (query?.subforumTagId) {
    prefilledProps = {
      ...prefilledProps,
      subforumTagId: query.subforumTagId,
      tagRelevance: {[query.subforumTagId]: 1},
    }
  }

  const {document: userWithRateLimit} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersCurrentPostRateLimit",
    fetchPolicy: "cache-and-network",
    skip: !currentUser,
    extraVariables: { eventForm: 'Boolean' },
    extraVariablesValues: { eventForm: !!eventForm }
  });
  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost

  if (!currentUser) {
    return (<LoginForm />);
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

  const NewPostsSubmit = (props: SubmitToFrontpageCheckboxProps & PostSubmitProps) => {
    return <div className={classes.formSubmit}>
      {!eventForm && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit {...props} />
    </div>
  }

  // on LW, show a moderation message to users who haven't been approved yet
  const postWillBeHidden = isLW && !currentUser.reviewedByUserId

  return (
    <DynamicTableOfContents rightColumnChildren={getPostEditorGuide(classes)}>
      <div className={classes.postForm}>
        <RecaptchaWarning currentUser={currentUser}>
          <PostsAcceptTos currentUser={currentUser} />
          {postWillBeHidden && <NewPostModerationWarning />}
          {rateLimitNextAbleToPost && <RateLimitWarning lastRateLimitExpiry={rateLimitNextAbleToPost.nextEligible} rateLimitMessage={rateLimitNextAbleToPost.rateLimitMessage}  />}
          <NoSSR>
              <WrappedSmartForm
                collectionName="Posts"
                mutationFragment={getFragment('PostsPage')}
                prefilledProps={prefilledProps}
                successCallback={(post: any, options: any) => {
                  if (!post.draft) afNonMemberSuccessHandling({currentUser, document: post, openDialog, updateDocument: updatePost});
                  if (options?.submitOptions?.redirectToEditor) {
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
                noSubmitOnCmdEnter
                formComponents={{
                  FormSubmit: NewPostsSubmit
                }}
              />
          </NoSSR>
        </RecaptchaWarning>
      </div>
    </DynamicTableOfContents>

  );
}

const PostsNewFormComponent = registerComponent('PostsNewForm', PostsNewForm, {styles});

declare global {
  interface ComponentTypes {
    PostsNewForm: typeof PostsNewFormComponent
  }
}
